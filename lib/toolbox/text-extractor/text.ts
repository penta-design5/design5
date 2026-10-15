import { baseNameOf, sanitizeFileName } from '@/lib/toolbox/common/export'

/**
 * 인식 결과 정리 — 한글 사이의 마침표·쉼표 뒤에 빠진 띄어쓰기를 넣는다(`많다.그러나` → `많다. 그러나`).
 * 숫자(`0.5`·`12,545`)·영문(`www.example.com`)은 건드리지 않도록 **양쪽이 모두 한글일 때만** 고친다.
 */
export function fixPunctuationSpacing(text: string): string {
  return text.replace(/([가-힣])([.,])(?=[가-힣])/g, '$1$2 ')
}

/** 글자 수(공백·줄바꿈 제외) */
export function countCharacters(text: string): number {
  return text.replace(/\s/g, '').length
}

/** 저장 파일명 — 원본 이름 + `.txt`(원본이 없으면 `extracted-text.txt`) */
export function textFileName(sourceName: string | null): string {
  const base = sourceName ? baseNameOf(sourceName) : ''
  return `${sanitizeFileName(base, 'extracted-text')}.txt`
}
