'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { prepareModelInput } from '@/lib/toolbox/background-editor/cutout'
import { BackgroundEngine, type EngineReady } from '@/lib/toolbox/background-editor/engine'
import { toAlphaMask } from '@/lib/toolbox/background-editor/mask'
import { EXPECTED_CEIL_MODE_COUNT, MODEL, ModelLoadError, loadModelBytes, patchCeilMode } from '@/lib/toolbox/background-editor/model'
import type { InferenceBackend } from '@/lib/toolbox/background-editor/protocol'
import type { RecognitionSettings } from '@/lib/toolbox/background-editor/recognition'

export type ModelStatus =
  | { kind: 'idle' }
  | { kind: 'downloading'; loaded: number; total: number }
  | { kind: 'verifying' }
  | { kind: 'preparing' }
  | { kind: 'ready'; backend: InferenceBackend; fromCache: boolean }
  | { kind: 'canceled' }
  | { kind: 'error'; message: string }

/** 배경 제거 단계 — ① 이미지 준비 → ② 배경 분석(AI) → ③ 결과 만들기 */
export type RemovalStep = 'prepare' | 'infer' | 'compose'

export type RemovalStatus =
  | { kind: 'idle' }
  | { kind: 'running'; step: RemovalStep; startedAt: number }
  | { kind: 'done'; ms: number; backend: InferenceBackend }
  | { kind: 'error'; message: string }

const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError'

/** 내려받기 오류(ModelLoadError)는 그대로, 그 밖(세션 생성 실패 등 실행기 원문)은 쉬운 안내로 바꾼다 — 원문은 콘솔에 남긴다 */
const PREPARE_ERROR = 'AI 모델을 준비하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.'
const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * 모델 준비(내려받기·검증·세션 생성)와 배경 제거 실행 상태.
 * - 모델은 처음 remove()를 부를 때(「배경 제거」 버튼) 준비한다(페이지에 들어오거나 이미지를 불러오기만 해서는 받지 않음)
 * - 새 이미지로 다시 부르면 이전 작업 결과는 버린다(null 반환)
 * - WebGPU 실행이 실패하면 CPU로 세션을 다시 만들어 한 번 재시도한다
 */
export function useBackgroundRemoval() {
  const [model, setModel] = useState<ModelStatus>({ kind: 'idle' })
  const [removal, setRemoval] = useState<RemovalStatus>({ kind: 'idle' })
  const engineRef = useRef<BackgroundEngine | null>(null)
  const readyRef = useRef<Promise<EngineReady> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const jobRef = useRef(0)

  useEffect(
    () => () => {
      abortRef.current?.abort()
      engineRef.current?.dispose()
      engineRef.current = null
    },
    []
  )

  /** 모델 바이트를 얻어 Worker 세션을 만든다 — 진행 상태를 model에 반영 */
  const prepare = useCallback(async (forceWasm: boolean): Promise<EngineReady> => {
    const controller = new AbortController()
    abortRef.current = controller
    const { bytes, fromCache } = await loadModelBytes({
      signal: controller.signal,
      onProgress: (p) =>
        setModel(p.phase === 'download' ? { kind: 'downloading', loaded: p.loaded, total: p.total } : { kind: 'verifying' }),
    })
    abortRef.current = null
    setModel({ kind: 'preparing' })
    // 보정 개수가 예상과 다르면(모델 교체 등) WebGPU 호환을 장담할 수 없으므로 CPU로만 실행
    const patched = patchCeilMode(bytes) === EXPECTED_CEIL_MODE_COUNT
    engineRef.current ??= new BackgroundEngine()
    const ready = await engineRef.current.load(bytes, forceWasm || !patched)
    setModel({ kind: 'ready', backend: ready.backend, fromCache })
    return ready
  }, [])

  /** 준비 시작 — 실패하면 다음 호출에서 다시 시도하도록 비우고, 취소·오류를 model에 반영 */
  const startPrepare = useCallback(
    (forceWasm: boolean) => {
      const promise = prepare(forceWasm).catch((e) => {
        if (readyRef.current === promise) readyRef.current = null
        if (isAbort(e)) {
          setModel({ kind: 'canceled' })
        } else {
          if (!(e instanceof ModelLoadError)) console.error('[background-editor] model prepare failed', e)
          setModel({ kind: 'error', message: e instanceof ModelLoadError ? e.message : PREPARE_ERROR })
        }
        throw e
      })
      readyRef.current = promise
      return promise
    },
    [prepare]
  )

  const ensureModel = useCallback(() => readyRef.current ?? startPrepare(false), [startPrepare])

  const cancelDownload = useCallback(() => abortRef.current?.abort(), [])

  /** 새 이미지를 열 때 — 진행 중인 배경 제거 결과는 버리고 상태를 처음으로(모델 내려받기는 계속) */
  const reset = useCallback(() => {
    jobRef.current++
    setRemoval({ kind: 'idle' })
  }, [])

  /**
   * 배경 제거 — 전경 알파 마스크(모델 해상도 MODEL.inputSize², 경계 다듬기·합성은 페이지가 한다). 더 새 작업이 시작됐거나 모델 준비가 취소·실패하면 null.
   * recognition: 인식 보정 — AI 입력에만 적용한다.
   */
  const remove = useCallback(
    async (source: HTMLCanvasElement, recognition?: RecognitionSettings): Promise<Uint8ClampedArray | null> => {
      const job = ++jobRef.current
      const current = () => job === jobRef.current
      setRemoval({ kind: 'idle' })

      let ready: EngineReady
      try {
        ready = await ensureModel()
      } catch {
        return null // 모델 상태(취소·오류)는 카드가 보여 준다
      }
      if (!current()) return null

      const startedAt = performance.now()
      try {
        setRemoval({ kind: 'running', step: 'prepare', startedAt })
        await nextFrame() // 진행 표시가 먼저 그려지도록
        const input = () => prepareModelInput(source, MODEL.inputSize, recognition)

        setRemoval({ kind: 'running', step: 'infer', startedAt })
        let backend = ready.backend
        let output: Float32Array
        try {
          output = (await engineRef.current!.run(input(), MODEL.inputSize)).output
        } catch (e) {
          if (backend !== 'webgpu') throw e
          // WebGPU 실행 실패(장치 손실 등) → CPU 세션으로 다시 만들어 한 번 더
          ready = await startPrepare(true)
          backend = ready.backend
          setRemoval({ kind: 'running', step: 'infer', startedAt })
          output = (await engineRef.current!.run(input(), MODEL.inputSize)).output
        }
        if (!current()) return null

        setRemoval({ kind: 'running', step: 'compose', startedAt })
        await nextFrame()
        const result = toAlphaMask(output)
        if (!current()) return null
        setRemoval({ kind: 'done', ms: performance.now() - startedAt, backend })
        return result
      } catch (e) {
        if (current()) {
          setRemoval({ kind: 'error', message: '배경을 제거하지 못했습니다. 다시 시도해 주세요.' })
          console.error('[background-editor] removal failed', e)
        }
        return null
      }
    },
    [ensureModel, startPrepare]
  )

  return { model, removal, remove, reset, cancelDownload }
}
