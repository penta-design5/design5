import { TOOL_LABELS, TOOL_SHORTCUTS } from './annotations'

/**
 * 단축키 도움말 목록 — 표시 전용 데이터. 실제 처리는 ImageEditorPage/EditorCanvas의 keydown 핸들러.
 * 도구 단축키는 TOOL_SHORTCUTS에서 만들어 목록과 실제 동작이 어긋나지 않게 한다.
 */

export interface ShortcutItem {
  /** 눌러야 하는 키 조합 — 각 원소가 하나의 키 캡으로 표시됨 (대안은 별도 조합으로) */
  keys: string[][]
  label: string
}

export interface ShortcutGroup {
  title: string
  items: ShortcutItem[]
}

/** 방향키 이동 거리(원본 px) */
export const NUDGE_STEP = 1
export const NUDGE_STEP_LARGE = 10

export const MOD = '⌘/Ctrl'

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: '도구',
    items: [
      ...Object.entries(TOOL_SHORTCUTS).map(([key, tool]) => ({ keys: [[key.toUpperCase()]], label: TOOL_LABELS[tool] })),
      { keys: [['C']], label: '자르기 시작 / 취소' },
    ],
  },
  {
    title: '편집',
    items: [
      { keys: [[MOD, 'Z']], label: '실행취소' },
      { keys: [[MOD, 'Shift', 'Z'], ['Ctrl', 'Y']], label: '다시실행' },
      { keys: [[MOD, 'V']], label: '이미지 붙여넣기(새 이미지로 열기)' },
    ],
  },
  {
    title: '선택한 개체',
    items: [
      { keys: [['←', '↑', '→', '↓']], label: `${NUDGE_STEP}px 이동` },
      { keys: [['Shift', '방향키']], label: `${NUDGE_STEP_LARGE}px 이동` },
      { keys: [[MOD, 'D']], label: '복제' },
      { keys: [['Delete'], ['Backspace']], label: '삭제' },
      { keys: [['Esc']], label: '선택 해제' },
    ],
  },
  {
    title: '그리기·텍스트',
    items: [
      { keys: [['Shift', '드래그']], label: '직선·화살표 45° 단위 / 정사각형·정원' },
      { keys: [[MOD, 'Enter']], label: '텍스트 입력 확정' },
      { keys: [['Esc']], label: '텍스트 입력 취소' },
    ],
  },
  {
    title: '자르기 모드',
    items: [
      { keys: [['Enter']], label: '자르기 적용' },
      { keys: [['Esc']], label: '자르기 취소' },
    ],
  },
  {
    title: '화면',
    items: [
      { keys: [['휠'], ['트랙패드 핀치']], label: '확대 / 축소' },
      { keys: [['드래그']], label: '화면 이동(선택 도구에서 빈 곳)' },
      { keys: [['두 손가락']], label: '터치: 핀치 확대·축소 / 이동' },
      { keys: [['?']], label: '단축키 도움말' },
    ],
  },
]

const ARROW_DELTAS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

/** 방향키 → 이동량(원본 px). 방향키가 아니면 null */
export function nudgeDelta(key: string, large: boolean): { dx: number; dy: number } | null {
  const delta = ARROW_DELTAS[key]
  if (!delta) return null
  const step = large ? NUDGE_STEP_LARGE : NUDGE_STEP
  return { dx: delta[0] * step, dy: delta[1] * step }
}
