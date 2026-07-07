/** ICON+ 클라이언트 공용 타입 */

export type IconPlusType = 'MAIN' | 'MERGE_ICON' | 'MERGE_TEXT'

/** GET /api/icon-plus 응답의 리소스 1건 (Prisma IconPlusResource 직렬화 형태) */
export interface IconPlusResource {
  id: string
  type: IconPlusType
  name: string
  svgContent: string
  viewBox: string
  width: number
  height: number
  baseWidth: number | null
  baseHeight: number | null
  anchorX: number | null
  anchorY: number | null
  authorId: string | null
  createdAt: string
  updatedAt: string
}
