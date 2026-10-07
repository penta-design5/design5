'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_FACE_SETTINGS, FACE_MARGIN_MAX, FACE_MARGIN_MIN, FACE_SETTINGS_KEY, parseFaceSettings, type FaceBox, type FaceSettings } from '@/lib/toolbox/mosaic/face'
import { FaceEngine } from '@/lib/toolbox/mosaic/face-engine'

interface FaceState {
  busy: boolean
  /** 0~1, 모델을 준비하는 동안은 null */
  progress: number | null
}

const IDLE: FaceState = { busy: false, progress: null }

/**
 * 얼굴 감지 실행 상태 + 설정(불러올 때 자동 적용·얼굴 여백, localStorage 저장).
 * Worker는 처음 감지할 때 만들고 페이지를 떠나면 끝낸다. detect는 취소되면 null을 돌려준다.
 */
export function useFaceDetection() {
  const engineRef = useRef<FaceEngine | null>(null)
  const runRef = useRef(0)
  const [state, setState] = useState<FaceState>(IDLE)
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

  useEffect(
    () => () => {
      runRef.current++
      engineRef.current?.dispose()
      engineRef.current = null
    },
    []
  )

  const detect = useCallback(async (canvas: HTMLCanvasElement): Promise<FaceBox[] | null> => {
    const run = ++runRef.current
    setState({ busy: true, progress: null })
    try {
      engineRef.current ??= new FaceEngine()
      const result = await engineRef.current.detect(canvas, {
        onProgress: (done, total) => {
          if (run === runRef.current) setState({ busy: true, progress: total > 0 ? done / total : null })
        },
      })
      return run === runRef.current ? result.boxes : null
    } catch (e) {
      if (run !== runRef.current) return null // 취소됨
      throw e
    } finally {
      if (run === runRef.current) setState(IDLE)
    }
  }, [])

  const cancel = useCallback(() => {
    runRef.current++
    engineRef.current?.cancel()
    setState(IDLE)
  }, [])

  const setAuto = useCallback((auto: boolean) => setSettings((s) => ({ ...s, auto })), [])
  const setMargin = useCallback(
    (margin: number) => setSettings((s) => ({ ...s, margin: Math.min(FACE_MARGIN_MAX, Math.max(FACE_MARGIN_MIN, Math.round(margin))) })),
    []
  )

  return { ...state, settings, detect, cancel, setAuto, setMargin }
}
