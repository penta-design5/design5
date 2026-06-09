// 제품 타입 옵션 (업로드 다이얼로그 Select용)
export const HARDWARE_TYPES = ['WAPPLES', 'D.AMO', 'iSIGN'] as const

// 목록 필터 메뉴 (ALL + 제품 타입)
export const HARDWARE_FILTERS = ['ALL', ...HARDWARE_TYPES] as const

export type HardwareType = (typeof HARDWARE_TYPES)[number]

// 하드웨어 제품 타입 (DB 응답용)
export interface HardwareProductPost {
  id: string
  title: string
  description: string | null
  type: string | null
  imageUrl: string
  thumbnailUrl: string | null
  authorId: string
  author?: {
    id: string
    name: string | null
    email: string
  }
  createdAt: string | Date
  updatedAt: string | Date
}
