'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ImageLoadError } from '@/lib/toolbox/common/load'
import {
  DEFAULT_WATERMARK_SETTINGS,
  isWatermarkActive,
  loadWatermarkSettings,
  saveWatermarkSettings,
  type WatermarkLogo,
  type WatermarkSettings,
} from '@/lib/toolbox/common/watermark'
import { loadWatermarkLogo } from '@/lib/toolbox/common/watermark-logo'

/**
 * 워터마크 상태(이미지 편집·이미지 모자이크 공용) — 히스토리 밖 설정값이라 실행취소 대상이 아니다.
 * 텍스트 설정은 localStorage에 저장하고(로고·켜짐 상태 제외) 마운트 때 복원한다. 슬라이더 드래그 중 과도한 쓰기를 막으려 저장은 지연한다.
 */
export function useWatermark() {
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_WATERMARK_SETTINGS)
  const [logo, setLogo] = useState<WatermarkLogo | null>(null)
  const restored = useRef(false)

  useEffect(() => {
    setSettings(loadWatermarkSettings())
    restored.current = true
  }, [])

  useEffect(() => {
    if (!restored.current) return
    const timer = window.setTimeout(() => saveWatermarkSettings(settings), 300)
    return () => window.clearTimeout(timer)
  }, [settings])

  const change = useCallback((patch: Partial<WatermarkSettings>) => setSettings((w) => ({ ...w, ...patch })), [])

  const openLogo = useCallback(
    async (file: File) => {
      try {
        setLogo(await loadWatermarkLogo(file))
        change({ kind: 'image' })
      } catch (e) {
        toast.error(e instanceof ImageLoadError ? e.message : '로고 이미지를 불러오지 못했습니다.')
      }
    },
    [change]
  )

  const removeLogo = useCallback(() => setLogo(null), [])

  return { settings, logo, change, openLogo, removeLogo, active: isWatermarkActive(settings, logo) }
}
