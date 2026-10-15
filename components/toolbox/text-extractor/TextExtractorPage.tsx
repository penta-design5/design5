'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, ScanText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES, FILE_INPUT_ACCEPT } from '@/lib/toolbox/common/constants'
import { downloadBlob } from '@/lib/toolbox/common/export'
import { ImageLoadError, decodeImageFile, getImageFileFromClipboard, validateImageFile } from '@/lib/toolbox/common/load'
import {
  PREVIEW_RENDER_LONG_SIDE,
  defaultPageRange,
  isPdfFile,
  parsePageRange,
  summarizePages,
  validatePdfFile,
} from '@/lib/toolbox/text-extractor/pdf'
import { PdfLoadError, openPdf, renderPage, type PDFDocumentProxy } from '@/lib/toolbox/text-extractor/pdf-document'
import type { TextBox } from '@/lib/toolbox/text-extractor/layout'
import {
  OFFICE_ACCEPT,
  OfficeLoadError,
  extractOffice,
  legacyOfficeMessage,
  officeFormatOf,
  validateOfficeFile,
  type OfficeFormat,
  type OfficeResult,
} from '@/lib/toolbox/text-extractor/office'
import { buildOmissions, type Omission } from '@/lib/toolbox/text-extractor/omissions'
import type { NormRect } from '@/lib/toolbox/text-extractor/region'
import { renderDocxPreview } from '@/lib/toolbox/text-extractor/render-docx'
import { textFileName } from '@/lib/toolbox/text-extractor/text'
import { ExtractResult } from './ExtractResult'
import { ExtractPreview } from './ExtractPreview'
import { ExtractNotes, ExtractScope, ExtractSidePanel } from './ExtractSidePanel'
import { ExtractUploadZone } from './ExtractUploadZone'
import { OcrProgressCard } from './OcrProgressCard'
import { OfficeCard } from './OfficeCard'
import { OfficeVisualPreview, type OfficeRenderer } from './OfficeVisualPreview'
import { PdfOptions, type PdfOptionsProps } from './PdfOptions'
import { useCrossOriginIsolation } from './use-cross-origin-isolation'
import { useOcr } from './use-ocr'

type Source =
  | { kind: 'image'; canvas: HTMLCanvasElement; fileName: string }
  | { kind: 'pdf'; doc: PDFDocumentProxy; fileName: string; numPages: number }
  | { kind: 'office'; format: OfficeFormat; data: ArrayBuffer; result: OfficeResult; fileName: string; size: number }

const FILE_ACCEPT = `${FILE_INPUT_ACCEPT},application/pdf,.pdf,${OFFICE_ACCEPT}`

/** 형식별 화면 미리보기 렌더러 — 없는 형식은 문서 카드(P4-R1: Word만) */
const OFFICE_RENDERERS: Partial<Record<OfficeFormat, OfficeRenderer>> = { docx: renderDocxPreview }

const UNSUPPORTED_MESSAGE = '지원하지 않는 형식입니다. 이미지(PNG·JPG·WebP·GIF·BMP), PDF, 문서(DOCX·PPTX·XLSX·HWPX)를 사용해 주세요.'

/** 이미지로 볼 수 있는 파일인가(형식만 — 크기 등은 validateImageFile) */
const looksLikeImage = (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return file.type.startsWith('image/') || (ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type) || (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext) || ext === 'heic' || ext === 'heif'
}

/**
 * TOOLBOX「텍스트추출(OCR)」 — 브라우저에서만 처리(서버 전송·저장 없음, DB 없음).
 * 입력: 이미지(OCR) · PDF(페이지마다 텍스트 레이어 우선, 없으면 OCR — P2) · 오피스 문서(DOCX·PPTX·XLSX·HWPX — XML에서 글자를 그대로, P4).
 * 미리보기에서 영역을 골라 그 부분만 추출·읽은 줄 상자 표시(P3 — 이미지·PDF만).
 * 레이아웃: 좌측 원본 미리보기(PDF는 페이지 넘기기) + 우측 410px 패널(xl 이상: PDF 옵션·추출 버튼·결과).
 * 1280px 미만은 추출 버튼을 헤더로, PDF 옵션·결과를 미리보기 아래 본문 카드로 옮긴다(결과를 Sheet에 숨기지 않도록 — 파일명 일괄 변경 P5와 같은 판단).
 * 사이드바 메뉴: lib/toolbox/menu.ts의 TOOLBOX_MENU(P5에서 등록).
 * 구현 기록: docs/TOOLBOX_text-extractor_handoff.md
 */
export function TextExtractorPage() {
  const isCompactViewport = useMediaQuery('(max-width: 1279px)')
  const [source, setSource] = useState<Source | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewPage, setPreviewPage] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [region, setRegion] = useState<NormRect | null>(null)
  /** 마지막 추출에서 읽은 줄 상자(페이지 번호별, 이미지는 1쪽) */
  const [linesByPage, setLinesByPage] = useState<Record<number, TextBox[]> | null>(null)
  const [showLines, setShowLines] = useState(true)
  const [startText, setStartText] = useState('1')
  const [endText, setEndText] = useState('1')
  const [forceOcr, setForceOcr] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [omissions, setOmissions] = useState<Omission[]>([])
  const [dragActive, setDragActive] = useState(false)
  const dragDepth = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { status, running, run, runPdf, cancel } = useOcr()
  useCrossOriginIsolation()

  // 바뀐(닫힌) PDF 정리
  useEffect(() => () => {
    if (source?.kind === 'pdf') void source.doc.destroy()
  }, [source])

  // 미리보기 — 이미지는 그대로, PDF는 보고 있는 페이지를 그린다(늦게 끝난 이전 그리기는 버림)
  useEffect(() => {
    if (!source || source.kind === 'office') {
      setPreviewUrl(null)
      setPreviewSize(null)
      return
    }
    let canceled = false
    let url: string | null = null
    setPreviewUrl(null) // 새로 그리는 동안 이전 파일·페이지 그림을 남기지 않는다
    setPreviewSize(null)
    setPreviewLoading(true)
    ;(async () => {
      const canvas = source.kind === 'image' ? source.canvas : await renderPage(source.doc, previewPage, PREVIEW_RENDER_LONG_SIDE)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (canceled || !blob) return
      url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setPreviewSize({ width: canvas.width, height: canvas.height })
    })()
      .catch((e) => {
        if (!canceled) {
          console.error('[OCR] 미리보기 실패:', e)
          setPreviewUrl(null)
          toast.error('미리보기를 그리지 못했습니다.')
        }
      })
      .finally(() => {
        if (!canceled) setPreviewLoading(false)
      })
    return () => {
      canceled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [source, previewPage])

  const openFile = useCallback(
    async (file: File) => {
      const pdf = isPdfFile(file)
      const office = officeFormatOf(file)
      const legacy = legacyOfficeMessage(file)
      if (legacy) {
        toast.error(legacy)
        return
      }
      if (!pdf && !office && !looksLikeImage(file)) {
        toast.error(UNSUPPORTED_MESSAGE)
        return
      }
      const error = pdf ? validatePdfFile(file) : office ? validateOfficeFile(file) : validateImageFile(file)
      if (error) {
        toast.error(error)
        return
      }
      cancel() // 이전 파일 추출 중이면 멈춘다
      setLoading(true)
      try {
        const fileName = file.name || (pdf ? 'document.pdf' : 'image.png')
        if (office) {
          // 문서는 열 때 바로 읽는다(빠름 — 손상·암호 문서를 바로 알린다). 「텍스트 추출」은 읽어 둔 결과를 보여 준다
          const data = await file.arrayBuffer()
          setSource({ kind: 'office', format: office, data, result: await extractOffice(data.slice(0), office), fileName, size: file.size })
        } else if (pdf) {
          const doc = await openPdf(file)
          const range = defaultPageRange(doc.numPages)
          setSource({ kind: 'pdf', doc, fileName, numPages: doc.numPages })
          setStartText(String(range.start))
          setEndText(String(range.end))
        } else {
          setSource({ kind: 'image', canvas: await decodeImageFile(file), fileName })
        }
        setPreviewPage(1)
        setText(null)
        setSummary(null)
        setOmissions([])
        setRegion(null)
        setSelecting(false)
        setLinesByPage(null)
      } catch (e) {
        const known = e instanceof ImageLoadError || e instanceof PdfLoadError || e instanceof OfficeLoadError
        if (!known) console.error('[OCR] 파일 열기 실패:', e)
        toast.error(known ? e.message : '파일을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [cancel]
  )

  // 클립보드 붙여넣기 (이미지가 있을 때만 가로챔 — 결과 텍스트 영역의 글자 붙여넣기는 그대로)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = getImageFileFromClipboard(e.clipboardData)
      if (!file) return
      e.preventDefault()
      void openFile(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [openFile])

  // 드래그 앤 드롭 — preventDefault로 브라우저가 파일을 새 탭에서 여는 기본 동작 차단
  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault()
      dragDepth.current += 1
      setDragActive(true)
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault()
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (dragDepth.current === 0) setDragActive(false)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      dragDepth.current = 0
      setDragActive(false)
      const file = e.dataTransfer.files?.[0]
      if (file && !loading) void openFile(file)
    },
  }

  const browse = () => fileInputRef.current?.click()

  const rangeResult = source?.kind === 'pdf' ? parsePageRange(startText, endText, source.numPages) : null
  // 선택 영역이 있으면 페이지 범위 대신 보고 있는 페이지만 추출하므로 범위 오류는 막지 않는다
  const rangeError = !region && rangeResult && 'error' in rangeResult ? rangeResult.error : null

  // 다른 페이지로 넘기면 선택 영역은 해제(영역은 그 페이지 기준)
  const changePreviewPage = useCallback((page: number) => {
    setPreviewPage(page)
    setRegion(null)
  }, [])
  const chooseRegion = useCallback((next: NormRect | null) => {
    setRegion(next)
    if (next) setSelecting(false) // 한 번 고르면 선택 모드를 끝낸다(다시 고르려면 「영역 선택」)
  }, [])

  const extract = useCallback(async () => {
    if (!source || running) return
    try {
      if (source.kind === 'office') {
        const { result } = source
        setText(result.text)
        setSummary(result.summary)
        setOmissions(result.omissions)
        setLinesByPage(null)
        if (!result.text.trim()) toast.info('문서에서 글자를 찾지 못했습니다.')
      } else if (source.kind === 'image') {
        const result = await run(source.canvas, region)
        if (!result) return // 취소
        setText(result.text)
        setSummary(region ? '선택 영역' : null)
        setOmissions([])
        setLinesByPage({ 1: result.lines })
        if (!result.text.trim()) toast.info(region ? '선택 영역에서 글자를 찾지 못했습니다.' : '이미지에서 글자를 찾지 못했습니다.')
      } else {
        const range = region ? { start: previewPage, end: previewPage } : rangeResult && 'range' in rangeResult ? rangeResult.range : null
        if (!range) return
        const result = await runPdf(source.doc, range, forceOcr, region)
        if (!result) return // 취소
        setText(result.text)
        setSummary(`${region ? '선택 영역 · ' : ''}${summarizePages(result.pages)}`)
        setOmissions(buildOmissions({ pdfImagePages: result.pages.filter((p) => p.source === 'text' && p.hasImages).map((p) => p.page) }))
        setLinesByPage(Object.fromEntries(result.pages.map((p) => [p.page, p.lines ?? []])))
        if (result.pages.every((p) => !p.text.trim())) toast.info(region ? '선택 영역에서 글자를 찾지 못했습니다.' : 'PDF에서 글자를 찾지 못했습니다.')
      }
    } catch (e) {
      if (!(e instanceof OfficeLoadError)) console.error('[OCR] 추출 실패:', e)
      toast.error(e instanceof Error && e.message ? e.message : '텍스트를 추출하지 못했습니다.')
    }
  }, [source, running, run, runPdf, rangeResult, forceOcr, region, previewPage])

  const fileName = textFileName(source?.fileName ?? null)

  const copy = useCallback(async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success('추출한 텍스트를 복사했습니다.')
    } catch {
      toast.error('복사하지 못했습니다. 결과를 직접 선택해 복사해 주세요.')
    }
  }, [text])

  const save = useCallback(() => {
    if (!text) return
    downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), fileName)
  }, [text, fileName])

  const canExtract = source !== null && !running && !loading && rangeError === null
  const resultProps = { text, fileName, summary, omissions, disabled: running, onTextChange: setText, onCopy: copy, onSave: save }
  const pdfProps: PdfOptionsProps | null =
    source?.kind === 'pdf'
      ? {
          numPages: source.numPages,
          startText,
          endText,
          rangeError,
          forceOcr,
          regionPage: region ? previewPage : null,
          disabled: running,
          onStartTextChange: setStartText,
          onEndTextChange: setEndText,
          onForceOcrChange: setForceOcr,
        }
      : null
  const regionLabel = region ? (source?.kind === 'pdf' ? `선택 영역(${previewPage}쪽)` : '선택 영역') : null
  const clearRegion = useCallback(() => setRegion(null), [])
  const previewAlt = source
    ? source.kind === 'pdf'
      ? `원본 PDF: ${source.fileName} ${previewPage}쪽`
      : `원본 이미지: ${source.fileName}`
    : ''

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50" {...dropHandlers}>
      <div className="flex-1 min-w-0 pr-0 xl:pr-[410px]">
        <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 pt-16 pb-8 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="page-header-title">텍스트추출(OCR)</h1>
              <p className="text-muted-foreground mt-2">
                이미지·스캔 문서·PDF·오피스 문서에서 글자를 추출해 복사하거나 저장하세요. 파일은 서버로 전송되지 않습니다.
              </p>
            </div>
            {source && (
              <div className="flex shrink-0 gap-2 xl:hidden">
                <Button type="button" onClick={extract} disabled={!canExtract}>
                  <ScanText className="mr-2 h-4 w-4" />
                  텍스트 추출
                </Button>
              </div>
            )}
          </div>

          {source?.kind === 'office' ? (
            OFFICE_RENDERERS[source.format] ? (
              <OfficeVisualPreview
                fileName={source.fileName}
                format={source.format}
                size={source.size}
                data={source.data}
                render={OFFICE_RENDERERS[source.format]!}
                busy={loading}
                dragActive={dragActive}
                onBrowse={browse}
              />
            ) : (
              <OfficeCard fileName={source.fileName} format={source.format} size={source.size} busy={loading} dragActive={dragActive} onBrowse={browse} />
            )
          ) : source ? (
            <ExtractPreview
              url={previewUrl}
              size={previewSize}
              alt={previewAlt}
              loading={previewLoading}
              numPages={source.kind === 'pdf' ? source.numPages : null}
              page={previewPage}
              onPageChange={changePreviewPage}
              lines={linesByPage?.[source.kind === 'pdf' ? previewPage : 1] ?? null}
              showLines={showLines}
              onShowLinesChange={setShowLines}
              selecting={selecting}
              onSelectingChange={setSelecting}
              region={region}
              onRegionChange={chooseRegion}
              busy={running || loading}
              dragActive={dragActive}
              onBrowse={browse}
            >
              {status.kind === 'running' && (
                <OcrProgressCard progress={status.progress} startedAt={status.startedAt} page={status.page} onCancel={cancel} />
              )}
            </ExtractPreview>
          ) : (
            <ExtractUploadZone dragActive={dragActive} disabled={loading} onBrowse={browse} className="min-h-[320px] flex-1" />
          )}

          {/* 1280px 미만: PDF 옵션·결과를 본문에 둔다 */}
          {isCompactViewport && source && (
            <div className="space-y-4 rounded-lg border bg-card p-4">
              {pdfProps && <PdfOptions idPrefix="main" {...pdfProps} />}
              <ExtractScope regionLabel={regionLabel} onClearRegion={clearRegion} disabled={running} selectable={source.kind !== 'office'} />
              <ExtractResult idPrefix="main" {...resultProps} />
              <ExtractNotes />
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 xl:right-[410px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 1280px 미만에서는 패널을 렌더하지 않는다(숨겨진 중복 입력·결과 영역이 DOM에 남지 않도록) */}
      {!isCompactViewport && (
        <div className="fixed right-0 top-0 bottom-0">
          <ExtractSidePanel canExtract={canExtract} pdf={pdfProps} regionLabel={regionLabel} selectable={source?.kind !== 'office'} onClearRegion={clearRegion} onExtract={extract} {...resultProps} />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = '' // 같은 파일을 다시 선택해도 change가 발생하도록
          if (file) void openFile(file)
        }}
      />
    </div>
  )
}
