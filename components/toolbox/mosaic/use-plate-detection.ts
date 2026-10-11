'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPlateEngine } from '@/lib/toolbox/mosaic/plate-engine'
import type { FaceBox } from '@/lib/toolbox/mosaic/face'
import {
  DEFAULT_PLATE_SETTINGS,
  PLATE_MARGIN_MAX,
  PLATE_MARGIN_MIN,
  PLATE_SETTINGS_KEY,
  parsePlateSettings,
  type PlateSettings,
} from '@/lib/toolbox/mosaic/plate'
import { useDetectionRun } from './use-detection-run'

/**
 * 번호판 감지 실행 상태 + 설정(번호판 여백·정밀 감지, localStorage 저장). 얼굴 감지(`use-face-detection`)와 같은 틀이다.
 * detect는 취소되면 null을 돌려준다.
 */
export function usePlateDetection() {
  const { busy, progress, run, cancel } = useDetectionRun(createPlateEngine)
  const [settings, setSettings] = useState<PlateSettings>(DEFAULT_PLATE_SETTINGS)
  const restored = useRef(false)

  useEffect(() => {
    try {
      setSettings(parsePlateSettings(window.localStorage.getItem(PLATE_SETTINGS_KEY)))
    } catch {
      // 저장소를 쓸 수 없는 환경 — 기본값
    }
    restored.current = true
  }, [])

  // 저장은 지연한다 — 마운트 직후 한 번 도는 effect가 기본값으로 저장값을 덮어쓰지 않게
  useEffect(() => {
    if (!restored.current) return
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(PLATE_SETTINGS_KEY, JSON.stringify(settings))
      } catch {
        // 저장 실패는 무시(편의 기능)
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [settings])

  const precise = settings.precise
  const detect = useCallback((canvas: HTMLCanvasElement): Promise<FaceBox[] | null> => run(canvas, { upscale: precise }), [run, precise])

  const setPrecise = useCallback((value: boolean) => setSettings((s) => ({ ...s, precise: value })), [])
  const setMargin = useCallback(
    (margin: number) => setSettings((s) => ({ ...s, margin: Math.min(PLATE_MARGIN_MAX, Math.max(PLATE_MARGIN_MIN, Math.round(margin))) })),
    []
  )

  return { busy, progress, settings, detect, cancel, setPrecise, setMargin }
}
