'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EMOJI_FONT_FAMILY } from '@/lib/toolbox/special-characters/emoji-support'
import { codePointLabel, type CharEntry } from '@/lib/toolbox/special-characters/types'

interface CharacterGridProps {
  entries: CharEntry[]
  /** 방금 복사한 문자(잠깐 강조) */
  flashChar: string | null
  onPick: (entry: CharEntry) => void
  /**
   * grouped(기본): 정사각 격자(문자·이모지) → 내용 폭 칸(텍스트 이모티콘) 두 그룹으로 나눈다 — 카테고리·검색 결과용.
   * ordered: 종류가 섞여 있어도 **주어진 순서를 그대로** 한 줄 흐름으로 배치한다 — 최근 사용·즐겨찾기용(시간순·추가순이 의미).
   */
  layout?: 'grouped' | 'ordered'
}

const CELL_BASE =
  'rounded-md border bg-background transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const FLASH = 'border-primary bg-primary/10 ring-2 ring-primary'

/** 칸 설명 툴팁 — 이름(+ 코드포인트). 앱 전역 `TooltipProvider`(app/providers.tsx, 지연 300ms)를 쓴다. 터치에서는 열리지 않고 탭하면 바로 복사된다. */
function CellTooltip({ name, code, children }: { name: string; code?: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-[260px] break-words">
        <p>{name}</p>
        {code && <p className="mt-0.5 text-xs text-white/70">{code}</p>}
      </TooltipContent>
    </Tooltip>
  )
}

/** 폭이 고정인 문자·이모지 칸(정사각). `fixedWidth`면 격자 열 폭에 맞추지 않고 52px로 고정한다. */
function FixedCell({ entry, flash, fixedWidth, onPick }: { entry: CharEntry; flash: boolean; fixedWidth?: boolean; onPick: (entry: CharEntry) => void }) {
  return (
    <CellTooltip name={entry.name} code={codePointLabel(entry.char)}>
      <button
        style={entry.emoji ? { fontFamily: EMOJI_FONT_FAMILY } : undefined}
        type="button"
        aria-label={`${entry.name} ${entry.char} 복사`}
        onClick={() => onPick(entry)}
        className={cn(CELL_BASE, 'flex h-12 items-center justify-center text-2xl leading-none', fixedWidth && 'w-[52px] shrink-0', flash && FLASH)}
      >
        {entry.char}
      </button>
    </CellTooltip>
  )
}

/** 폭이 가변인 텍스트 이모티콘 칸 — 공백이 여러 개여도 그대로 보이도록 pre-wrap, 패널보다 넓어지면 글자 단위로 줄바꿈 */
function WideCell({ entry, flash, onPick }: { entry: CharEntry; flash: boolean; onPick: (entry: CharEntry) => void }) {
  return (
    <CellTooltip name={entry.name}>
      <button
        type="button"
        aria-label={`${entry.name} ${entry.char} 복사`}
        onClick={() => onPick(entry)}
        className={cn(CELL_BASE, 'min-h-12 max-w-full whitespace-pre-wrap px-3.5 py-2 text-lg leading-snug [overflow-wrap:anywhere]', flash && FLASH)}
      >
        {entry.char}
      </button>
    </CellTooltip>
  )
}

/**
 * 문자 격자 — 칸을 클릭(Enter·Space)하면 복사한다. 칸 크기는 터치 기준(48px 이상).
 * 폭이 고정인 문자·이모지는 정사각 격자, 폭이 가변인 텍스트 이모티콘(`wide`)은 내용 폭의 칸을 줄바꿈하며 배치한다
 * (검색 결과처럼 섞여 있으면 격자 → 텍스트 이모티콘 순, 각 그룹 안에서는 검색 순위를 유지 — `layout="grouped"`).
 */
export function CharacterGrid({ entries, flashChar, onPick, layout = 'grouped' }: CharacterGridProps) {
  if (layout === 'ordered') {
    return (
      <div className="flex flex-wrap gap-1.5" data-testid="ordered-entries">
        {entries.map((entry) =>
          entry.wide ? (
            <WideCell key={entry.char} entry={entry} flash={flashChar === entry.char} onPick={onPick} />
          ) : (
            <FixedCell key={entry.char} entry={entry} flash={flashChar === entry.char} fixedWidth onPick={onPick} />
          )
        )}
      </div>
    )
  }

  const fixed = entries.filter((e) => !e.wide)
  const wide = entries.filter((e) => e.wide)

  return (
    <div className="space-y-3">
      {fixed.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1.5">
          {fixed.map((entry) => (
            <FixedCell key={entry.char} entry={entry} flash={flashChar === entry.char} onPick={onPick} />
          ))}
        </div>
      )}
      {wide.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="wide-entries">
          {wide.map((entry) => (
            <WideCell key={entry.char} entry={entry} flash={flashChar === entry.char} onPick={onPick} />
          ))}
        </div>
      )}
    </div>
  )
}
