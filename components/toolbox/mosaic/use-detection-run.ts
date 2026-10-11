'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DetectionEngine } from '@/lib/toolbox/mosaic/detection-engine'
import type { FaceBox } from '@/lib/toolbox/mosaic/face'

export interface DetectionRunState {
  busy: boolean
  /** 0~1, 모델을 준비하는 동안은 null */
  progress: number | null
}

const IDLE: DetectionRunState = { busy: false, progress: null }

/**
 * 감지 실행 상태(얼굴·번호판 공용). Worker는 처음 감지할 때 만들고 페이지를 떠나면 끝낸다. run은 취소되면 null을 돌려준다.
 * createEngine은 매 렌더 새로 만들어도 된다(첫 실행 때 한 번만 쓴다).
 */
export function useDetectionRun(createEngine: () => DetectionEngine) {
  const engineRef = useRef<DetectionEngine | null>(null)
  const createRef = useRef(createEngine)
  createRef.current = createEngine
  const runRef = useRef(0)
  const [state, setState] = useState<DetectionRunState>(IDLE)

  useEffect(
    () => () => {
      runRef.current++
      engineRef.current?.dispose()
      engineRef.current = null
    },
    []
  )

  const run = useCallback(async (canvas: HTMLCanvasElement, options: { upscale?: boolean } = {}): Promise<FaceBox[] | null> => {
    const id = ++runRef.current
    setState({ busy: true, progress: null })
    try {
      engineRef.current ??= createRef.current()
      const result = await engineRef.current.detect(canvas, {
        upscale: options.upscale,
        onProgress: (done, total) => {
          if (id === runRef.current) setState({ busy: true, progress: total > 0 ? done / total : null })
        },
      })
      return id === runRef.current ? result.boxes : null
    } catch (e) {
      if (id !== runRef.current) return null // 취소됨
      throw e
    } finally {
      if (id === runRef.current) setState(IDLE)
    }
  }, [])

  const cancel = useCallback(() => {
    runRef.current++
    engineRef.current?.cancel()
    setState(IDLE)
  }, [])

  return { ...state, run, cancel }
}
