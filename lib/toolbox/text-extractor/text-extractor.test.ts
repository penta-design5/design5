import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { groupLines, layoutText, type TextBox } from './layout'
import { OCR_MODEL_FILES, OCR_MODEL_TOTAL_BYTES } from './model'
import {
  DET_LIMIT_SIDE,
  REC_HEIGHT,
  REC_MAX_WIDTH,
  buildCharset,
  ctcDecode,
  detInputSize,
  fillDetTensor,
  fillRecTensor,
  findTextBoxes,
  recInputWidth,
} from './ocr'
import {
  PDFJS_ASSETS,
  PDFJS_VERSION,
  PDF_MAX_PAGES,
  defaultPageRange,
  hasUsableTextLayer,
  isPdfFile,
  joinPages,
  mergeLineFragments,
  multiplyTransform,
  parsePageRange,
  renderScale,
  summarizePages,
  textItemsToBoxes,
  validatePdfFile,
} from './pdf'
import { layoutTextLayer } from './pdf-document'
import { centerInside, isUsableRegion, mapFromRegion, normalizeBox, rectFromDrag, toPixelRect } from './region'
import { countCharacters, fixPunctuationSpacing, textFileName } from './text'

const box = (x0: number, y0: number, x1: number, y1: number, text: string): TextBox => ({ x0, y0, x1, y1, text })

describe('모델 파일', () => {
  it('public/ 파일의 크기·SHA-256이 코드 상수와 같다', () => {
    for (const file of Object.values(OCR_MODEL_FILES)) {
      const bytes = readFileSync(join(process.cwd(), 'public', file.url))
      expect(bytes.length).toBe(file.bytes)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256)
    }
  })

  it('사전 글자 수 + 빈칸 + 띄어쓰기 = 인식 출력 칸 수(11,947)', () => {
    const dict = readFileSync(join(process.cwd(), 'public', OCR_MODEL_FILES.dict.url), 'utf8')
    const charset = buildCharset(dict)
    expect(charset.length).toBe(11_947)
    expect(charset[0]).toBe('')
    expect(charset[charset.length - 1]).toBe(' ')
    expect(charset).toContain('가')
    expect(OCR_MODEL_TOTAL_BYTES).toBe(4_745_517 + 13_401_252 + 47_451)
  })
})

describe('감지 전처리·후처리', () => {
  it('긴 변을 1,600 이하·32의 배수로 줄이고 키우지는 않는다', () => {
    expect(detInputSize({ width: 3200, height: 1600 })).toEqual({ width: 1600, height: 800 })
    expect(detInputSize({ width: 1094, height: 1372 })).toEqual({ width: 1088, height: 1376 })
    expect(detInputSize({ width: 10, height: 10 })).toEqual({ width: 32, height: 32 })
    const big = detInputSize({ width: 5000, height: 20 })
    expect(Math.max(big.width, big.height)).toBeLessThanOrEqual(DET_LIMIT_SIDE)
  })

  it('감지 텐서는 BGR 순서·ImageNet 정규화, 투명은 흰색', () => {
    // 픽셀 1개: 빨강(불투명) / 픽셀 2개: 완전 투명
    const out = fillDetTensor(new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0]), 2, 1)
    const plane = 2
    expect(out[0]).toBeCloseTo((0 - 0.485) / 0.229) // B
    expect(out[2 * plane]).toBeCloseTo((1 - 0.406) / 0.225) // R
    expect(out[1]).toBeCloseTo((1 - 0.485) / 0.229) // 투명 → 흰색
  })

  it('확률 맵의 덩어리를 상자로 찾고 원본 좌표로 넓힌다', () => {
    const w = 40
    const h = 20
    const prob = new Float32Array(w * h)
    // 글자 덩어리: x 5~24, y 5~9 (점수 0.9) / 잡음 1px (버림) / 확률 낮은 덩어리(버림)
    for (let y = 5; y <= 9; y++) for (let x = 5; x <= 24; x++) prob[y * w + x] = 0.9
    prob[15 * w + 35] = 0.9
    for (let y = 14; y <= 18; y++) for (let x = 2; x <= 12; x++) prob[y * w + x] = 0.35
    const boxes = findTextBoxes(prob, { width: w, height: h }, { width: 80, height: 40 })
    expect(boxes).toHaveLength(1)
    const [b] = boxes
    expect(b.score).toBeCloseTo(0.9)
    // 20×5 상자, 넓힘 d = 100×1.6/(2×25) = 3.2 → (5−3.2)×2 = 3.6 … (25+3.2)×2 = 56.4
    expect(b.x0).toBeCloseTo(3.6)
    expect(b.x1).toBeCloseTo(56.4)
    expect(b.y0).toBeCloseTo(3.6)
    expect(b.y1).toBeCloseTo(26.4)
  })

  it('넓힌 상자는 이미지 밖으로 나가지 않는다', () => {
    const prob = new Float32Array(10 * 10).fill(0.9)
    const [b] = findTextBoxes(prob, { width: 10, height: 10 }, { width: 100, height: 100 })
    expect(b).toMatchObject({ x0: 0, y0: 0, x1: 100, y1: 100 })
  })
})

describe('인식 전처리·후처리', () => {
  it('인식 폭은 높이 48 기준 비율, 8~3,200으로 제한', () => {
    expect(recInputWidth(200, 24)).toBe(400)
    expect(recInputWidth(2, 48)).toBe(8)
    expect(recInputWidth(100_000, 10)).toBe(REC_MAX_WIDTH)
  })

  it('인식 텐서는 BGR·(v−0.5)/0.5', () => {
    const out = fillRecTensor(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1)
    expect(Array.from(out)).toEqual([1, 1, 1])
    expect(fillRecTensor(new Uint8ClampedArray(4 * 8 * REC_HEIGHT), 8).length).toBe(3 * 8 * REC_HEIGHT)
  })

  it('CTC: 빈칸·연속 중복을 빼고, 빈칸 사이 같은 글자는 살린다', () => {
    const charset = ['', '가', '나', ' ']
    // 시점별 최고 칸: 가 가 빈칸 가 나 띄어쓰기 나
    const best = [1, 1, 0, 1, 2, 3, 2]
    const data = best.flatMap((b) => charset.map((_, c) => (c === b ? 0.8 : 0.05)))
    const { text, confidence } = ctcDecode(data, best.length, charset.length, charset)
    expect(text).toBe('가가나 나')
    expect(confidence).toBeCloseTo(0.8)
    expect(ctcDecode([0.9, 0.1, 0, 0], 1, 4, charset)).toEqual({ text: '', confidence: 0 })
  })

  it('사전은 CRLF·끝 줄바꿈을 처리한다', () => {
    expect(buildCharset('a\r\nb\r\n')).toEqual(['', 'a', 'b', ' '])
    expect(buildCharset('a\nb')).toEqual(['', 'a', 'b', ' '])
  })
})

describe('줄 배치(layoutText)', () => {
  it('같은 높이는 한 줄(왼쪽부터), 위에서 아래로', () => {
    const boxes = [box(200, 0, 300, 20, '세계'), box(0, 0, 150, 20, '안녕하세요'), box(0, 30, 300, 50, '둘째 줄')]
    expect(layoutText(boxes)).toBe('안녕하세요 세계\n둘째 줄')
    expect(groupLines(boxes)).toHaveLength(2)
  })

  it('좌우 2단 문단은 왼쪽 단을 다 읽고 오른쪽 단을 읽는다', () => {
    const left = [0, 1, 2].map((i) => box(0, i * 30, 400, i * 30 + 20, `왼${i}`))
    const right = [0, 1, 2].map((i) => box(500, i * 30, 900, i * 30 + 20, `오${i}`))
    expect(layoutText([...right, ...left])).toBe('왼0\n왼1\n왼2\n오0\n오1\n오2')
  })

  it('표(줄마다 칸 여러 개)는 행 단위로 읽는다', () => {
    const rows = [0, 1, 2].flatMap((i) => [
      box(0, i * 30, 300, i * 30 + 20, `항목${i}`),
      box(400, i * 30, 450, i * 30 + 20, `${i}.1`),
      box(500, i * 30, 550, i * 30 + 20, `${i}.2`),
      box(600, i * 30, 650, i * 30 + 20, `${i}.3`),
    ])
    expect(layoutText(rows)).toBe('항목0 0.1 0.2 0.3\n항목1 1.1 1.2 1.3\n항목2 2.1 2.2 2.3')
  })

  it('영수증(좁은 금액 열)은 행 단위로 읽는다', () => {
    const rows = [0, 1, 2].flatMap((i) => [box(0, i * 30, 500, i * 30 + 20, `품목${i}`), box(800, i * 30, 900, i * 30 + 20, `${i},000`)])
    expect(layoutText(rows)).toBe('품목0 0,000\n품목1 1,000\n품목2 2,000')
  })

  it('빈 글자·크기 없는 상자는 무시', () => {
    expect(layoutText([])).toBe('')
    expect(layoutText([box(0, 0, 10, 10, '  '), box(5, 5, 5, 9, '가')])).toBe('')
  })
})

describe('결과 정리', () => {
  it('한글 사이 마침표·쉼표 뒤에만 띄어쓰기를 넣는다', () => {
    expect(fixPunctuationSpacing('많다.그러나 아니라,전력망')).toBe('많다. 그러나 아니라, 전력망')
    expect(fixPunctuationSpacing('0.5% 상승 12,545원 www.example.com 이미. 띄움')).toBe('0.5% 상승 12,545원 www.example.com 이미. 띄움')
  })

  it('글자 수는 공백·줄바꿈 제외', () => {
    expect(countCharacters('가 나\n다 ')).toBe(3)
  })

  it('저장 파일명은 원본 이름 + .txt', () => {
    expect(textFileName('영수증.jpg')).toBe('영수증.txt')
    expect(textFileName('a:b.png')).toBe('a_b.txt')
    expect(textFileName(null)).toBe('extracted-text.txt')
  })
})

describe('PDF', () => {
  const readPublic = (p: string) => readFileSync(join(process.cwd(), 'public', p))

  it('pdf.js 보조 파일·워커가 설치된 pdfjs-dist와 같은 버전', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'node_modules/pdfjs-dist/package.json'), 'utf8'))
    expect(pkg.version).toBe(PDFJS_VERSION)
    expect(readPublic(PDFJS_ASSETS.workerSrc).toString('utf8')).toContain(`"${PDFJS_VERSION}"`)
    expect(readPublic(PDFJS_ASSETS.module).equals(readFileSync(join(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.min.mjs')))).toBe(true)
    for (const f of ['wasm/openjpeg.wasm', 'wasm/qcms_bg.wasm', 'cmaps/UniKS-UCS2-H.bcmap', 'standard_fonts/LiberationSans-Regular.ttf']) {
      const sub = f.split('/')
      const published = readPublic(`js/pdfjs/${f}`)
      const installed = readFileSync(join(process.cwd(), 'node_modules/pdfjs-dist', ...sub))
      expect(published.equals(installed)).toBe(true)
    }
  })

  it('PDF 판별·크기 검증', () => {
    expect(isPdfFile({ name: 'a.PDF', type: '' })).toBe(true)
    expect(isPdfFile({ name: 'a', type: 'application/pdf' })).toBe(true)
    expect(isPdfFile({ name: 'a.png', type: 'image/png' })).toBe(false)
    expect(validatePdfFile({ size: 10 })).toBeNull()
    expect(validatePdfFile({ size: 0 })).toMatch('빈 파일')
    expect(validatePdfFile({ size: 51 * 1024 * 1024 })).toMatch('50MB')
  })

  it('페이지 범위 — 기본 1~50쪽, 검증', () => {
    expect(defaultPageRange(3)).toEqual({ start: 1, end: 3 })
    expect(defaultPageRange(120)).toEqual({ start: 1, end: PDF_MAX_PAGES })
    expect(parsePageRange(' 2 ', '5', 10)).toEqual({ range: { start: 2, end: 5 } })
    expect(parsePageRange('', '5', 10)).toHaveProperty('error')
    expect(parsePageRange('1.5', '5', 10)).toHaveProperty('error')
    expect(parsePageRange('0', '5', 10)).toEqual({ error: '1 ~ 10쪽 사이로 입력해 주세요.' })
    expect(parsePageRange('1', '11', 10)).toHaveProperty('error')
    expect(parsePageRange('6', '5', 10)).toEqual({ error: '시작 페이지가 끝 페이지보다 큽니다.' })
    expect(parsePageRange('1', '51', 100)).toEqual({ error: '한 번에 50쪽까지 추출할 수 있습니다.' })
    expect(parsePageRange('51', '100', 100)).toEqual({ range: { start: 51, end: 100 } })
  })

  it('텍스트 레이어는 공백 제외 20자 이상일 때만 쓴다', () => {
    expect(hasUsableTextLayer('  - 3 -  ')).toBe(false)
    expect(hasUsableTextLayer('가'.repeat(19) + ' \n')).toBe(false)
    expect(hasUsableTextLayer('가'.repeat(20))).toBe(true)
  })

  it('텍스트 항목 → 화면 좌표 상자(뷰포트 뒤집기 반영)', () => {
    // A4(595×842) 배율 1 뷰포트: y 뒤집기
    const viewport = [1, 0, 0, -1, 0, 842]
    expect(multiplyTransform(viewport, [1, 0, 0, 1, 0, 0])).toEqual([1, 0, 0, -1, 0, 842])
    const [b] = textItemsToBoxes([{ str: '안녕', transform: [10, 0, 0, 10, 100, 742], width: 20 }, { str: ' ', transform: [10, 0, 0, 10, 0, 0], width: 3 }], viewport)
    expect(b).toEqual({ x0: 100, x1: 120, y0: 90, y1: 102, text: '안녕 ' })
  })

  it('PDF 조각: 같은 줄 가까운 조각은 합치고(맞닿으면 붙이고 공백·단어 간격이면 띄움), 멀면 따로', () => {
    const viewport = [1, 0, 0, -1, 0, 842]
    // 글자 크기 10 → 붙임 기준 간격 1.5, 합침 기준 간격 10
    const item = (str: string, x: number, width: number) => ({ str, transform: [10, 0, 0, 10, x, 742], width })
    const boxes = textItemsToBoxes(
      [item('안녕', 100, 20), item('하세요', 120, 30), item(' ', 150, 3), item('반갑', 153, 20), item('습니다', 173, 30), item('여러분', 205, 30), item('오른쪽', 400, 30)],
      viewport
    )
    expect(boxes.map((b) => b.text)).toEqual(['안녕', '하세요 ', '반갑', '습니다', '여러분', '오른쪽'])
    const merged = mergeLineFragments(boxes)
    expect(merged.map((b) => b.text)).toEqual(['안녕하세요 반갑습니다 여러분', '오른쪽'])
    expect(merged[0]).toMatchObject({ x0: 100, x1: 235 })
    expect(layoutText(merged)).toBe('안녕하세요 반갑습니다 여러분 오른쪽')
  })

  it('렌더 배율 — 긴 변 기준, 1~4배', () => {
    expect(renderScale({ width: 595, height: 842 }, 2400)).toBeCloseTo(2400 / 842)
    expect(renderScale({ width: 100, height: 100 }, 2400)).toBe(4)
    expect(renderScale({ width: 5000, height: 3000 }, 2400)).toBe(1)
  })

  it('페이지 합치기·요약', () => {
    const one = [{ page: 3, text: '본문', source: 'ocr' as const }]
    expect(joinPages(one)).toBe('본문')
    const many = [
      { page: 1, text: '첫 쪽\n', source: 'text' as const },
      { page: 2, text: '', source: 'ocr' as const },
      { page: 3, text: '셋째', source: 'text' as const },
    ]
    expect(joinPages(many)).toBe('--- 1쪽 ---\n첫 쪽\n\n--- 2쪽 ---\n\n--- 3쪽 ---\n셋째')
    expect(summarizePages(many)).toBe('3쪽 · PDF 글자 2쪽 · OCR 1쪽')
    expect(summarizePages(one)).toBe('1쪽 · OCR 1쪽')
  })
})

describe('영역 지정(P3)', () => {
  it('드래그 → 정규화 사각형(방향 무관·0~1로 자름)', () => {
    expect(rectFromDrag({ x: 0.8, y: 0.6 }, { x: 0.2, y: 0.1 })).toEqual({ x0: 0.2, y0: 0.1, x1: 0.8, y1: 0.6 })
    expect(rectFromDrag({ x: -0.2, y: 0.5 }, { x: 1.3, y: 1.1 })).toEqual({ x0: 0, y0: 0.5, x1: 1, y1: 1 })
  })

  it('픽셀 사각형은 바깥쪽 반올림·이미지 안, 최소 8px', () => {
    expect(toPixelRect({ x0: 0.1, y0: 0.25, x1: 0.505, y1: 0.75 }, 1000, 400)).toEqual({ x: 100, y: 100, width: 405, height: 200 })
    expect(toPixelRect({ x0: 0.99, y0: 0, x1: 1, y1: 1 }, 1000, 400)).toEqual({ x: 990, y: 0, width: 10, height: 400 })
    expect(isUsableRegion({ x0: 0, y0: 0, x1: 0.007, y1: 1 }, 1000, 400)).toBe(false)
    expect(isUsableRegion({ x0: 0, y0: 0, x1: 0.01, y1: 0.02 }, 1000, 400)).toBe(true)
  })

  it('잘라 낸 영역 기준 상자 → 전체 기준, 픽셀 → 정규화', () => {
    const region = { x0: 0.5, y0: 0.2, x1: 1, y1: 0.6 }
    expect(mapFromRegion({ x0: 0, y0: 0, x1: 1, y1: 0.5, text: 'a' }, region)).toEqual({ x0: 0.5, y0: 0.2, x1: 1, y1: 0.4, text: 'a' })
    expect(normalizeBox({ x0: 50, y0: 10, x1: 100, y1: 30, text: 'b' }, 200, 100)).toEqual({ x0: 0.25, y0: 0.1, x1: 0.5, y1: 0.3, text: 'b' })
    expect(centerInside({ x0: 0.55, y0: 0.25, x1: 0.65, y1: 0.35 }, region)).toBe(true)
    expect(centerInside({ x0: 0.3, y0: 0.25, x1: 0.6, y1: 0.35 }, region)).toBe(false)
  })

  it('PDF 텍스트 레이어: 영역 안(중심) 조각만, 합치기 전에 고른다', () => {
    const viewport = [1, 0, 0, -1, 0, 100]
    const item = (str: string, x: number, y: number, width: number) => ({ str, transform: [10, 0, 0, 10, x, 100 - y], width })
    const layer = {
      boxes: textItemsToBoxes([item('왼쪽', 10, 20, 20), item('오른쪽', 30, 20, 30), item('아래', 10, 80, 20)], viewport),
      width: 100,
      height: 100,
    }
    expect(layoutTextLayer(layer).text).toBe('왼쪽오른쪽\n아래')
    // 오른쪽 위 영역 → 「오른쪽」만(맞닿은 「왼쪽」은 섞이지 않음)
    const picked = layoutTextLayer(layer, { x0: 0.28, y0: 0, x1: 1, y1: 0.5 })
    expect(picked.text).toBe('오른쪽')
    expect(picked.lines[0]).toMatchObject({ x0: 0.3, x1: 0.6, text: '오른쪽' })
  })
})
