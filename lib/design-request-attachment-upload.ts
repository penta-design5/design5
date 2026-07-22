/**
 * 디자인 의뢰 첨부 — 브라우저 직접 업로드 오케스트레이션 (클라이언트 전용)
 * presigned 발급(/api/design-requests/upload-presigned) → 각 파일 PUT 업로드 → 메타데이터 반환
 *
 * 개발망에서 브라우저 → MinIO 공개 엔드포인트 직접 PUT이 간헐적으로 ERR_TIMED_OUT을
 * 내는 경우가 있어, 파일별로 타임아웃(AbortController) + 지수 백오프 재시도를 적용한다.
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

/** 업로드 시도당 타임아웃(ms) — 초과 시 abort 후 재시도 */
const UPLOAD_ATTEMPT_TIMEOUT_MS = 60_000
/** 총 시도 횟수(최초 1 + 재시도 2) */
const UPLOAD_MAX_ATTEMPTS = 3

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * presigned PUT을 타임아웃·재시도와 함께 수행.
 * - S3(MinIO) presigned PUT은 AbortController로 시도별 타임아웃을 건다.
 * - 네트워크 오류(Failed to fetch/타임아웃)나 5xx 응답이면 백오프 후 재시도.
 * - 4xx(권한/형식 등)는 재시도해도 소용없으므로 즉시 실패.
 */
async function uploadOneWithRetry(
  entry: PresignedResponseEntry,
  file: File
): Promise<void> {
  const isS3 = entry.uploadMode === 's3' || !entry.authorizationToken
  let lastErr: unknown = null

  for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), UPLOAD_ATTEMPT_TIMEOUT_MS)
    try {
      let res: Response
      if (isS3) {
        res = await fetch(entry.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          signal: controller.signal,
        })
      } else {
        // B2 경로는 공유 헬퍼 사용(타임아웃 미적용)
        res = await uploadWithPresignedEntry(
          {
            uploadUrl: entry.uploadUrl,
            authorizationToken: entry.authorizationToken,
            fileName: entry.fileName,
            fileUrl: entry.fileUrl,
            uploadMode: entry.uploadMode,
          },
          file
        )
      }

      if (res.ok) return

      // 4xx는 재시도 불가 → 즉시 실패
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`파일 업로드에 실패했습니다: ${file.name} (${res.status})`)
      }
      lastErr = new Error(`파일 업로드에 실패했습니다: ${file.name} (${res.status})`)
    } catch (e) {
      // AbortError·네트워크 오류 → 재시도 대상
      lastErr = e
    } finally {
      clearTimeout(timer)
    }

    if (attempt < UPLOAD_MAX_ATTEMPTS) {
      await delay(1000 * attempt) // 1s, 2s 백오프
    }
  }

  const reason =
    lastErr instanceof Error ? lastErr.message : '네트워크 오류'
  throw new Error(`파일 업로드에 실패했습니다: ${file.name} — ${reason}`)
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
    await uploadOneWithRetry(entry, file)
    results.push({
      fileName: file.name,
      fileUrl: entry.fileUrl,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
    })
  }

  return results
}
