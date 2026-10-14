/** 격자에 표시·복사하는 문자 한 칸 */
export interface CharEntry {
  /** 복사되는 값(한 글자 또는 이모지 시퀀스 하나) */
  char: string
  /** 한글 이름(툴팁·검색·접근성 이름) */
  name: string
  /** 검색 전용 키워드(소문자, 공백 구분 — 한글 태그·영어 이름). 화면에는 표시하지 않는다 */
  keywords?: string
  /** 텍스트 이모티콘 등 폭이 가변인 항목이면 true — 정사각 격자 대신 내용 폭의 칸으로 배치하고, 코드포인트 목록은 표시하지 않는다 */
  wide?: true
  /** 이모지 항목이면 true — 컬러 이모지 글꼴 스택으로 그리고, 현재 환경에서 그릴 수 없으면 숨긴다 */
  emoji?: true
}

export interface CharCategory {
  id: string
  label: string
  entries: CharEntry[]
}

/** `U+2192` 형식 코드포인트 표기(이모지 시퀀스는 `U+1F1F0 U+1F1F7`처럼 공백으로 이어 붙임) */
export function codePointLabel(char: string): string {
  return Array.from(char)
    .map((c) => 'U+' + (c.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0'))
    .join(' ')
}
