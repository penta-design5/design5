/**
 * TOOLBOX 텍스트 스타일 공용 상수 — 이미지 편집 주석(텍스트)과 워터마크(이미지 편집·이미지 모자이크)가 함께 쓴다.
 */

/** 텍스트 글꼴 — PC에 설치된 한글 시스템 글꼴 사용(스택: `TEXT_FONT_STACKS`) */
export type TextFont = 'gothic' | 'myeongjo' | 'gulim' | 'gungseo'

export const TEXT_FONTS: { value: TextFont; label: string }[] = [
  { value: 'gothic', label: '고딕' },
  { value: 'myeongjo', label: '명조' },
  { value: 'gulim', label: '굴림' },
  { value: 'gungseo', label: '궁서' },
]

/** 도형·텍스트·워터마크에 쓰는 기본 색상 팔레트 */
export const COLOR_PRESETS = ['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#000000', '#ffffff']

export const ANNOTATION_FONT_FAMILY =
  '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif'

/**
 * 텍스트 글꼴 스택 — 외부 웹폰트 없이 Windows·macOS 기본 한글 글꼴 사용(사내망·외부 CDN 의존 없음).
 * Windows: 바탕·굴림·궁서 / macOS: AppleMyungjo·나눔명조·AppleGothic·GungSeo. 없으면 뒤의 대체 글꼴로 표시.
 * 브라우저에서 합성하므로 화면에 보이는 글꼴 그대로 저장된다.
 */
export const TEXT_FONT_STACKS: Record<TextFont, string> = {
  gothic: ANNOTATION_FONT_FAMILY,
  myeongjo: '"Batang", "바탕", "AppleMyungjo", "Nanum Myeongjo", "NanumMyeongjo", "Noto Serif KR", serif',
  gulim: '"Gulim", "굴림", "Dotum", "돋움", "AppleGothic", sans-serif',
  gungseo: '"Gungsuh", "궁서", "GungSeo", "Gungseo", serif',
}
