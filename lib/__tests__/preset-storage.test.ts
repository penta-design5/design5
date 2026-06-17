import { describe, it, expect, beforeEach } from 'vitest'
import { createPresetStorageUtils } from '@/lib/preset-storage'
import { desktopStorageUtils, type SavedDesktopPreset } from '@/lib/desktop-schemas'
import { presetStorageUtils, type SavedWelcomeBoardPreset } from '@/lib/welcomeboard-schemas'

type ToyPreset = { id: string; ownerId: string; value: number }
type ToyAutosave = { v: number }

describe('preset-storage 팩토리', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('append 모드 (기본)', () => {
    const s = createPresetStorageUtils<ToyPreset, ToyAutosave>({
      presetsKey: 'toy-presets',
      autosaveKey: 'toy-auto',
      foreignKey: 'ownerId',
    })

    it('같은 id를 저장하면 중복 추가된다(추가 방식)', () => {
      s.savePreset({ id: 'a', ownerId: 'o1', value: 1 })
      s.savePreset({ id: 'a', ownerId: 'o1', value: 2 })
      expect(s.getAllPresets()).toHaveLength(2)
    })

    it('foreignKey로 필터링한다', () => {
      s.savePreset({ id: 'a', ownerId: 'o1', value: 1 })
      s.savePreset({ id: 'b', ownerId: 'o2', value: 2 })
      expect(s.getPresetsByForeignId('o1')).toHaveLength(1)
      expect(s.getPresetsByForeignId('o2')).toHaveLength(1)
      expect(s.getPresetsByForeignId('none')).toHaveLength(0)
    })

    it('고아 프리셋을 정리하고 제거 개수를 반환한다', () => {
      s.savePreset({ id: 'a', ownerId: 'keep', value: 1 })
      s.savePreset({ id: 'b', ownerId: 'gone', value: 2 })
      expect(s.cleanupOrphanedPresets(['keep'])).toBe(1)
      expect(s.getAllPresets()).toHaveLength(1)
    })

    it('autosave 저장·조회·삭제 라운드트립', () => {
      expect(s.saveAutosave('o1', { v: 7 })).toBe(true)
      expect(s.getAutosave('o1')).toEqual({ v: 7 })
      expect(s.clearAutosave('o1')).toBe(true)
      expect(s.getAutosave('o1')).toBeNull()
    })

    it('손상된 JSON은 빈 배열로 복구한다', () => {
      localStorage.setItem('toy-presets', '{not json')
      expect(s.getAllPresets()).toEqual([])
    })
  })

  describe('upsert 모드', () => {
    const s = createPresetStorageUtils<ToyPreset, ToyAutosave>({
      presetsKey: 'toy-upsert-presets',
      autosaveKey: 'toy-upsert-auto',
      foreignKey: 'ownerId',
      upsert: true,
    })

    it('같은 id를 저장하면 교체된다(중복 없음)', () => {
      s.savePreset({ id: 'a', ownerId: 'o1', value: 1 })
      s.savePreset({ id: 'a', ownerId: 'o1', value: 2 })
      const all = s.getAllPresets()
      expect(all).toHaveLength(1)
      expect(all[0].value).toBe(2)
    })
  })
})

// 통합: 리팩토링 후에도 각 스키마의 공개 메서드 동작이 동일한지 확인

describe('desktopStorageUtils (upsert + SSR 가드 유지)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const preset = {
    id: 'd1',
    name: '프리셋',
    createdAt: '2026-01-01',
    wallpaperId: 'w1',
    wallpaperTitle: '배경1',
    data: { backgroundChoice: 'windows', elements: [] },
  } as unknown as SavedDesktopPreset

  it('같은 id 저장 시 교체(upsert)된다', () => {
    desktopStorageUtils.savePreset(preset)
    desktopStorageUtils.savePreset({ ...preset, wallpaperTitle: '배경2' })
    const all = desktopStorageUtils.getAllPresets()
    expect(all).toHaveLength(1)
    expect(all[0].wallpaperTitle).toBe('배경2')
  })

  it('wallpaperId로 필터링한다', () => {
    desktopStorageUtils.savePreset(preset)
    expect(desktopStorageUtils.getPresetsByWallpaperId('w1')).toHaveLength(1)
    expect(desktopStorageUtils.getPresetsByWallpaperId('other')).toHaveLength(0)
  })
})

describe('presetStorageUtils — welcomeboard (append 유지)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const preset = {
    id: 'wb1',
    name: '프리셋',
    createdAt: '2026-01-01',
    templateId: 't1',
    templateName: '템플릿1',
    config: { textElements: [], logoArea: null },
  } as unknown as SavedWelcomeBoardPreset

  it('같은 id 저장 시 추가(중복)된다', () => {
    presetStorageUtils.savePreset(preset)
    presetStorageUtils.savePreset(preset)
    expect(presetStorageUtils.getAllPresets()).toHaveLength(2)
  })

  it('고아 프리셋 정리가 동작한다', () => {
    presetStorageUtils.savePreset(preset)
    presetStorageUtils.savePreset({ ...preset, id: 'wb2', templateId: 'gone' })
    expect(presetStorageUtils.cleanupOrphanedPresets(['t1'])).toBe(1)
    expect(presetStorageUtils.getAllPresets()).toHaveLength(1)
  })
})
