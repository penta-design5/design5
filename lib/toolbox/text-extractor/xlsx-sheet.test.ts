import { describe, expect, it } from 'vitest'
import {
  applyTint,
  cellKey,
  columnName,
  columnWidthPx,
  formatCellNumber,
  formatCellText,
  maxDigitWidth,
  parseCellRef,
  readSheetModel,
  readThemeColors,
  readWorkbookStyles,
  resolveColor,
  splitFormatSections,
  textArea,
  type WorkbookStyles,
} from './xlsx-sheet'

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'

describe('Excel 미리보기 — 색', () => {
  const theme = readThemeColors(null)
  const ctx = { theme, indexed: ['000000', 'FFFFFF', 'FF0000'] }
  const color = (attrs: string) => resolveColor(new DOMParser().parseFromString(`<color ${attrs}/>`, 'application/xml').documentElement, ctx)

  it('테마 파일 → 엑셀 번호 순서(lt1·dk1·lt2·dk2·강조…)', () => {
    const xml = `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="t">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F497D"/></a:dk2><a:lt2><a:srgbClr val="EEECE1"/></a:lt2><a:accent1><a:srgbClr val="4F81BD"/></a:accent1>
    </a:clrScheme></a:themeElements></a:theme>`
    const colors = readThemeColors(xml)
    expect(colors.slice(0, 5)).toEqual(['FFFFFF', '000000', 'EEECE1', '1F497D', '4F81BD'])
    expect(colors[5]).toBe('ED7D31') // 없는 색은 기본 테마
  })

  it('rgb·theme·indexed·tint·auto', () => {
    expect(color('rgb="FF00B050"')).toBe('#00B050')
    expect(color('theme="1"')).toBe('#000000')
    expect(color('indexed="2"')).toBe('#FF0000')
    expect(color('indexed="64"')).toBe('#000000')
    expect(color('auto="1"')).toBeUndefined()
    expect(applyTint('000000', 0.5)).toBe('808080')
    expect(applyTint('FFFFFF', -0.5)).toBe('808080')
    expect(applyTint('4472C4', 0)).toBe('4472C4')
    // 밝게 하면 같은 색상에서 L만 올라간다
    const light = parseInt(applyTint('F79646', 0.8), 16)
    expect((light >> 16) & 255).toBeGreaterThan(240)
  })
})

describe('Excel 미리보기 — 표시 서식', () => {
  it('구역 나누기(따옴표·대괄호 안 ; 무시)', () => {
    expect(splitFormatSections('#,##0;"a;b"0;[<0];@')).toEqual(['#,##0', '"a;b"0', '[<0]', '@'])
  })

  it('일반·쉼표·소수·백분율·지수', () => {
    expect(formatCellNumber(3000, 'General').text).toBe('3000')
    expect(formatCellNumber(0.1 + 0.2, 'General').text).toBe('0.3')
    expect(formatCellNumber(1234567.891, '#,##0').text).toBe('1,234,568')
    expect(formatCellNumber(1234.5, '#,##0.00').text).toBe('1,234.50')
    expect(formatCellNumber(-1234.5, '#,##0.00').text).toBe('-1,234.50')
    expect(formatCellNumber(0.1234, '0.00%').text).toBe('12.34%')
    expect(formatCellNumber(0.5, '0%').text).toBe('50%')
    expect(formatCellNumber(0.5, '#.##').text).toBe('.5')
    expect(formatCellNumber(12345, '0.00E+00').text).toBe('1.23E+04')
    expect(formatCellNumber(1500000, '#,##0,"천원"').text).toBe('1,500천원')
  })

  it('음수 구역·색', () => {
    expect(formatCellNumber(-3000, '#,##0 ;(#,##0)').text).toBe('(3,000)')
    const red = formatCellNumber(-5, '0;[Red]-0')
    expect(red).toMatchObject({ text: '-5', color: '#FF0000' })
    expect(formatCellNumber(0, '0;-0;"영"').text).toBe('영')
  })

  it('회계 서식 — 통화 기호와 숫자를 양 끝으로(split), 0은 「-」', () => {
    const code = '_-"₩"* #,##0_-;\\-"₩"* #,##0_-;_-"₩"* "-"_-;_-@_-'
    expect(formatCellNumber(3000, code)).toMatchObject({ text: '₩3,000', split: ['₩', '3,000'] })
    expect(formatCellNumber(-3000, code).split).toEqual(['-₩', '3,000'])
    expect(formatCellNumber(0, code).split).toEqual(['₩', '-'])
    expect(formatCellNumber(12, '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-').split).toEqual(['', '12'])
    expect(formatCellNumber(5, '[$₩-412]#,##0').text).toBe('₩5')
  })

  it('날짜·시간(1900 체계, 1904 체계)', () => {
    const serial = 46310 // 2026-10-15
    expect(formatCellNumber(serial, 'yyyy-mm-dd').text).toBe('2026-10-15')
    expect(formatCellNumber(serial, 'yyyy"년" m"월" d"일"').text).toBe('2026년 10월 15일')
    expect(formatCellNumber(serial, 'yy/m/d (aaa)').text).toBe('26/10/15 (목)')
    expect(formatCellNumber(serial, 'd-mmm-yy').text).toBe('15-Oct-26')
    expect(formatCellNumber(serial + 0.75, 'h:mm AM/PM').text).toBe('6:00 PM')
    expect(formatCellNumber(serial + 0.5 + 1 / 1440, 'hh:mm:ss').text).toBe('12:01:00')
    expect(formatCellNumber(1.5, '[h]:mm').text).toBe('36:00')
    expect(formatCellNumber(serial - 1462, 'yyyy-mm-dd', true).text).toBe('2026-10-15')
  })

  it('글자 서식(@)', () => {
    expect(formatCellText('홍길동', '@"님"').text).toBe('홍길동님')
    expect(formatCellText('abc', '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-').text).toBe('abc')
    expect(formatCellText('abc', '#,##0').text).toBe('abc')
  })

  it('전화번호처럼 자리 표시 사이에 글자가 있는 정수 서식', () => {
    expect(formatCellNumber(1012345678, '000-0000-0000').text).toBe('010-1234-5678')
    expect(formatCellNumber(212345678, '00-####-####').text).toBe('02-1234-5678')
    expect(formatCellNumber(212345678, '0#-###-####').text).toBe('21-234-5678')
  })

  it('해석하지 못한 서식은 일반으로', () => {
    expect(formatCellNumber(1.5, '0.0-0').text).toBe('1.5')
  })
})

describe('Excel 미리보기 — 서식표·시트 모델', () => {
  const stylesXml = `<styleSheet ${NS}>
    <numFmts count="1"><numFmt numFmtId="177" formatCode="#,##0&quot;원&quot;"/></numFmts>
    <fonts count="2"><font><sz val="11"/><name val="맑은 고딕"/></font><font><b/><sz val="14"/><color rgb="FFFF0000"/><name val="돋움"/><u val="double"/></font></fonts>
    <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
      <fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills>
    <borders count="2"><border><left/><right/><top/><bottom/></border>
      <border><left style="thin"><color indexed="64"/></left><right style="medium"/><top style="double"><color rgb="FF0000FF"/></top><bottom/></border></borders>
    <cellXfs count="5">
      <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
      <xf numFmtId="177" fontId="1" fillId="2" borderId="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
      <xf numFmtId="14" fontId="0" fillId="0" borderId="0"/>
      <xf numFmtId="0" fontId="0" fillId="1" borderId="0"/>
      <xf numFmtId="0" fontId="0" fillId="0" borderId="1"/>
    </cellXfs></styleSheet>`
  const styles: WorkbookStyles = readWorkbookStyles(stylesXml, readThemeColors(null))

  it('글꼴·채우기·테두리·정렬·숫자 서식', () => {
    expect(styles.fonts[1]).toMatchObject({ name: '돋움', size: 14, bold: true, underline: 'double', color: '#FF0000' })
    expect(styles.xfs[1]).toMatchObject({ numFmt: '#,##0"원"', fill: '#FFFF00', horizontal: 'center', vertical: 'center', wrap: true })
    expect(styles.xfs[2].numFmt).toBe('yyyy-mm-dd')
    expect(styles.xfs[3].fill).toBeUndefined() // gray125 기본 채우기는 색 없음
    expect(styles.borders[1]).toEqual({
      left: { style: 'thin', color: '#000000' },
      right: { style: 'medium', color: '#000000' },
      top: { style: 'double', color: '#0000FF' },
    })
  })

  it('열 이름·칸 주소·열 너비 px', () => {
    expect([0, 25, 26, 27, 701, 702].map(columnName)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ', 'AAA'])
    expect(parseCellRef('$AB$12')).toEqual({ r: 11, c: 27 })
    expect(columnWidthPx(9.140625, 7)).toBe(64)
    expect(columnWidthPx(9, 8)).toBe(72)
    expect(maxDigitWidth(styles.fonts[0])).toBe(8)
    expect(maxDigitWidth({ ...styles.fonts[0], name: 'Calibri' })).toBe(7)
  })

  const sheet = (data: string, extra = '', before = '') =>
    `<worksheet ${NS}>${before}<sheetFormatPr defaultRowHeight="15" defaultColWidth="9"/>
     <cols><col min="1" max="1" width="20" customWidth="1"/><col min="3" max="3" width="5" hidden="1"/></cols>
     <sheetData>${data}</sheetData>${extra}</worksheet>`
  const ctx = { shared: ['제목', '긴 글자가 옆 칸으로 넘칩니다', '오른쪽'], styles, date1904: false, mdw: 8 }

  it('값·서식 적용, 범위(서식만 있는 빈 칸 제외), 열 너비·숨김·행 높이', () => {
    const model = readSheetModel(
      sheet(`<row r="1" ht="30" customHeight="1"><c r="A1" t="s"><v>0</v></c><c r="B1" s="1"><v>1500</v></c></row>
             <row r="2"><c r="A2" s="2"><v>46310</v></c><c r="B2" t="b"><v>1</v></c><c r="H2" s="0"/></row>
             <row r="3" hidden="1"><c r="D3" s="4"/></row>`),
      ctx
    )
    expect(model.rows).toBe(3)
    expect(model.cols).toBe(4) // D3 테두리까지, H2(서식 없음)는 범위 밖
    expect(model.colX).toEqual([0, 160, 232, 232, 304]) // A 20자·B 기본 9자·C 숨김
    expect(model.rowY).toEqual([0, 40, 60, 60]) // 30pt·기본 15pt·숨김
    expect(model.cells.get(cellKey(0, 1))).toMatchObject({ text: '1,500원', kind: 'number' })
    expect(model.cells.get(cellKey(1, 0))?.text).toBe('2026-10-15')
    expect(model.cells.get(cellKey(1, 1))).toMatchObject({ text: 'TRUE', kind: 'bool' })
    expect(model.truncated).toEqual({ rows: false, cols: false })
    expect(model.showGrid && model.showHeaders).toBe(true)
  })

  it('병합·눈금선 끔·상한 자르기', () => {
    const model = readSheetModel(
      sheet(`<row r="1"><c r="A1" t="s"><v>0</v></c></row><row r="10"><c r="Z10"><v>1</v></c></row>`, '<mergeCells><mergeCell ref="A1:B2"/><mergeCell ref="D4"/></mergeCells>', '<sheetViews><sheetView showGridLines="0"/></sheetViews>'),
      { ...ctx, maxRows: 5, maxCols: 3 }
    )
    expect(model.showGrid).toBe(false)
    expect(model.rows).toBe(5)
    expect(model.cols).toBe(3)
    expect(model.truncated).toEqual({ rows: true, cols: true })
    expect(model.merges).toEqual([{ r1: 0, c1: 0, r2: 1, c2: 1 }])
    expect(model.mergeAt.get(cellKey(1, 1))).toEqual(model.merges[0])
    expect(model.cells.has(cellKey(9, 25))).toBe(false)
  })

  it('빈 병합(글자·채우기·테두리 없음)은 그리는 범위를 넓히지 않는다', () => {
    const model = readSheetModel(sheet(`<row r="1"><c r="A1" t="s"><v>0</v></c></row>`, '<mergeCells><mergeCell ref="E1:H3"/></mergeCells>'), ctx)
    expect([model.rows, model.cols]).toEqual([1, 1])
    expect(model.merges).toEqual([])
  })

  it('글자 넘침 — 왼쪽 정렬은 오른쪽 빈 칸으로, 오른쪽 정렬은 왼쪽으로, 숫자·다른 값에서 멈춤', () => {
    const model = readSheetModel(
      sheet(`<row r="1"><c r="B1" t="s"><v>1</v></c><c r="E1"><v>3</v></c></row>
             <row r="2"><c r="A2"><v>1</v></c><c r="D2" t="s"><v>2</v></c></row>`, '', ''),
      { ...ctx, styles: readWorkbookStyles(stylesXml.replace('<xf numFmtId="0" fontId="0" fillId="0" borderId="1"/>', '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"><alignment horizontal="right"/></xf>'), readThemeColors(null)) }
    )
    const b1 = model.cells.get(cellKey(0, 1))!
    expect(textArea(model, b1, styles.xfs[0])).toEqual({ x: 160, width: 304 - 160 }) // B~D(C 숨김), E에서 멈춤
    const d2 = { ...model.cells.get(cellKey(1, 3))!, style: 4 }
    expect(textArea(model, d2, { ...styles.xfs[0], horizontal: 'right' })).toEqual({ x: 160, width: 304 - 160 }) // A2 숫자에서 멈춤
    const e1 = model.cells.get(cellKey(0, 4))!
    expect(textArea(model, e1, styles.xfs[0])).toEqual({ x: 304, width: 72 }) // 숫자는 넘치지 않음
  })
})
