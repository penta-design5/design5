'use client'

import { ScanText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExtractResult, type ExtractResultProps } from './ExtractResult'
import { PdfOptions, type PdfOptionsProps } from './PdfOptions'

type ExtractSidePanelProps = ExtractResultProps & {
  canExtract: boolean
  /** PDF를 열었을 때만(이미지면 null) */
  pdf: PdfOptionsProps | null
  /** 선택 영역이 있으면 안내 문구(없으면 null = 전체) */
  regionLabel: string | null
  /** 영역 선택이 되는 파일인가(오피스 문서는 아님) */
  selectable: boolean
  onClearRegion: () => void
  onExtract: () => void
}

/** 모델 크기 안내 — 십진 MB(진행 카드와 같은 표기) */
export const MODEL_SIZE_LABEL = '약 18MB'

/**
 * 우측 패널(1280px 이상) — (PDF면 페이지 범위·모든 페이지 OCR) · 「텍스트 추출」 버튼 · 추출 결과(수정·복사·저장) · 안내.
 * 1280px 미만에서는 추출 버튼을 헤더로, 결과를 본문 카드로 옮긴다(TextExtractorPage).
 */
export function ExtractSidePanel({ canExtract, pdf, regionLabel, selectable, onClearRegion, onExtract, ...resultProps }: ExtractSidePanelProps) {
  return (
    <div className="flex h-full w-[410px] flex-col gap-5 overflow-y-auto border-l bg-background p-6">
      <h2 className="text-lg font-semibold">텍스트 추출</h2>

      {pdf && <PdfOptions idPrefix="panel" {...pdf} />}

      <section className="space-y-2">
        <p className="text-sm">
          <span className="text-muted-foreground">인식 언어 </span>한국어 + 영어
        </p>
        <ExtractScope regionLabel={regionLabel} onClearRegion={onClearRegion} disabled={resultProps.disabled} selectable={selectable} />
        <Button type="button" className="w-full" onClick={onExtract} disabled={!canExtract}>
          <ScanText className="mr-2 h-4 w-4" />
          텍스트 추출
        </Button>
      </section>

      <ExtractResult idPrefix="panel" className="flex-1" {...resultProps} />

      <ExtractNotes />
    </div>
  )
}

/** 추출 범위 — 전체 / 선택 영역(해제). 패널·본문 카드 공용 */
export function ExtractScope({ regionLabel, onClearRegion, disabled, selectable = true }: { regionLabel: string | null; onClearRegion: () => void; disabled?: boolean; selectable?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm" data-testid="ocr-scope">
      <p>
        <span className="text-muted-foreground">추출 범위 </span>
        {regionLabel ?? '전체'}
      </p>
      {regionLabel ? (
        <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={onClearRegion} disabled={disabled}>
          선택 해제
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">{selectable ? '미리보기 「영역 선택」으로 일부만' : ''}</span>
      )}
    </div>
  )
}

/** 안내 — 패널·본문 카드 공용 */
export function ExtractNotes() {
  return (
    <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
      <li>인식 결과는 원본 품질에 따라 틀릴 수 있습니다. 사용하기 전에 꼭 확인하세요.</li>
      <li>표는 칸 구분 없이 행 단위 텍스트로 추출됩니다.</li>
      <li>미리보기의 노란 상자는 글자를 읽은 위치입니다. 마우스를 올리면 읽은 글자가 보입니다.</li>
      <li>PDF는 들어 있는 글자를 그대로 읽고, 글자가 없는 스캔 페이지만 OCR로 읽습니다.</li>
      <li>Word·PowerPoint·Excel·한글(HWPX) 문서는 글자를 그대로 가져옵니다(표는 칸을 탭으로 구분). 이전 형식(DOC·PPT·XLS·HWP)은 새 형식으로 저장한 뒤 열어 주세요.</li>
      <li>처음 사용할 때 인식 모델({MODEL_SIZE_LABEL})을 한 번 내려받습니다. 파일은 서버로 전송되지 않습니다.</li>
    </ul>
  )
}
