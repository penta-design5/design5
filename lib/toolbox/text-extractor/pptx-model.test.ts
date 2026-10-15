import { describe, expect, it } from 'vitest'
import {
  applyColorMods,
  autoNumberText,
  bulletChar,
  customGeometryPath,
  dashArray,
  emuToPx,
  findPlaceholder,
  mergePara,
  presetPath,
  presetTextRect,
  readClrMap,
  readListStyle,
  readParaProps,
  readPlaceholder,
  readPptxTheme,
  readRunProps,
  resolveColor,
  resolveTypeface,
  styleKindOf,
  tintHex,
  type ColorContext,
} from './pptx-model'

const A = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
const P = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'
const xml = (s: string) => new DOMParser().parseFromString(s, 'application/xml').documentElement

const themeXml = `<a:theme ${A}><a:themeElements>
  <a:clrScheme name="t"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
    <a:dk2><a:srgbClr val="1F497D"/></a:dk2><a:lt2><a:srgbClr val="EEECE1"/></a:lt2><a:accent1><a:srgbClr val="4F81BD"/></a:accent1></a:clrScheme>
  <a:fontScheme name="f"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:font script="Hang" typeface="맑은 고딕"/></a:majorFont>
    <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface="Malgun Gothic"/></a:minorFont></a:fontScheme>
  <a:fmtScheme name="m"><a:lnStyleLst><a:ln w="6350"/><a:ln w="12700"/><a:ln w="19050"/></a:lnStyleLst></a:fmtScheme>
</a:themeElements></a:theme>`
const theme = readPptxTheme(new DOMParser().parseFromString(themeXml, 'application/xml'))
const ctx: ColorContext = { theme, clrMap: readClrMap(xml(`<p:clrMap ${P} bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1"/>`)) }

describe('PowerPoint 미리보기 — 테마·색', () => {
  it('테마 색·글꼴(한국어 글꼴 목록 포함)·선 굵기', () => {
    expect(theme.colors).toMatchObject({ dk1: '000000', lt1: 'FFFFFF', dk2: '1F497D', accent1: '4F81BD', accent2: 'ED7D31' })
    expect(theme.fonts.major).toEqual({ latin: 'Calibri Light', ea: '맑은 고딕' })
    expect(theme.fonts.minor).toEqual({ latin: 'Calibri', ea: 'Malgun Gothic' })
    expect(theme.lineWidths).toEqual([6350, 12700, 19050])
    expect(resolveTypeface('+mn-ea', theme)).toBe('Malgun Gothic')
    expect(resolveTypeface('+mj-lt', theme)).toBe('Calibri Light')
    expect(resolveTypeface('Arial', theme)).toBe('Arial')
  })

  it('색 이름 대응(tx1 → dk1)·srgb·prst·sys·변형·투명도', () => {
    const c = (s: string) => resolveColor(xml(s.replace('<a:', `<a:`).replace(/^<(a:\w+)/, `<$1 ${A}`)), ctx)
    expect(c('<a:schemeClr val="tx1"/>')).toBe('#000000')
    expect(c('<a:schemeClr val="bg1"/>')).toBe('#FFFFFF')
    expect(c('<a:srgbClr val="ff0000"/>')).toBe('#FF0000')
    expect(c('<a:prstClr val="black"/>')).toBe('#000000')
    expect(c('<a:sysClr val="window" lastClr="FFFFFF"/>')).toBe('#FFFFFF')
    expect(c('<a:srgbClr val="FF0000"><a:alpha val="50000"/></a:srgbClr>')).toBe('rgba(255, 0, 0, 0.5)')
    expect(c('<a:schemeClr val="unknown"/>')).toBeUndefined()
    // lumMod 50% → 어둡게, lumMod 20% + lumOff 80% → 아주 밝게
    const dark = applyColorMods('4F81BD', [xml(`<a:lumMod ${A} val="50000"/>`)]).hex
    const near = (a: string, b: string) => [0, 2, 4].every((i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) <= 1)
    expect(near(dark, '244061')).toBe(true) // Office 「강조 1, 50% 더 어둡게」(정수 반올림 1단위 차이 허용)
    const light = applyColorMods('4F81BD', [xml(`<a:lumMod ${A} val="20000"/>`), xml(`<a:lumOff ${A} val="80000"/>`)]).hex
    expect(parseInt(light.slice(0, 2), 16)).toBeGreaterThan(210)
    // tint·shade는 선형 색 공간(PowerPoint와 같은 결과 근사)
    const near2 = (a: string, b: string) => [0, 2, 4].every((i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) <= 2)
    expect(near2(tintHex('4F81BD', 0.4), 'CED7E7')).toBe(true) // macOS 미리보기로 그린 기본 표 스타일 띠 색(측정값)
    expect(near2(tintHex('4F81BD', 0.2), 'E8ECF3')).toBe(true)
    expect(applyColorMods('FFFFFF', [xml(`<a:shade ${A} val="50000"/>`)]).hex).toBe('BCBCBC')
  })
})

describe('PowerPoint 미리보기 — 글자 서식', () => {
  it('글자 서식(크기·굵게·밑줄·색·테마 글꼴)', () => {
    const r = readRunProps(xml(`<a:rPr ${A} sz="2400" b="1" i="0" u="sng" strike="sngStrike" cap="all" baseline="30000"><a:solidFill><a:schemeClr val="accent1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/></a:rPr>`), ctx)
    expect(r).toEqual({ size: 24, bold: true, italic: false, underline: 'single', strike: true, caps: true, baseline: 30, color: '#4F81BD', latin: 'Calibri', ea: 'Malgun Gothic' })
    expect(readRunProps(xml(`<a:rPr ${A} u="dbl"/>`), ctx).underline).toBe('double')
  })

  it('문단 서식·글머리 기호·자동 번호, 목록 스타일 이어받기', () => {
    const p = readParaProps(xml(`<a:pPr ${A} marL="457200" indent="-285750" algn="ctr"><a:lnSpc><a:spcPct val="90000"/></a:lnSpc><a:spcBef><a:spcPts val="600"/></a:spcBef>
      <a:buClr><a:srgbClr val="FF0000"/></a:buClr><a:buSzPct val="75000"/><a:buFont typeface="Wingdings"/><a:buChar char="§"/><a:defRPr sz="2000"/></a:pPr>`), ctx)
    expect(p).toMatchObject({ align: 'ctr', marL: 48, indent: -30, lineSpacing: { pct: 0.9 }, spaceBefore: { pts: 6 }, bullet: { kind: 'char', char: '§' }, bulletColor: '#FF0000', bulletSize: { pct: 0.75 }, bulletFont: 'Wingdings', run: { size: 20 } })
    const n = readParaProps(xml(`<a:pPr ${A}><a:buAutoNum type="romanUcPeriod" startAt="3"/></a:pPr>`), ctx)
    expect(n.bullet).toEqual({ kind: 'num', scheme: 'romanUcPeriod', start: 3 })
    const levels = readListStyle(xml(`<a:lstStyle ${A}><a:defPPr algn="l"><a:defRPr sz="1800"/></a:defPPr><a:lvl2pPr marL="914400"><a:defRPr b="1"/></a:lvl2pPr></a:lstStyle>`), ctx)
    expect(levels).toHaveLength(9)
    expect(levels[0]).toMatchObject({ align: 'l', run: { size: 18 } })
    expect(levels[1]).toMatchObject({ align: 'l', marL: 96, run: { size: 18, bold: true } })
    // 강한 서식이 덮어쓰고, 정의되지 않은 값은 그대로
    expect(mergePara(levels[1], { align: 'r', run: { size: 10 } })).toMatchObject({ align: 'r', marL: 96, run: { size: 10, bold: true } })
  })

  it('글머리 문자(Wingdings·개인 영역)·자동 번호 형식', () => {
    expect(bulletChar('§', 'Wingdings')).toBe('▪')
    expect(bulletChar('\uF0A7', 'Wingdings')).toBe('▪')
    expect(bulletChar('l', 'Wingdings')).toBe('●')
    expect(bulletChar('•', 'Arial')).toBe('•')
    expect(bulletChar('·', 'Symbol')).toBe('•')
    expect(['arabicPeriod', 'arabicParenR', 'arabicParenBoth', 'romanUcPeriod', 'romanLcPeriod', 'alphaUcPeriod', 'alphaLcParenR', 'circleNumDbPlain'].map((s) => autoNumberText(s, 4))).toEqual(['4.', '4)', '(4)', 'IV.', 'iv.', 'D.', 'd)', '④'])
    expect(autoNumberText('alphaUcPeriod', 27)).toBe('AA.')
  })
})

describe('PowerPoint 미리보기 — 도형·자리 표시자', () => {
  it('EMU → px', () => {
    expect(emuToPx(12192000)).toBe(1280)
    expect(emuToPx(914400)).toBe(96)
  })

  it('기본 도형 경로(조정값)·선 도형·모르는 도형은 사각형', () => {
    expect(presetPath('rect', 100, 50).d).toBe('M0 0 L100 0 L100 50 L0 50 Z')
    expect(presetPath('triangle', 100, 50).d).toBe('M50 0 L100 50 L0 50 Z')
    expect(presetPath('line', 100, 50)).toEqual({ d: 'M0 0 L100 50', open: true })
    expect(presetPath('roundRect', 100, 50, { adj: 20000 }).d.startsWith('M10 0 H90 A10 10')).toBe(true)
    expect(presetPath('rightArrow', 100, 50).d).toBe('M0 12.5 L75 12.5 L75 0 L100 25 L75 50 L75 37.5 L0 37.5 Z')
    expect(presetPath('somethingNew', 10, 10).d).toBe(presetPath('rect', 10, 10).d)
    expect(presetTextRect('ellipse', 100, 100).l).toBeCloseTo(14.64)
    expect(presetTextRect('triangle', 100, 50)).toEqual({ l: 25, t: 25, r: 75, b: 50 })
    expect(presetTextRect('rect', 100, 50)).toEqual({ l: 0, t: 0, r: 100, b: 50 })
  })

  it('사용자 지정 경로 — 경로 좌표를 도형 크기로 맞추고 곡선·호·닫기', () => {
    const g = xml(`<a:custGeom ${A}><a:pathLst><a:path w="200" h="100"><a:moveTo><a:pt x="0" y="0"/></a:moveTo><a:lnTo><a:pt x="200" y="0"/></a:lnTo>
      <a:cubicBezTo><a:pt x="200" y="50"/><a:pt x="100" y="100"/><a:pt x="0" y="100"/></a:cubicBezTo><a:arcTo wR="50" hR="50" stAng="5400000" swAng="5400000"/><a:close/></a:path></a:pathLst></a:custGeom>`)
    expect(customGeometryPath(g, 100, 50)).toBe('M0 0 L100 0 C100 25 50 50 0 50 A25 25 0 0 1 -25 25 Z')
  })

  it('점선 배열', () => {
    expect(dashArray('dash', 2)).toBe('8 6')
    expect(dashArray('sysDot', 1)).toBe('1 1')
    expect(dashArray('solid', 1)).toBeUndefined()
  })

  it('자리 표시자 — 번호 우선·종류·제목류/본문류 묶음, 글자 스타일 종류', () => {
    const tree = xml(`<p:spTree ${P}>
      <p:sp><p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr></p:sp>
      <p:sp><p:nvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr></p:sp>
      <p:sp><p:nvSpPr><p:nvPr><p:ph type="sldNum" idx="12"/></p:nvPr></p:nvSpPr></p:sp>
      <p:sp><p:nvSpPr><p:nvPr/></p:nvSpPr></p:sp></p:spTree>`)
    const shapes = Array.from(tree.children)
    expect(readPlaceholder(shapes[3])).toBeNull()
    expect(readPlaceholder(shapes[1])).toEqual({ type: 'body', idx: '1' })
    expect(findPlaceholder(shapes, { type: 'ctrTitle' }, true)).toBe(shapes[0])
    expect(findPlaceholder(shapes, { type: 'obj', idx: '1' }, true)).toBe(shapes[1])
    expect(findPlaceholder(shapes, { type: 'subTitle', idx: '9' }, true)).toBe(shapes[1])
    expect(findPlaceholder(shapes, { type: 'sldNum', idx: '99' }, false)).toBe(shapes[2])
    expect(findPlaceholder(shapes, { type: 'dt' }, false)).toBeUndefined()
    expect([styleKindOf({ type: 'ctrTitle' }), styleKindOf({ type: 'obj' }), styleKindOf({ type: 'sldNum' }), styleKindOf(null)]).toEqual(['title', 'body', 'other', null])
  })
})
