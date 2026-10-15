import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import {
  columnIndex,
  excelSerialToDate,
  extractOffice,
  extractXmlText,
  formatNumber,
  isDateFormat,
  legacyOfficeMessage,
  officeFormatOf,
  readDateStyles,
  readSharedStrings,
  readSheet,
  resolvePath,
  validateOfficeFile,
} from './office'
import { buildOmissions, formatPageList } from './omissions'
import { sanitizePreview } from './sanitize-preview'

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'
const docx = (body: string) => `<w:document ${W}><w:body>${body}</w:body></w:document>`
const wp = (...runs: string[]) => `<w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="100"/></w:tabs></w:pPr>${runs.map((r) => `<w:r><w:t xml:space="preserve">${r}</w:t></w:r>`).join('')}</w:p>`

describe('형식 판별', () => {
  it('확장자로 판별, 구형 형식은 안내', () => {
    expect(officeFormatOf({ name: '보고서.DOCX' })).toBe('docx')
    expect(officeFormatOf({ name: 'a.hwpx' })).toBe('hwpx')
    expect(officeFormatOf({ name: 'a.hwp' })).toBeNull()
    expect(legacyOfficeMessage({ name: 'a.hwp' })).toMatch('HWPX 형식으로 다시 저장')
    expect(legacyOfficeMessage({ name: 'a.xls' })).toMatch('XLSX')
    expect(legacyOfficeMessage({ name: 'a.pdf' })).toBeNull()
    expect(validateOfficeFile({ size: 0 })).toMatch('빈 파일')
    expect(validateOfficeFile({ size: 51 * 1024 * 1024 })).toMatch('50MB')
  })
})

describe('DOCX', () => {
  it('문단·조각 잇기·탭·줄바꿈, 문단 속성(pPr)의 탭 정의는 무시', () => {
    const xml = docx(`${wp('안녕', '하세요')}<w:p><w:r><w:t>이름</w:t><w:tab/><w:t>값</w:t><w:br/><w:t>다음 줄</w:t></w:r></w:p>`)
    expect(extractXmlText(xml, 'docx')).toBe('안녕하세요\n이름\t값\n다음 줄')
  })

  it('표는 행마다 칸을 탭으로, 칸 안 여러 문단은 공백으로, 빈 행은 뺀다', () => {
    const cell = (...ps: string[]) => `<w:tc><w:tcPr/>${ps.map((t) => wp(t)).join('')}</w:tc>`
    const xml = docx(`${wp('앞')}<w:tbl><w:tblPr/><w:tr>${cell('구분')}${cell('1분기', '(억)')}</w:tr><w:tr>${cell('')}${cell('')}</w:tr><w:tr>${cell('보안')}${cell('1,200')}</w:tr></w:tbl>${wp('뒤')}`)
    expect(extractXmlText(xml, 'docx')).toBe('앞\n구분\t1분기 (억)\n보안\t1,200\n뒤')
  })

  it('삭제된 글자·필드 코드·대체 콘텐츠(Fallback)는 읽지 않고, 텍스트 상자는 문단 뒤에 읽는다', () => {
    const textbox = `<mc:AlternateContent><mc:Choice><w:drawing><w:txbxContent>${wp('상자 글자')}</w:txbxContent></w:drawing></mc:Choice><mc:Fallback><w:pict><w:txbxContent>${wp('상자 글자')}</w:txbxContent></w:pict></mc:Fallback></mc:AlternateContent>`
    const xml = docx(`<w:p><w:r><w:t>본문</w:t></w:r><w:del><w:r><w:delText>지운 글자</w:delText></w:r></w:del><w:r><w:instrText>PAGE</w:instrText></w:r><w:r>${textbox}</w:r></w:p>`)
    expect(extractXmlText(xml, 'docx')).toBe('본문\n상자 글자')
  })

  it('연속 빈 문단은 빈 줄 하나로', () => {
    expect(extractXmlText(docx(`${wp('가')}${wp('')}${wp('')}${wp('')}${wp('나')}${wp('')}`), 'docx')).toBe('가\n\n나')
  })
})

describe('PPTX·HWPX', () => {
  it('PPTX 도형 문단·줄바꿈·표', () => {
    const A = 'xmlns:p="p" xmlns:a="a"'
    const xml = `<p:sld ${A}><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:rPr lang="ko"/><a:t>제목</a:t></a:r><a:br/><a:r><a:t>둘째 줄</a:t></a:r><a:endParaRPr/></a:p></p:txBody></p:sp><p:graphicFrame><a:graphic><a:tbl><a:tr><a:tc><a:txBody><a:p><a:r><a:t>A</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>B</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl></a:graphic></p:graphicFrame></p:spTree></p:cSld></p:sld>`
    expect(extractXmlText(xml, 'pptx')).toBe('제목\n둘째 줄\nA\tB')
  })

  it('HWPX 문단·글자 안 탭/줄바꿈·표(칸 속 문단)·구역 설정과 머리말 제외', () => {
    const H = 'xmlns:hs="hs" xmlns:hp="hp"'
    const para = (t: string) => `<hp:p><hp:run><hp:t>${t}</hp:t></hp:run><hp:linesegarray><hp:lineseg/></hp:linesegarray></hp:p>`
    const xml = `<hs:sec ${H}><hp:p><hp:run><hp:secPr><hp:t>설정</hp:t></hp:secPr><hp:ctrl><hp:header><hp:subList>${para('머리말')}</hp:subList></hp:header></hp:ctrl><hp:t>입법<hp:tab/>예고<hp:lineBreak/>둘째</hp:t></hp:run></hp:p><hp:p><hp:run><hp:tbl><hp:tr><hp:tc><hp:subList>${para('현행')}</hp:subList></hp:tc><hp:tc><hp:subList>${para('개정안')}${para('(신설)')}</hp:subList></hp:tc></hp:tr></hp:tbl></hp:run></hp:p>${para('끝')}</hs:sec>`
    expect(extractXmlText(xml, 'hwpx')).toBe('입법\t예고\n둘째\n\n현행\t개정안 (신설)\n끝')
  })
})

describe('XLSX', () => {
  it('열 문자·날짜 서식·날짜 변환·숫자 정리', () => {
    expect(columnIndex('A1')).toBe(0)
    expect(columnIndex('AB12')).toBe(27)
    expect(isDateFormat(14)).toBe(true)
    expect(isDateFormat(3)).toBe(false)
    expect(isDateFormat(164, 'yyyy"년" m"월" d"일"')).toBe(true)
    expect(isDateFormat(165, '#,##0"원"')).toBe(false)
    expect(isDateFormat(166, '[Red]#,##0.00')).toBe(false)
    expect(excelSerialToDate(46310)).toBe('2026-10-15')
    expect(excelSerialToDate(46310.5)).toBe('2026-10-15 12:00')
    expect(formatNumber('0.30000000000000004')).toBe('0.3')
    expect(formatNumber('3000')).toBe('3000')
  })

  it('공유 문자열(서식 섞인 조각 잇기·발음 제외)·서식 표', () => {
    expect(readSharedStrings('<sst><si><t>합계</t></si><si><r><t>영업</t></r><r><t>1팀</t></r><rPh><t>えい</t></rPh></si></sst>')).toEqual(['합계', '영업1팀'])
    const styles = '<styleSheet><numFmts><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts><cellXfs><xf numFmtId="0"/><xf numFmtId="164"/><xf numFmtId="3"/></cellXfs></styleSheet>'
    expect(readDateStyles(styles)).toEqual([false, true, false])
  })

  it('행: 칸 위치 유지(빈 칸 탭)·끝 빈칸 제외·빈 행 제외, 셀 종류별 값', () => {
    const sheet = `<worksheet><sheetData>
      <row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c><c r="D1"/></row>
      <row r="2"><c r="A2"/></row>
      <row r="3"><c r="B3" s="1"><v>46310</v></c><c r="C3"><f>A1+1</f><v>0.1</v></c><c r="D3" t="b"><v>1</v></c><c r="E3" t="inlineStr"><is><t>직접</t></is></c><c r="F3" t="e"><v>#DIV/0!</v></c><c r="G3" t="str"><v>수식 글자</v></c></row>
    </sheetData></worksheet>`
    expect(readSheet(sheet, { shared: ['구분', '합계\n(원)'], dateStyles: [false, true] })).toEqual([
      '구분\t\t합계 (원)',
      '\t2026-10-15\t0.1\tTRUE\t직접\t#DIV/0!\t수식 글자',
    ])
  })
})

describe('ZIP 읽기', () => {
  it('상대 경로 풀기', () => {
    expect(resolvePath('ppt', 'slides/slide1.xml')).toBe('ppt/slides/slide1.xml')
    expect(resolvePath('xl', '../xl/worksheets/sheet1.xml')).toBe('xl/worksheets/sheet1.xml')
  })

  it('PPTX는 발표 순서(sldIdLst)대로 슬라이드 구분선', async () => {
    const zip = new JSZip()
    zip.file('ppt/presentation.xml', '<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst><p:sldId r:id="rId3"/><p:sldId r:id="rId2"/></p:sldIdLst></p:presentation>')
    zip.file('ppt/_rels/presentation.xml.rels', '<Relationships><Relationship Id="rId2" Target="slides/slide1.xml"/><Relationship Id="rId3" Target="slides/slide2.xml"/></Relationships>')
    const slide = (t: string) => `<p:sld xmlns:p="p" xmlns:a="a"><a:p><a:r><a:t>${t}</a:t></a:r></a:p></p:sld>`
    zip.file('ppt/slides/slide1.xml', slide('파일1'))
    zip.file('ppt/slides/slide2.xml', slide('파일2'))
    const r = await extractOffice(await zip.generateAsync({ type: 'uint8array' }), 'pptx')
    expect(r.text).toBe('--- 슬라이드 1 ---\n파일2\n\n--- 슬라이드 2 ---\n파일1')
    expect(r.summary).toBe('슬라이드 2장')
  })

  it('XLSX는 시트 순서·이름(숨김 표시)', async () => {
    const zip = new JSZip()
    zip.file('xl/workbook.xml', '<workbook xmlns:r="r"><sheets><sheet name="매출" r:id="rId1"/><sheet name="비밀" state="hidden" r:id="rId2"/></sheets></workbook>')
    zip.file('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>')
    zip.file('xl/worksheets/sheet1.xml', '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>가</t></is></c></row></sheetData></worksheet>')
    zip.file('xl/worksheets/sheet2.xml', '<worksheet><sheetData><row r="1"><c r="A1"><v>1</v></c></row></sheetData></worksheet>')
    const r = await extractOffice(await zip.generateAsync({ type: 'uint8array' }), 'xlsx')
    expect(r.text).toBe('--- 시트: 매출 ---\n가\n\n--- 시트: 비밀 (숨김) ---\n1')
    expect(r.summary).toBe('시트 2개')
  })

  it('HWPX는 spine 순서로 구역을 구분선 없이 잇는다', async () => {
    const zip = new JSZip()
    zip.file('Contents/content.hpf', '<opf:package xmlns:opf="o"><opf:manifest><opf:item id="header" href="Contents/header.xml"/><opf:item id="s0" href="Contents/section0.xml"/><opf:item id="s1" href="Contents/section1.xml"/></opf:manifest><opf:spine><opf:itemref idref="header"/><opf:itemref idref="s1"/><opf:itemref idref="s0"/></opf:spine></opf:package>')
    const sec = (t: string) => `<hs:sec xmlns:hs="hs" xmlns:hp="hp"><hp:p><hp:run><hp:t>${t}</hp:t></hp:run></hp:p></hs:sec>`
    zip.file('Contents/section0.xml', sec('영'))
    zip.file('Contents/section1.xml', sec('일'))
    expect((await extractOffice(await zip.generateAsync({ type: 'uint8array' }), 'hwpx')).text).toBe('일\n\n영')
  })

  it('손상·암호(OLE 컨테이너) 파일 안내', async () => {
    await expect(extractOffice(new Uint8Array([1, 2, 3, 4, 5]), 'docx')).rejects.toThrow('손상되었거나')
    const ole = new Uint8Array(64)
    ole.set([0xd0, 0xcf, 0x11, 0xe0])
    await expect(extractOffice(ole, 'docx')).rejects.toThrow('암호가 걸렸거나')
    const zip = new JSZip()
    zip.file('a.txt', 'x')
    await expect(extractOffice(await zip.generateAsync({ type: 'uint8array' }), 'docx')).rejects.toThrow('문서 구성이 올바르지 않습니다')
  })
})

describe('추출되지 않은 내용 안내', () => {
  it('개수가 있는 항목만, 정해진 순서·문구로', () => {
    expect(buildOmissions({})).toEqual([])
    expect(buildOmissions({ images: 0, notes: 0 })).toEqual([])
    const list = buildOmissions({ images: 2, headerFooter: 1, autoNumbering: 3, formattedNumbers: 5 })
    expect(list.map((o) => o.label)).toEqual(['머리말·꼬리말 1곳', '자동 번호 목록 3문단', '표시 서식이 있는 숫자 5칸', '그림 2개'])
    expect(list[3].hint).toMatch('캡처해 이미지로')
  })

  it('PDF 그림 페이지 목록(5쪽 넘으면 줄임)', () => {
    expect(formatPageList([3])).toBe('3쪽')
    expect(formatPageList([1, 2, 3, 4, 5, 6, 7])).toBe('1·2·3·4·5쪽 외 2쪽')
    const [o] = buildOmissions({ pdfImagePages: [2, 5] })
    expect(o.label).toBe('그림이 있는 페이지 2·5쪽')
    expect(o.hint).toMatch('모든 페이지를 OCR로 읽기')
    expect(buildOmissions({ pdfImagePages: [] })).toEqual([])
  })

  const zipOf = async (files: Record<string, string>) => {
    const zip = new JSZip()
    for (const [k, v] of Object.entries(files)) zip.file(k, v)
    return zip.generateAsync({ type: 'uint8array' })
  }
  const labels = (r: { omissions: { label: string }[] }) => r.omissions.map((o) => o.label)

  it('DOCX: 머리말(글자 있는 것만)·각주(구분선 제외)·자동 번호(numId 0 제외)·메모·그림·차트·SmartArt', async () => {
    const NS = `${W} xmlns:pic="pic" xmlns:c="c" xmlns:dgm="dgm"`
    const numbered = (id: string) => `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${id}"/></w:numPr></w:pPr><w:r><w:t>항목</w:t></w:r></w:p>`
    const data = await zipOf({
      'word/document.xml': `<w:document ${NS}><w:body>${numbered('1')}${numbered('1')}${numbered('0')}<w:p><w:r><w:drawing><pic:pic/></w:drawing></w:r></w:p><w:p><w:r><w:drawing><c:chart/><dgm:relIds/></w:drawing></w:r></w:p></w:body></w:document>`,
      'word/header1.xml': `<w:hdr ${W}>${wp('회사명')}</w:hdr>`,
      'word/footer1.xml': `<w:ftr ${W}>${wp('')}</w:ftr>`,
      'word/footnotes.xml': `<w:footnotes ${W}><w:footnote w:type="separator" w:id="-1">${wp('---')}</w:footnote><w:footnote w:id="1">${wp('출처')}</w:footnote></w:footnotes>`,
      'word/comments.xml': `<w:comments ${W}><w:comment w:id="0">${wp('확인')}</w:comment></w:comments>`,
    })
    expect(labels(await extractOffice(data, 'docx'))).toEqual(['머리말·꼬리말 1곳', '각주·미주 1개', '자동 번호 목록 2문단', 'SmartArt 1개', '차트 1개', '메모 1개', '그림 1개'])
  })

  it('PPTX: 노트는 본문 자리에 글자가 있을 때만(슬라이드 번호 제외)·그림·차트', async () => {
    const slide = (body: string) => `<p:sld xmlns:p="p" xmlns:a="a" xmlns:c="c"><p:cSld><p:spTree>${body}</p:spTree></p:cSld></p:sld>`
    const notes = (bodyText: string) =>
      `<p:notes xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:nvPr><p:ph type="sldNum"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>3</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:nvPr><p:ph type="body"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>${bodyText}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:notes>`
    const rel = (n: number) => `<Relationships><Relationship Id="rId1" Type="http://x/notesSlide" Target="../notesSlides/notesSlide${n}.xml"/></Relationships>`
    const data = await zipOf({
      'ppt/presentation.xml': '<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst><p:sldId r:id="rId1"/><p:sldId r:id="rId2"/></p:sldIdLst></p:presentation>',
      'ppt/_rels/presentation.xml.rels': '<Relationships><Relationship Id="rId1" Target="slides/slide1.xml"/><Relationship Id="rId2" Target="slides/slide2.xml"/></Relationships>',
      'ppt/slides/slide1.xml': slide('<p:pic/><p:pic/>'),
      'ppt/slides/slide2.xml': slide('<p:graphicFrame><c:chart/></p:graphicFrame>'),
      'ppt/slides/_rels/slide1.xml.rels': rel(1),
      'ppt/slides/_rels/slide2.xml.rels': rel(2),
      'ppt/notesSlides/notesSlide1.xml': notes('발표 메모'),
      'ppt/notesSlides/notesSlide2.xml': notes(''),
    })
    expect(labels(await extractOffice(data, 'pptx'))).toEqual(['슬라이드 노트 1장', '차트 1개', '그림 2개'])
  })

  it('XLSX: 표시 서식 숫자(일반·정수·텍스트·날짜 제외)·메모·차트·그림', async () => {
    const data = await zipOf({
      'xl/workbook.xml': '<workbook xmlns:r="r"><sheets><sheet name="A" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
      'xl/styles.xml': '<styleSheet><cellXfs><xf numFmtId="0"/><xf numFmtId="3"/><xf numFmtId="1"/><xf numFmtId="14"/><xf numFmtId="49"/></cellXfs></styleSheet>',
      'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" s="1"><v>3000</v></c><c r="B1" s="1"><v>1200</v></c><c r="C1" s="2"><v>5</v></c><c r="D1" s="3"><v>46310</v></c><c r="E1" s="4"><v>7</v></c><c r="F1"><v>9</v></c><c r="G1" s="1" t="s"><v>0</v></c></row></sheetData></worksheet>',
      'xl/sharedStrings.xml': '<sst><si><t>글자</t></si></sst>',
      'xl/comments1.xml': '<comments><commentList><comment ref="A1"/><comment ref="B1"/></commentList></comments>',
      'xl/charts/chart1.xml': '<c:chartSpace xmlns:c="c"/>',
      'xl/media/image1.png': 'x',
    })
    const r = await extractOffice(data, 'xlsx')
    expect(r.text).toBe('3000\t1200\t5\t2026-10-15\t7\t9\t글자')
    expect(labels(r)).toEqual(['차트 1개', '메모 2개', '표시 서식이 있는 숫자 2칸', '그림 1개'])
  })

  it('HWPX: 머리말·꼬리말(글자 있는 것)·각주·미주·그림, 없으면 안내 없음', async () => {
    const sec = (inner: string) => `<hs:sec xmlns:hs="hs" xmlns:hp="hp"><hp:p><hp:run>${inner}<hp:t>본문</hp:t></hp:run></hp:p></hs:sec>`
    const withAll = await zipOf({
      'Contents/section0.xml': sec('<hp:ctrl><hp:header><hp:subList><hp:p><hp:run><hp:t>머리</hp:t></hp:run></hp:p></hp:subList></hp:header><hp:footer/></hp:ctrl><hp:ctrl><hp:footNote/><hp:endNote/></hp:ctrl><hp:pic/>'),
    })
    const r = await extractOffice(withAll, 'hwpx')
    expect(r.text).toBe('본문')
    expect(labels(r)).toEqual(['머리말·꼬리말 1곳', '각주·미주 2개', '그림 1개'])
    expect((await extractOffice(await zipOf({ 'Contents/section0.xml': sec('') }), 'hwpx')).omissions).toEqual([])
  })
})

describe('문단·표 블록', () => {
  it('구역마다 문단·표(칸 배열) 블록을 돌려준다', async () => {
    const zip = new JSZip()
    zip.file('word/document.xml', docx(`${wp('제목')}<w:tbl><w:tr><w:tc>${wp('가')}</w:tc><w:tc>${wp('나')}</w:tc></w:tr></w:tbl>`))
    const r = await extractOffice(await zip.generateAsync({ type: 'uint8array' }), 'docx')
    expect(r.sections[0].blocks).toEqual([
      { kind: 'para', text: '제목' },
      { kind: 'table', rows: [['가', '나']] },
    ])
    expect(r.text).toBe('제목\n가\t나')
  })

})

describe('미리보기 정리(sanitizePreview)', () => {
  it('실행 가능한 요소·이벤트 속성·위험한 주소를 지우고 바깥 링크는 새 창', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <p onclick="alert(1)">글</p>
      <script>alert(1)</script><iframe srcdoc="<script>alert(1)</script>"></iframe><object></object>
      <a id="js" href="javascript:alert(1)">나쁜 링크</a>
      <a id="web" href="https://example.com">좋은 링크</a>
      <a id="anchor" href="#_Toc1">목차</a>
      <img id="data" src="data:image/png;base64,AAAA"><img id="bad" src="javascript:alert(1)">
      <svg><a id="svg" xlink:href="javascript:alert(1)"></a></svg>`
    sanitizePreview(root)
    expect(root.querySelector('script, iframe, object')).toBeNull()
    expect(root.querySelector('p')!.hasAttribute('onclick')).toBe(false)
    expect(root.querySelector('#js')!.hasAttribute('href')).toBe(false)
    expect(root.querySelector('#web')!.getAttribute('target')).toBe('_blank')
    expect(root.querySelector('#web')!.getAttribute('rel')).toBe('noopener noreferrer')
    expect(root.querySelector('#anchor')!.getAttribute('href')).toBe('#_Toc1')
    expect(root.querySelector('#data')!.getAttribute('src')).toMatch(/^data:image/)
    expect(root.querySelector('#bad')!.hasAttribute('src')).toBe(false)
    expect(root.querySelector('#svg')!.hasAttribute('xlink:href')).toBe(false)
  })
})
