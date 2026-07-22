/**
 * 디자인 의뢰 첨부파일 공용 규칙·검증 (서버·클라 공유)
 * - 의뢰당 최대 5개, 파일당 25MB, 확장자 화이트리스트
 * 계획: docs/디자인의뢰_첨부파일_구현계획.md
 */

import { z } from 'zod'

export const DESIGN_REQUEST_ATTACHMENT_MAX_COUNT = 5
export const DESIGN_REQUEST_ATTACHMENT_MAX_SIZE = 25 * 1024 * 1024 // 25MB (bytes)

/** 허용 확장자(소문자, 점 제외) */
export const DESIGN_REQUEST_ALLOWED_EXTENSIONS = [
  'pptx',
  'pdf',
  'mp4',
  'html',
  'htm',
  'txt',
  'jpg',
  'jpeg',
  'png',
  'zip',
] as const

/** 화면 안내용 라벨 */
export const DESIGN_REQUEST_ALLOWED_EXTENSIONS_LABEL =
  DESIGN_REQUEST_ALLOWED_EXTENSIONS.join(', ')

/** `<input accept>` 속성값 */
export const DESIGN_REQUEST_ACCEPT_ATTR = DESIGN_REQUEST_ALLOWED_EXTENSIONS.map(
  (e) => `.${e}`
).join(',')

export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  if (idx < 0 || idx === fileName.length - 1) return ''
  return fileName.slice(idx + 1).toLowerCase()
}

export function isAllowedAttachmentExtension(fileName: string): boolean {
  const ext = getFileExtension(fileName)
  return (DESIGN_REQUEST_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
}

export function isAllowedAttachmentSize(size: number): boolean {
  return Number.isFinite(size) && size > 0 && size <= DESIGN_REQUEST_ATTACHMENT_MAX_SIZE
}

/** 바이트를 사람이 읽는 크기로 (예: 24.3MB) */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, i)
  return `${i === 0 ? value : value.toFixed(1)}${units[i]}`
}

export interface AttachmentCandidate {
  name: string
  size: number
}

/**
 * 단일 파일 검증. 통과 시 null, 실패 시 사용자용 메시지 반환.
 */
export function validateAttachmentFile(file: AttachmentCandidate): string | null {
  if (!isAllowedAttachmentExtension(file.name)) {
    return `허용되지 않는 형식입니다: ${file.name} (허용: ${DESIGN_REQUEST_ALLOWED_EXTENSIONS_LABEL})`
  }
  if (!isAllowedAttachmentSize(file.size)) {
    return `파일이 25MB를 초과합니다: ${file.name}`
  }
  return null
}

/**
 * 업로드 완료 후 서버로 전달되는 첨부 메타데이터 검증 (POST·PATCH 공용).
 * 확장자·용량을 서버에서 다시 확인한다(클라 검증 우회 방지).
 */
export const designRequestAttachmentInputSchema = z
  .object({
    fileName: z.string().min(1),
    fileUrl: z.string().min(1),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(DESIGN_REQUEST_ATTACHMENT_MAX_SIZE, '파일이 25MB를 초과합니다.'),
    mimeType: z.string().min(1),
  })
  .refine((a) => isAllowedAttachmentExtension(a.fileName), {
    message: `허용되지 않는 형식입니다. (허용: ${DESIGN_REQUEST_ALLOWED_EXTENSIONS_LABEL})`,
    path: ['fileName'],
  })

export type DesignRequestAttachmentInput = z.infer<
  typeof designRequestAttachmentInputSchema
>
