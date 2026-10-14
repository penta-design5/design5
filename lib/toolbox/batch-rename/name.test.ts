import { describe, expect, it } from 'vitest'
import { addFiles, moveItem, sortByOriginalName } from './list'
import { buildNewName, buildNewNames, firstOverflowNumber, parseRule, sanitizeBaseName, splitExtension, zipFileName } from './name'

const rule = (baseName: string, start = 1, digits = 3) => ({ baseName, start, digits })

describe('splitExtension', () => {
  it.each([
    ['report.pptx', 'report', 'pptx'],
    ['a.tar.gz', 'a.tar', 'gz'],
    ['Photo.JPG', 'Photo', 'JPG'],
    ['.env', '.env', ''],
    ['README', 'README', ''],
    ['file.', 'file.', ''],
    ['[공지] 2024 사내 통합 인증 사용 가이드.pdf', '[공지] 2024 사내 통합 인증 사용 가이드', 'pdf'],
  ])('%s', (name, base, ext) => {
    expect(splitExtension(name)).toEqual({ base, ext })
  })
})

describe('buildNewName', () => {
  it('공통 이름_순번.원래 확장자', () => {
    expect(buildNewNames(['a.pptx', 'b.pptx', 'c.pdf'], rule('상품이미지'))).toEqual([
      '상품이미지_001.pptx',
      '상품이미지_002.pptx',
      '상품이미지_003.pdf',
    ])
  })
  it('확장자 대소문자 유지·확장자 없음·이중 확장자', () => {
    expect(buildNewName('IMG.JPG', 0, rule('x'))).toBe('x_001.JPG')
    expect(buildNewName('README', 1, rule('x'))).toBe('x_002')
    expect(buildNewName('backup.tar.gz', 0, rule('x'))).toBe('x_001.gz')
  })
  it('공통 이름이 비면 번호만', () => {
    expect(buildNewName('a.png', 0, rule(''))).toBe('001.png')
  })
  it('시작 번호·자릿수', () => {
    expect(buildNewName('a.png', 2, rule('p', 0, 1))).toBe('p_2.png')
    expect(buildNewName('a.png', 0, rule('p', 7, 5))).toBe('p_00007.png')
    expect(buildNewName('a.png', 0, rule('p', 1234, 2))).toBe('p_1234.png')
  })
})

describe('sanitizeBaseName', () => {
  it('금지 문자는 _로', () => {
    expect(sanitizeBaseName('a/b:c*d?"e"<f>|g\\h')).toMatchObject({ value: 'a_b_c_d__e__f__g_h', replacedChars: true })
  })
  it('앞뒤 공백·끝 점 제거', () => {
    expect(sanitizeBaseName('  상품 이미지 . ')).toMatchObject({ value: '상품 이미지', trimmedEnd: true, replacedChars: false })
    expect(sanitizeBaseName('   ')).toMatchObject({ value: '', trimmedEnd: false })
  })
  it('Windows 예약 이름', () => {
    expect(sanitizeBaseName('con')).toMatchObject({ value: 'con_', reserved: true })
    expect(sanitizeBaseName('COM3')).toMatchObject({ value: 'COM3_', reserved: true })
    expect(sanitizeBaseName('console')).toMatchObject({ value: 'console', reserved: false })
  })
  it('제어 문자', () => {
    expect(sanitizeBaseName('a\tb').value).toBe('a_b')
  })
})

describe('parseRule', () => {
  it('정상', () => {
    expect(parseRule(' 사진/ ', '0', '2')).toEqual({ ok: true, rule: { baseName: '사진_', start: 0, digits: 2 } })
  })
  it('잘못된 숫자는 칸별 오류', () => {
    const r = parseRule('a', '', '7')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.start).toContain('0 ~ 999,999')
      expect(r.errors.digits).toContain('1 ~ 6')
    }
    expect(parseRule('a', '-1', '3').ok).toBe(false)
    expect(parseRule('a', '1.5', '3').ok).toBe(false)
    expect(parseRule('a', '1000000', '3').ok).toBe(false)
    expect(parseRule('a', '1', '0').ok).toBe(false)
  })
})

describe('firstOverflowNumber', () => {
  it('자릿수를 넘는 첫 번호', () => {
    expect(firstOverflowNumber(999, { start: 1, digits: 3 })).toBeNull()
    expect(firstOverflowNumber(1000, { start: 1, digits: 3 })).toBe(1000)
    expect(firstOverflowNumber(1000, { start: 0, digits: 3 })).toBeNull()
    expect(firstOverflowNumber(5, { start: 8, digits: 1 })).toBe(10)
    expect(firstOverflowNumber(2, { start: 150, digits: 2 })).toBe(150)
    expect(firstOverflowNumber(0, { start: 1, digits: 1 })).toBeNull()
  })
})

describe('zipFileName', () => {
  it('공통 이름.zip, 비면 renamed_files.zip', () => {
    expect(zipFileName('상품이미지')).toBe('상품이미지.zip')
    expect(zipFileName(' ')).toBe('renamed_files.zip')
  })
})

describe('moveItem·sortByOriginalName', () => {
  const f = (name: string) => ({ name, size: 1 }) as File
  let n = 0
  const make = (names: string[]) => addFiles([], names.map(f), () => `i${++n}`).items
  const names = (items: { originalName: string }[]) => items.map((i) => i.originalName)

  it('위/아래로 한 칸, 범위 밖은 그대로', () => {
    const items = make(['a', 'b', 'c'])
    expect(names(moveItem(items, 1, -1))).toEqual(['b', 'a', 'c'])
    expect(names(moveItem(items, 1, 1))).toEqual(['a', 'c', 'b'])
    expect(names(moveItem(items, 0, -1))).toEqual(['a', 'b', 'c'])
    expect(names(moveItem(items, 2, 1))).toEqual(['a', 'b', 'c'])
    expect(names(items)).toEqual(['a', 'b', 'c'])
  })
  it('자연 정렬(숫자·대소문자, 한국어 규칙이라 한글이 영문보다 앞)', () => {
    const items = make(['file10.png', 'File2.png', 'file1.png', '나.txt', '가.txt', 'b.txt', 'A.txt'])
    expect(names(sortByOriginalName(items))).toEqual(['가.txt', '나.txt', 'A.txt', 'b.txt', 'file1.png', 'File2.png', 'file10.png'])
  })
})
