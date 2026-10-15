import { describe, expect, it } from 'vitest'
import {
  borderWidthPx,
  childOf,
  columnWidths,
  fontStackOf,
  hwpColor,
  hwpToPx,
  lineHeightCss,
  pageNumberText,
  paragraphIndentCss,
  readHwpxStyles,
  splitPages,
} from './hwpx-model'

const NS = 'xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"'

const header = `<hh:head ${NS}><hh:refList>
  <hh:fontfaces>
    <hh:fontface lang="HANGUL"><hh:font id="0" face="함초롬바탕"><hh:typeInfo familyType="FCAT_MYUNGJO"/></hh:font><hh:font id="1" face="맑은 고딕"><hh:typeInfo familyType="FCAT_GOTHIC"/></hh:font></hh:fontface>
    <hh:fontface lang="LATIN"><hh:font id="0" face="Times New Roman"/></hh:fontface>
  </hh:fontfaces>
  <hh:borderFills>
    <hh:borderFill id="1"><hh:leftBorder type="NONE" width="0.1 mm" color="#000000"/><hh:rightBorder type="NONE" width="0.1 mm" color="#000000"/><hh:topBorder type="NONE" width="0.1 mm" color="#000000"/><hh:bottomBorder type="NONE" width="0.1 mm" color="#000000"/></hh:borderFill>
    <hh:borderFill id="2"><hh:leftBorder type="SOLID" width="0.12 mm" color="#FF0000"/><hh:rightBorder type="DASH" width="0.5 mm" color="#000000"/><hh:topBorder type="DOUBLE_SLIM" width="0.12 mm" color="#000000"/><hh:bottomBorder type="NONE" width="0.1 mm" color="#000000"/>
      <hc:fillBrush><hc:winBrush faceColor="#D9D9D9" hatchColor="#000000" alpha="0"/></hc:fillBrush></hh:borderFill>
    <hh:borderFill id="3"><hc:fillBrush><hc:winBrush faceColor="none" hatchColor="#FF000000" alpha="0"/></hc:fillBrush></hh:borderFill>
  </hh:borderFills>
  <hh:charProperties>
    <hh:charPr id="0" height="1000" textColor="#000000" shadeColor="none"><hh:fontRef hangul="0" latin="0"/><hh:spacing hangul="-5"/><hh:underline type="NONE"/><hh:strikeout shape="NONE"/></hh:charPr>
    <hh:charPr id="1" height="1600" textColor="#0000FF" shadeColor="#FFFF00"><hh:fontRef hangul="1" latin="0"/><hh:bold/><hh:italic/><hh:underline type="BOTTOM"/><hh:strikeout shape="CONTINUOUS"/><hh:supscript/></hh:charPr>
  </hh:charProperties>
  <hh:paraProperties>
    <hh:paraPr id="0"><hh:align horizontal="CENTER"/><hp:switch><hp:case hp:required-namespace="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar"><hh:margin><hc:intent value="-1500"/><hc:left value="750"/><hc:right value="0"/><hc:prev value="1500"/><hc:next value="0"/></hh:margin><hh:lineSpacing type="PERCENT" value="180"/></hp:case>
      <hp:default><hh:margin><hc:intent value="-3000"/><hc:left value="1500"/><hc:right value="0"/><hc:prev value="3000"/><hc:next value="0"/></hh:margin><hh:lineSpacing type="PERCENT" value="180"/></hp:default></hp:switch>
      <hh:border borderFillIDRef="2"/><hh:breakSetting breakNonLatinWord="BREAK_WORD"/></hh:paraPr>
  </hh:paraProperties>
</hh:refList></hh:head>`

describe('한글 미리보기 — 단위·색', () => {
  it('HWPUNIT → px, 색, 테두리 굵기', () => {
    expect(hwpToPx(7200)).toBe(96)
    expect(hwpToPx(59528)).toBeCloseTo(793.7, 1) // A4 폭
    expect(hwpColor('#ff0000')).toBe('#FF0000')
    expect(hwpColor('#FF00FF00')).toBe('#00FF00')
    expect(hwpColor('none')).toBeUndefined()
    expect(borderWidthPx('0.12 mm')).toBe(1)
    expect(borderWidthPx('0.5 mm')).toBe(1.9)
  })
})

describe('한글 미리보기 — header.xml', () => {
  const styles = readHwpxStyles(header)

  it('글자 모양 — 크기·색·음영·굵게·기울임·밑줄·취소선·자간·첨자·글꼴(명조/고딕)', () => {
    expect(styles.chars.get('0')).toMatchObject({ size: 10, color: '#000000', shade: undefined, bold: false, underline: false, strike: false, spacing: -5, hangul: { face: '함초롬바탕', serif: true }, latin: { face: 'Times New Roman' } })
    expect(styles.chars.get('1')).toMatchObject({ size: 16, color: '#0000FF', shade: '#FFFF00', bold: true, italic: true, underline: true, strike: true, sup: true, hangul: { face: '맑은 고딕', serif: false } })
  })

  it('문단 모양 — hp:switch는 hp:case(실제 HWPUNIT) 값을 쓴다', () => {
    expect(styles.paras.get('0')).toEqual({ align: 'CENTER', left: 10, right: 0, indent: -20, prev: 20, next: 0, lineSpacing: { type: 'PERCENT', value: 180 }, borderFill: 2, keepWord: false })
  })

  it('테두리/배경 — 종류·굵기·색·채우기, NONE·none 제외', () => {
    expect(styles.borderFills.get('1')).toEqual({ left: undefined, right: undefined, top: undefined, bottom: undefined, fill: undefined })
    expect(styles.borderFills.get('2')).toEqual({
      left: { style: 'solid', width: 1, color: '#FF0000' },
      right: { style: 'dashed', width: 1.9, color: '#000000' },
      top: { style: 'double', width: 3, color: '#000000' },
      bottom: undefined,
      fill: '#D9D9D9',
    })
    expect(styles.borderFills.get('3')?.fill).toBeUndefined()
  })

  it('childOf — 일반 자식과 hp:switch 안(case 우선)', () => {
    const doc = new DOMParser().parseFromString(header, 'application/xml')
    const paraPr = doc.getElementsByTagName('hh:paraPr')[0]
    expect(childOf(paraPr, 'hh:align')?.getAttribute('horizontal')).toBe('CENTER')
    expect(childOf(childOf(paraPr, 'hh:margin'), 'hc:left')?.getAttribute('value')).toBe('750')
  })
})

describe('한글 미리보기 — 문단·글꼴·표·쪽', () => {
  it('줄 간격(%·고정·여백만·최소)', () => {
    expect(lineHeightCss({ type: 'PERCENT', value: 160 }, 10)).toBe('1.6')
    expect(lineHeightCss({ type: 'FIXED', value: 1500 }, 10)).toBe('20px')
    expect(lineHeightCss({ type: 'BETWEEN_LINES', value: 750 }, 15)).toBe('34px')
    expect(lineHeightCss({ type: 'AT_LEAST', value: 3000 }, 10)).toBe('40px')
  })

  it('내어쓰기(음수)·들여쓰기(양수)', () => {
    expect(paragraphIndentCss({ left: 10, indent: -20 })).toEqual({ paddingLeft: 30, textIndent: -20 })
    expect(paragraphIndentCss({ left: 10, indent: 15 })).toEqual({ paddingLeft: 10, textIndent: 15 })
  })

  it('글꼴 목록 — 영문 글꼴 먼저, 한글 글꼴 계열로 대체 글꼴', () => {
    const serif = fontStackOf({ face: '함초롬바탕', serif: true }, { face: 'Times New Roman', serif: true })
    expect(serif.startsWith('"Times New Roman", "함초롬바탕"')).toBe(true)
    expect(serif.endsWith('serif')).toBe(true)
    expect(fontStackOf({ face: '맑은 고딕', serif: false }, undefined).endsWith('sans-serif')).toBe(true)
    expect(fontStackOf({ face: 'a"b;c', serif: false }, undefined).startsWith('"abc"')).toBe(true)
  })

  it('열 너비 — 한 칸짜리로 정하고, 병합 칸에서 남은 열을 구한다', () => {
    expect(columnWidths([{ col: 0, colSpan: 1, w: 100 }, { col: 1, colSpan: 1, w: 50 }], 2, 150)).toEqual([100, 50])
    // 1열은 병합 칸(0~1, 180)에서 0열(100)을 빼서 80
    expect(columnWidths([{ col: 0, colSpan: 1, w: 100 }, { col: 0, colSpan: 2, w: 180 }, { col: 2, colSpan: 1, w: 40 }], 3, 220)).toEqual([100, 80, 40])
    // 정보가 없는 열은 표 너비 나머지를 나눈다
    expect(columnWidths([{ col: 0, colSpan: 1, w: 100 }], 3, 300)).toEqual([100, 100, 100])
  })

  it('쪽 나눔 — 줄 위치가 위로 돌아가면·강제 쪽 나눔이면 새 쪽, 줄 정보 없으면 이어서', () => {
    expect(splitPages([
      { firstVert: 0, lastVert: 1000, pageBreak: false },
      { firstVert: 2000, lastVert: 60000, pageBreak: false },
      { firstVert: 0, lastVert: 3000, pageBreak: false }, // 새 쪽
      { firstVert: null, lastVert: null, pageBreak: false },
      { firstVert: 5000, lastVert: 5000, pageBreak: true }, // 강제
    ])).toEqual([[0, 1], [2, 3], [4]])
    expect(splitPages([{ firstVert: 0, lastVert: 0, pageBreak: true }])).toEqual([[0]]) // 첫 문단의 쪽 나눔은 빈 쪽을 만들지 않음
    expect(splitPages([])).toEqual([[]])
  })

  it('쪽 번호 형식', () => {
    expect(pageNumberText(3, 'DIGIT', '-')).toBe('- 3 -')
    expect(pageNumberText(4, 'ROMAN_CAPITAL', '')).toBe('IV')
    expect(pageNumberText(4, 'ROMAN_SMALL', '')).toBe('iv')
    expect(pageNumberText(2, 'CIRCLED_DIGIT', '')).toBe('②')
  })
})
