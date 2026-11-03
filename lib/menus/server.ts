import { randomUUID } from 'crypto'
import type { Category } from '@prisma/client'
import { uploadFile, deleteFileByUrl } from '@/lib/b2'
import { BadRequestError } from '@/lib/api/errors'
import { getHtmlFileError, HTML_DOCUMENT_CONTENT_TYPE } from '@/lib/html-document'
import {
  MENU_HTML_MAX_BYTES,
  isHtmlMenu,
  parseHtmlMenuConfig,
  type AdminMenu,
  type HtmlMenuConfig,
  type MenuSectionType,
} from './schemas'

/**
 * 메뉴 관리 서버 전용 헬퍼 — HTML 파일 Storage 업로드·삭제, 응답 변환.
 * 계획: docs/MENU_ADMIN_구현계획.md §3.4
 */

/** HTML을 Storage(posts 버킷)에 text/html로 업로드하고 Category.config 값을 반환 */
export async function uploadMenuHtml(file: File, slug: string): Promise<HtmlMenuConfig> {
  const error = getHtmlFileError(file, MENU_HTML_MAX_BYTES)
  if (error) {
    throw new BadRequestError(error)
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const { fileUrl } = await uploadFile(buffer, `menus/${slug}/${randomUUID()}.html`, HTML_DOCUMENT_CONTENT_TYPE)
  return {
    html: {
      url: fileUrl,
      fileName: file.name,
      size: buffer.length,
      updatedAt: new Date().toISOString(),
    },
  }
}

/** Storage의 HTML 삭제 — 실패해도 메뉴 작업은 성공으로 두고 로그만 남긴다 */
export async function deleteMenuHtmlQuietly(url: string): Promise<void> {
  try {
    await deleteFileByUrl(url)
  } catch (error) {
    console.error('[menus] HTML 파일 삭제 실패:', url, error)
  }
}

/** multipart 텍스트 필드 → 문자열 (없으면 빈 문자열 → zod가 필수 메시지로 거부) */
export function formText(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

export function toAdminMenu(category: Category): AdminMenu {
  const html = isHtmlMenu(category) ? parseHtmlMenuConfig(category.config)?.html : undefined
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    type: category.type as MenuSectionType,
    pageType: category.pageType,
    order: category.order,
    isHidden: category.isHidden,
    isHtml: isHtmlMenu(category),
    html: html ? { fileName: html.fileName, size: html.size, updatedAt: html.updatedAt } : null,
  }
}
