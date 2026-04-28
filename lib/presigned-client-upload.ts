/**
 * /api/posts/upload-presigned 응답에 대한 브라우저 직접 업로드
 * - B2: POST + B2 전용 헤더
 * - S3/MinIO: presigned PUT
 */

export type PresignedUploadEntry = {
  uploadUrl: string
  authorizationToken: string
  fileName: string
  fileUrl: string
  uploadMode?: 'b2' | 's3'
}

export async function uploadWithPresignedEntry(
  presigned: PresignedUploadEntry,
  file: File
): Promise<Response> {
  const isS3 = presigned.uploadMode === 's3' || !presigned.authorizationToken
  if (isS3) {
    return fetch(presigned.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    })
  }
  return fetch(presigned.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: presigned.authorizationToken,
      'X-Bz-File-Name': encodeURIComponent(presigned.fileName),
      'Content-Type': file.type,
      'X-Bz-Content-Sha1': 'do_not_verify',
    },
    body: file,
  })
}
