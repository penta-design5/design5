/**
 * 디자인 의뢰 첨부 — 브라우저 직접 업로드 오케스트레이션 (클라이언트 전용)
 * presigned 발급(/api/design-requests/upload-presigned) → 각 파일 PUT 업로드 → 메타데이터 반환
 */

import { uploadWithPresignedEntry } from '@/lib/presigned-client-upload'

export interface UploadedAttachmentMeta {
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

interface PresignedResponseEntry {
  originalName: string
  fileName: string
  uploadUrl: string
  authorizationToken: string
  fileUrl: string
  uploadMode?: 'b2' | 's3'
}

/**
 * 선택한 File 목록을 업로드하고 서버 저장용 메타데이터 배열을 반환.
 * 실패 시 예외를 던진다(호출부에서 toast 등 처리).
 */
export async function uploadDesignRequestAttachments(
  files: File[]
): Promise<UploadedAttachmentMeta[]> {
  if (files.length === 0) return []

  const res = await fetch('/api/design-requests/upload-presigned', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      files: files.map((f) => ({
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
      })),
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || '파일 업로드 준비에 실패했습니다.')
  }

  const entries = (data.presignedUrls ?? []) as PresignedResponseEntry[]
  if (entries.length !== files.length) {
    throw new Error('업로드 URL 발급 결과가 올바르지 않습니다.')
  }

  const results: UploadedAttachmentMeta[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const entry = entries[i]
    const uploadRes = await uploadWithPresignedEntry(
      {
        uploadUrl: entry.uploadUrl,
        authorizationToken: entry.authorizationToken,
        fileName: entry.fileName,
        fileUrl: entry.fileUrl,
        uploadMode: entry.uploadMode,
      },
      file
    )
    if (!uploadRes.ok) {
      throw new Error(`파일 업로드에 실패했습니다: ${file.name}`)
    }
    results.push({
      fileName: file.name,
      fileUrl: entry.fileUrl,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
    })
  }

  return results
}
