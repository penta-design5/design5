/**
 * 「추출되지 않은 내용」 안내 — 문서에서 실제로 빠진 것만 개수와 함께 알린다(빠진 게 없으면 안내 없음).
 * 개수 세기는 형식별 모듈(`office.ts`·`use-ocr`의 PDF 그림 검사)이 하고, 여기서는 문구만 만든다(순수 함수).
 */

export interface Omission {
  /** 「각주·미주 3개」 */
  label: string
  /** 대처 방법(없으면 생략) */
  hint?: string
}

/** 형식별로 센 개수 — 0이거나 없으면 안내하지 않는다 */
export interface OmissionStats {
  headerFooter?: number
  notes?: number
  autoNumbering?: number
  comments?: number
  images?: number
  slideNotes?: number
  smartArt?: number
  charts?: number
  formattedNumbers?: number
  /** PDF: 글자로 읽은 페이지 중 그림이 있는 페이지 번호 */
  pdfImagePages?: number[]
}

const IMAGE_HINT = '그림 속 글자가 필요하면 그림을 캡처해 이미지로 추출하세요.'
const ORIGINAL_HINT = '필요하면 원본 문서에서 확인하세요.'

/** 페이지 번호 목록 → 「3·5·7쪽」(많으면 앞 5개 + 「외 N쪽」) */
export function formatPageList(pages: number[]): string {
  const shown = pages.slice(0, 5).join('·')
  return pages.length > 5 ? `${shown}쪽 외 ${pages.length - 5}쪽` : `${shown}쪽`
}

export function buildOmissions(stats: OmissionStats): Omission[] {
  const out: Omission[] = []
  const add = (count: number | undefined, label: (n: number) => string, hint?: string) => {
    if (count && count > 0) out.push({ label: label(count), hint })
  }
  add(stats.headerFooter, (n) => `머리말·꼬리말 ${n}곳`, ORIGINAL_HINT)
  add(stats.notes, (n) => `각주·미주 ${n}개`, ORIGINAL_HINT)
  add(stats.autoNumbering, (n) => `자동 번호 목록 ${n}문단`, '번호(1., 가. 등)는 문서 서식이라 빠지고 내용만 나옵니다.')
  add(stats.slideNotes, (n) => `슬라이드 노트 ${n}장`, ORIGINAL_HINT)
  add(stats.smartArt, (n) => `SmartArt ${n}개`, 'SmartArt 도형 안의 글자는 별도로 저장되어 추출되지 않습니다. 원본에서 확인하세요.')
  add(stats.charts, (n) => `차트 ${n}개`, '차트 제목·축·데이터 레이블은 추출되지 않습니다.')
  add(stats.comments, (n) => `메모 ${n}개`, ORIGINAL_HINT)
  add(stats.formattedNumbers, (n) => `표시 서식이 있는 숫자 ${n}칸`, '쉼표·통화 기호·백분율 등의 서식 없이 원래 숫자로 나옵니다.')
  add(stats.images, (n) => `그림 ${n}개`, IMAGE_HINT)
  if (stats.pdfImagePages && stats.pdfImagePages.length > 0) {
    out.push({
      label: `그림이 있는 페이지 ${formatPageList(stats.pdfImagePages)}`,
      hint: 'PDF에 들어 있는 글자만 읽어서 그림 속 글자는 빠졌습니다. 필요하면 「모든 페이지를 OCR로 읽기」를 켜고 다시 추출하세요.',
    })
  }
  return out
}
