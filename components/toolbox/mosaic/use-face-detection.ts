'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_FACE_SETTINGS, FACE_MARGIN_MAX, FACE_MARGIN_MIN, FACE_SETTINGS_KEY, parseFaceSettings, type FaceBox, type FaceSettings } from '@/lib/toolbox/mosaic/face'
import { createFaceEngine } from '@/lib/toolbox/mosaic/face-engine'
import { useDetectionRun } from './use-detection-run'

/**
 * 얼굴 감지 실행 상태 + 설정(불러올 때 자동 적용·얼굴 여백, localStorage 저장).
 * detect는 취소되면 null을 돌려준다.
 */
export function useFaceDetection() {
  const { busy, progress, run, cancel } = useDetectionRun(createFaceEngine)
  const [settings, setSettings] = useState<FaceSettings>(DEFAULT_FACE_SETTINGS)
  const restored = useRef(false)

  useEffect(() => {
    try {
      setSettings(parseFaceSettings(window.localStorage.getItem(FACE_SETTINGS_KEY)))
    } catch {
      // 저장소를 쓸 수 없는 환경 — 기본값
    }
    restored.current = true
  }, [])

  // 저장은 지연한다 — 마운트 직후 한 번 도는 effect가 기본값으로 저장값을 덮어쓰지 않게(복원으로 설정이 바뀌면 이 타이머는 취소된다)
  useEffect(() => {
    if (!restored.current) return
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(FACE_SETTINGS_KEY, JSON.stringify(settings))
      } catch {
        // 저장 실패는 무시(편의 기능)
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [settings])

  const detect = useCallback((canvas: HTMLCanvasElement): Promise<FaceBox[] | null> => run(canvas), [run])

  const setAuto = useCallback((auto: boolean) => setSettings((s) => ({ ...s, auto })), [])
  const setMargin = useCallback(
    (margin: number) => setSettings((s) => ({ ...s, margin: Math.min(FACE_MARGIN_MAX, Math.max(FACE_MARGIN_MIN, Math.round(margin))) })),
    []
  )

  return { busy, progress, settings, detect, cancel, setAuto, setMargin }
}
