import { randomUUID } from 'crypto'
import { uploadFile } from '@/lib/b2'
import { BadRequestError } from '@/lib/api/errors'
import {
  INSIGHT_HTML_MAX_BYTES,
  INSIGHT_HTML_CONTENT_TYPE,
  hasHtmlExtension,
} from '@/lib/insights-schemas'

/**
 * INSIGHTS HTML 문서·썸네일의 S3(posts 버킷) 업로드 헬퍼.
 * 자기완결형 단일 .html만 허용. 계획: docs/INSIGHTS_구현계획.md §5
 */

/** 업로드된 HTML 파일 검증 (확장자 + MIME + 크기). 실패 시 BadRequestError */
export function assertValidHtmlFile(file: File): void {
  if (!hasHtmlExtension(file.name)) {
    throw new BadRequestError('HTML 문서(.html) 파일만 업로드할 수 있습니다.')
  }
  // 브라우저가 text/html 외 빈 값/octet-stream을 보낼 수 있어 확장자를 우선하되,
  // 명백히 다른 타입(image/*, application/pdf 등)은 거부한다.
  const type = (file.type || '').toLowerCase()
  if (type && type !== 'text/html') {
    throw new BadRequestError('HTML 문서(text/html)만 업로드할 수 있습니다.')
  }
  if (file.size <= 0) {
    throw new BadRequestError('빈 파일은 업로드할 수 없습니다.')
  }
  if (file.size > INSIGHT_HTML_MAX_BYTES) {
    throw new BadRequestError('HTML 문서는 5MB 이하만 업로드할 수 있습니다.')
  }
}

/** HTML 문서를 S3에 text/html로 업로드하고 메타데이터 반환 */
export async function uploadInsightHtml(
  file: File,
  categorySlug: string
): Promise<{ htmlUrl: string; htmlFileName: string; htmlFileSize: number }> {
  assertValidHtmlFile(file)
  const buffer = Buffer.from(await file.arrayBuffer())
  const key = `insights/${categorySlug}/${randomUUID()}.html`
  const { fileUrl } = await uploadFile(buffer, key, INSIGHT_HTML_CONTENT_TYPE)
  return {
    htmlUrl: fileUrl,
    htmlFileName: file.name,
    htmlFileSize: buffer.length,
  }
}

/** (선택) 카드 썸네일 이미지를 S3에 업로드하고 URL 반환 */
export async function uploadInsightThumbnail(
  file: File,
  categorySlug: string
): Promise<string> {
  const type = (file.type || '').toLowerCase()
  if (!type.startsWith('image/')) {
    throw new BadRequestError('썸네일은 이미지 파일만 업로드할 수 있습니다.')
  }
  if (file.size > INSIGHT_HTML_MAX_BYTES) {
    throw new BadRequestError('썸네일 이미지는 5MB 이하만 업로드할 수 있습니다.')
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop() || 'png'
  const key = `insights/${categorySlug}/thumbnails/${randomUUID()}.${ext}`
  const { fileUrl } = await uploadFile(buffer, key, file.type || 'image/png')
  return fileUrl
}
