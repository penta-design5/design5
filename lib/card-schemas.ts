import { z } from 'zod'

// 배경 이미지 1개 (동일 디자인, 다른 크기/비율)
export const backgroundImageSchema = z.object({
  url: z.string().url(),
  width: z.number().min(1),
  height: z.number().min(1),
  label: z.string().optional(),
})
export const backgroundImagesSchema = z.array(backgroundImageSchema).min(1, '배경 이미지는 1개 이상 필요합니다.')

export type BackgroundImageItem = z.infer<typeof backgroundImageSchema>

// 텍스트 요소 (제목/부제목/인사말/발신자)
export const cardTextElementSchema = z.object({
  id: z.string(),
  label: z.string(),
  defaultValue: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(10).max(100).optional(),
  fontSize: z.number().min(8).max(200).default(24),
  fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold', 'extrabold']).default('normal'),
  color: z.string().default('#333333'),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  verticalAlign: z.enum(['top', 'middle', 'bottom']).default('middle'),
  editable: z.boolean().default(true),
  multiline: z.boolean().default(false), // 인사말 등 여러 줄
})

export const cardLogoAreaSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(10).max(500),
  height: z.number().min(10).max(500),
  placeholder: z.string().default('로고 또는 서명'),
  imageUrl: z.string().optional().nullable(), // 로고/서명 이미지 (url 또는 blob)
  align: z.enum(['left', 'center', 'right']).default('center'),
})

export const cardTemplateConfigSchema = z.object({
  textElements: z.array(cardTextElementSchema),
  logoArea: cardLogoAreaSchema.optional(),
})

export type CardTextElement = z.infer<typeof cardTextElementSchema>
export type CardLogoArea = z.infer<typeof cardLogoAreaSchema>
export type CardTemplateConfig = z.infer<typeof cardTemplateConfigSchema>

// 생성/수정 스키마
export const createCardTemplateSchema = z.object({
  name: z.string().min(1, '템플릿 이름을 입력해주세요.'),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  backgroundImages: backgroundImagesSchema,
  width: z.number().min(400).max(2000).default(1080),
  height: z.number().min(600).max(4000).default(1920),
  config: cardTemplateConfigSchema,
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).default('PUBLISHED'),
})

export const updateCardTemplateSchema = createCardTemplateSchema.partial()

export type CreateCardTemplateInput = z.infer<typeof createCardTemplateSchema>
export type UpdateCardTemplateInput = z.infer<typeof updateCardTemplateSchema>

// 로고 정렬
export const logoAlignSchema = z.enum(['left', 'center', 'right']).default('center')
export type LogoAlign = z.infer<typeof logoAlignSchema>

// 사용자 편집 데이터 (배경 선택 인덱스, 텍스트 값, 로고)
export const cardUserEditDataSchema = z.object({
  selectedBackgroundIndex: z.number().min(0).default(0),
  textValues: z.record(z.string(), z.string()),
  logoUrl: z.string().url().optional().nullable(),
  logoAlign: logoAlignSchema.optional(),
})

export type CardUserEditData = z.infer<typeof cardUserEditDataSchema>

export type ExportFormat = 'png' | 'jpg' | 'pdf'

// DB 응답용
export interface CardTemplate {
  id: string
  name: string
  description: string | null
  thumbnailUrl: string | null
  backgroundImages: BackgroundImageItem[]
  width: number
  height: number
  config: CardTemplateConfig
  status: string
  authorId: string
  author?: {
    id: string
    name: string | null
    email: string
  }
  createdAt: Date
  updatedAt: Date
}

// 기본 템플릿 설정 (감사/연말 카드: 제목, 부제목, 인사말, 발신자, 로고·서명)
export const DEFAULT_CARD_CONFIG: CardTemplateConfig = {
  textElements: [
    {
      id: 'title',
      label: '제목',
      defaultValue: '근하신년',
      x: 50,
      y: 28,
      width: 80,
      fontSize: 56,
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
      verticalAlign: 'middle',
      editable: true,
      multiline: false,
    },
    {
      id: 'subtitle',
      label: '부제목',
      defaultValue: '새해 복 많이 받으세요.',
      x: 50,
      y: 36,
      width: 80,
      fontSize: 22,
      fontWeight: 'medium',
      color: '#000000',
      textAlign: 'center',
      verticalAlign: 'middle',
      editable: true,
      multiline: false,
    },
    {
      id: 'greeting',
      label: '인사말',
      defaultValue:
        '병오년 붉은 말의 해를 맞이하여, 새해에도 귀사에 건강과 활력이 가득하시길 바랍니다.\n지난 한 해 보내주신 신뢰와 성원에 깊이 감사드립니다.',
      x: 15,
      y: 52,
      width: 70,
      fontSize: 18,
      fontWeight: 'normal',
      color: '#333333',
      textAlign: 'left',
      verticalAlign: 'top',
      editable: true,
      multiline: true,
    },
    {
      id: 'senderName',
      label: '발신자 이름',
      defaultValue: '홍길동',
      x: 50,
      y: 82,
      width: 60,
      fontSize: 20,
      fontWeight: 'medium',
      color: '#000000',
      textAlign: 'center',
      verticalAlign: 'middle',
      editable: true,
      multiline: false,
    },
  ],
  logoArea: {
    x: 50,
    y: 78,
    width: 200,
    height: 80,
    placeholder: '로고 또는 서명',
    imageUrl: null as string | null | undefined,
    align: 'center' as const,
  },
}

// 저장된 프리셋
export interface SavedCardPreset {
  id: string
  name: string
  createdAt: string
  templateId: string
  templateName: string
  userEditData: CardUserEditData
}

export const CARD_STORAGE_KEYS = {
  PRESETS: 'card-editor-presets',
  AUTOSAVE: 'card-editor-autosave',
} as const

export function generateCardFileName(templateName: string, format: ExportFormat): string {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const safeName = templateName.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().replace(/\s+/g, '_')
  return `Card_${safeName}_${dateStr}.${format}`
}

export const cardPresetStorageUtils = {
  getAllPresets: (): SavedCardPreset[] => {
    try {
      const stored = localStorage.getItem(CARD_STORAGE_KEYS.PRESETS)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  getPresetsByTemplateId: (templateId: string): SavedCardPreset[] => {
    return cardPresetStorageUtils.getAllPresets().filter((p) => p.templateId === templateId)
  },

  savePreset: (preset: SavedCardPreset): boolean => {
    try {
      const all = cardPresetStorageUtils.getAllPresets()
      localStorage.setItem(CARD_STORAGE_KEYS.PRESETS, JSON.stringify([...all, preset]))
      return true
    } catch {
      return false
    }
  },

  deletePreset: (presetId: string): boolean => {
    try {
      const all = cardPresetStorageUtils.getAllPresets().filter((p) => p.id !== presetId)
      localStorage.setItem(CARD_STORAGE_KEYS.PRESETS, JSON.stringify(all))
      return true
    } catch {
      return false
    }
  },

  cleanupOrphanedPresets: (existingTemplateIds: string[]): number => {
    try {
      const all = cardPresetStorageUtils.getAllPresets()
      const valid = all.filter((p) => existingTemplateIds.includes(p.templateId))
      const removed = all.length - valid.length
      if (removed > 0) localStorage.setItem(CARD_STORAGE_KEYS.PRESETS, JSON.stringify(valid))
      return removed
    } catch {
      return 0
    }
  },

  saveAutosave: (templateId: string, userEditData: CardUserEditData): boolean => {
    try {
      localStorage.setItem(`${CARD_STORAGE_KEYS.AUTOSAVE}-${templateId}`, JSON.stringify(userEditData))
      return true
    } catch {
      return false
    }
  },

  getAutosave: (templateId: string): CardUserEditData | null => {
    try {
      const stored = localStorage.getItem(`${CARD_STORAGE_KEYS.AUTOSAVE}-${templateId}`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },

  clearAutosave: (templateId: string): boolean => {
    try {
      localStorage.removeItem(`${CARD_STORAGE_KEYS.AUTOSAVE}-${templateId}`)
      return true
    } catch {
      return false
    }
  },
}
