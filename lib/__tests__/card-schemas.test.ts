import { describe, it, expect, beforeEach } from 'vitest'
import {
  createCardTemplateSchema,
  cardUserEditDataSchema,
  generateCardFileName,
  cardPresetStorageUtils,
  CARD_STORAGE_KEYS,
  type SavedCardPreset,
} from '@/lib/card-schemas'

describe('card-schemas', () => {
  describe('createCardTemplateSchema', () => {
    const minimalValid = {
      name: '연말 카드',
      backgroundImages: [{ url: 'https://example.com/bg.png', width: 1080, height: 1920 }],
      config: { textElements: [] },
    }

    it('최소 유효 입력을 파싱하고 기본값을 채운다', () => {
      const parsed = createCardTemplateSchema.parse(minimalValid)
      expect(parsed.width).toBe(1080)
      expect(parsed.height).toBe(1920)
      expect(parsed.status).toBe('PUBLISHED')
    })

    it('이름이 비면 검증 실패한다', () => {
      expect(() => createCardTemplateSchema.parse({ ...minimalValid, name: '' })).toThrow()
    })

    it('배경 이미지가 없으면 검증 실패한다', () => {
      expect(() =>
        createCardTemplateSchema.parse({ ...minimalValid, backgroundImages: [] })
      ).toThrow()
    })
  })

  describe('cardUserEditDataSchema', () => {
    it('selectedBackgroundIndex 기본값은 0이다', () => {
      const parsed = cardUserEditDataSchema.parse({ textValues: { title: 'hi' } })
      expect(parsed.selectedBackgroundIndex).toBe(0)
    })
  })

  describe('generateCardFileName', () => {
    it('특수문자를 제거하고 공백을 밑줄로 바꾼다', () => {
      expect(generateCardFileName('My Card!', 'png')).toMatch(/^Card_My_Card_\d{8}\.png$/)
    })

    it('한글 이름을 보존한다', () => {
      expect(generateCardFileName('연말 카드', 'pdf')).toMatch(/^Card_연말_카드_\d{8}\.pdf$/)
    })
  })

  describe('cardPresetStorageUtils', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    const preset: SavedCardPreset = {
      id: 'p1',
      name: '프리셋1',
      createdAt: '2026-01-01',
      templateId: 't1',
      templateName: '템플릿1',
      userEditData: { selectedBackgroundIndex: 0, textValues: {} },
    }

    it('프리셋 저장·조회 라운드트립', () => {
      expect(cardPresetStorageUtils.savePreset(preset)).toBe(true)
      expect(cardPresetStorageUtils.getAllPresets()).toHaveLength(1)
      expect(cardPresetStorageUtils.getPresetsByTemplateId('t1')).toHaveLength(1)
      expect(cardPresetStorageUtils.getPresetsByTemplateId('other')).toHaveLength(0)
    })

    it('프리셋 삭제', () => {
      cardPresetStorageUtils.savePreset(preset)
      expect(cardPresetStorageUtils.deletePreset('p1')).toBe(true)
      expect(cardPresetStorageUtils.getAllPresets()).toHaveLength(0)
    })

    it('고아 프리셋을 정리한다', () => {
      cardPresetStorageUtils.savePreset(preset)
      cardPresetStorageUtils.savePreset({ ...preset, id: 'p2', templateId: 'gone' })
      const removed = cardPresetStorageUtils.cleanupOrphanedPresets(['t1'])
      expect(removed).toBe(1)
      expect(cardPresetStorageUtils.getAllPresets()).toHaveLength(1)
    })

    it('autosave 저장·조회·삭제', () => {
      cardPresetStorageUtils.saveAutosave('t1', { selectedBackgroundIndex: 2, textValues: {} })
      expect(cardPresetStorageUtils.getAutosave('t1')?.selectedBackgroundIndex).toBe(2)
      cardPresetStorageUtils.clearAutosave('t1')
      expect(cardPresetStorageUtils.getAutosave('t1')).toBeNull()
    })

    it('스토리지 키가 정의되어 있다', () => {
      expect(CARD_STORAGE_KEYS.PRESETS).toBe('card-editor-presets')
    })
  })
})
