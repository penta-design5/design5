import { EMPTY_HISTORY, parseHistory, serializeHistory, type CharHistory } from './history'

/** 최근 사용·즐겨찾기 저장 키. 문자 목록뿐이라 개인 정보가 아니다(QR 코드와 달리 저장해도 된다). */
export const HISTORY_STORAGE_KEY = 'toolbox:special-characters:v1'

/** 저장소를 쓸 수 없거나(차단·시크릿 모드) 값이 깨져도 예외 없이 빈 기록으로 동작한다. */
export function loadHistory(): CharHistory {
  try {
    return parseHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY))
  } catch {
    return EMPTY_HISTORY
  }
}

export function saveHistory(history: CharHistory): void {
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, serializeHistory(history))
  } catch {
    // 용량 초과·차단: 이번 방문 동안은 메모리 상태로만 유지한다
  }
}
