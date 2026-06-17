/**
 * 에디터 프리셋/자동저장 localStorage 유틸 팩토리 (Phase 3)
 *
 * card/desktop/welcomeboard 스키마의 거의 동일한 localStorage 로직을 하나로 통합한다.
 * 카테고리별 차이는 config 옵션으로 흡수한다:
 *  - foreignKey : 프리셋을 묶는 외래키 필드명 (templateId | wallpaperId ...)
 *  - upsert     : savePreset 시 같은 id를 교체할지(true) 추가만 할지(false, 기본)
 *  - ssrGuard   : 모든 localStorage 접근 전 `typeof window` 확인 (SSR 안전)
 *  - logErrors  : catch 블록에서 console.error 출력 여부
 *
 * 반환 객체는 제네릭 이름(getPresetsByForeignId)을 노출하므로, 각 스키마 파일에서
 * 기존 공개 메서드명(getPresetsByTemplateId 등)으로 매핑해 사용한다.
 */

export interface PresetStorageConfig<TPreset> {
  /** 프리셋 목록을 저장하는 localStorage 키 */
  presetsKey: string
  /** 자동저장 키 prefix (실제 키는 `${autosaveKey}-${id}`) */
  autosaveKey: string
  /** 프리셋을 묶는 외래키 필드 (templateId | wallpaperId 등) */
  foreignKey: keyof TPreset
  /** savePreset 시 동일 id를 교체(upsert)할지 여부. 기본 false(추가만) */
  upsert?: boolean
  /** 모든 localStorage 접근을 `typeof window` 가드로 감쌀지 여부. 기본 false */
  ssrGuard?: boolean
  /** 예외 발생 시 console.error 로깅 여부. 기본 false */
  logErrors?: boolean
}

export interface PresetStorage<TPreset, TAutosave> {
  getAllPresets: () => TPreset[]
  getPresetsByForeignId: (id: string) => TPreset[]
  savePreset: (preset: TPreset) => boolean
  deletePreset: (presetId: string) => boolean
  cleanupOrphanedPresets: (existingForeignIds: string[]) => number
  saveAutosave: (id: string, data: TAutosave) => boolean
  getAutosave: (id: string) => TAutosave | null
  clearAutosave: (id: string) => boolean
}

export function createPresetStorageUtils<
  TPreset extends { id: string },
  TAutosave,
>(config: PresetStorageConfig<TPreset>): PresetStorage<TPreset, TAutosave> {
  const { presetsKey, autosaveKey, foreignKey, upsert = false, ssrGuard = false, logErrors = false } = config

  const log = (error: unknown) => {
    if (logErrors) console.error('preset storage 오류:', error)
  }

  // ssrGuard가 켜져 있으면 브라우저 환경에서만 접근, 아니면 직접 접근(기존 동작 유지)
  const readItem = (key: string): string | null => {
    if (ssrGuard) return typeof window !== 'undefined' ? localStorage.getItem(key) : null
    return localStorage.getItem(key)
  }
  const writeItem = (key: string, value: string): void => {
    if (ssrGuard) {
      if (typeof window !== 'undefined') localStorage.setItem(key, value)
    } else {
      localStorage.setItem(key, value)
    }
  }
  const removeItem = (key: string): void => {
    if (ssrGuard) {
      if (typeof window !== 'undefined') localStorage.removeItem(key)
    } else {
      localStorage.removeItem(key)
    }
  }

  const fk = (p: TPreset): string => p[foreignKey] as unknown as string

  const utils: PresetStorage<TPreset, TAutosave> = {
    getAllPresets: (): TPreset[] => {
      try {
        const stored = readItem(presetsKey)
        return stored ? JSON.parse(stored) : []
      } catch (error) {
        log(error)
        return []
      }
    },

    getPresetsByForeignId: (id: string): TPreset[] => {
      return utils.getAllPresets().filter((p) => fk(p) === id)
    },

    savePreset: (preset: TPreset): boolean => {
      try {
        const all = utils.getAllPresets()
        const updated = upsert ? [...all.filter((p) => p.id !== preset.id), preset] : [...all, preset]
        writeItem(presetsKey, JSON.stringify(updated))
        return true
      } catch (error) {
        log(error)
        return false
      }
    },

    deletePreset: (presetId: string): boolean => {
      try {
        const all = utils.getAllPresets().filter((p) => p.id !== presetId)
        writeItem(presetsKey, JSON.stringify(all))
        return true
      } catch (error) {
        log(error)
        return false
      }
    },

    cleanupOrphanedPresets: (existingForeignIds: string[]): number => {
      try {
        const all = utils.getAllPresets()
        const valid = all.filter((p) => existingForeignIds.includes(fk(p)))
        const removed = all.length - valid.length
        if (removed > 0) writeItem(presetsKey, JSON.stringify(valid))
        return removed
      } catch (error) {
        log(error)
        return 0
      }
    },

    saveAutosave: (id: string, data: TAutosave): boolean => {
      try {
        writeItem(`${autosaveKey}-${id}`, JSON.stringify(data))
        return true
      } catch (error) {
        log(error)
        return false
      }
    },

    getAutosave: (id: string): TAutosave | null => {
      try {
        const stored = readItem(`${autosaveKey}-${id}`)
        return stored ? JSON.parse(stored) : null
      } catch (error) {
        log(error)
        return null
      }
    },

    clearAutosave: (id: string): boolean => {
      try {
        removeItem(`${autosaveKey}-${id}`)
        return true
      } catch (error) {
        log(error)
        return false
      }
    },
  }

  return utils
}
