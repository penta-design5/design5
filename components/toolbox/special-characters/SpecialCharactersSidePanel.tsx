'use client'

import { useLayoutEffect, type RefObject } from 'react'
import { Copy, Eraser, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { COMPOSE_MAX_LENGTH, graphemeCount } from '@/lib/toolbox/special-characters/compose'
import { FAVORITES_MAX, RECENT_MAX, type CharHistory } from '@/lib/toolbox/special-characters/history'
import type { CharEntry } from '@/lib/toolbox/special-characters/types'
import { CharacterGrid } from './CharacterGrid'

export interface ComposeSelection {
  start: number
  end: number
}

interface SpecialCharactersSidePanelProps {
  variant?: 'sheet' | 'sidebar'
  /** 조합 입력창 내용 */
  compose: string
  /** 조합 입력창 DOM(선택 범위를 페이지가 삽입 위치로 쓴다) */
  composeRef: RefObject<HTMLTextAreaElement | null>
  /** 마지막으로 알려진 선택 범위 — Sheet처럼 패널이 다시 마운트될 때 커서를 복원한다 */
  composeSelection: RefObject<ComposeSelection>
  history: CharHistory
  flashChar: string | null
  /** 방금 복사한 문자(없으면 null) — 즐겨찾기 추가·해제 버튼의 대상 */
  lastCopied: CharEntry | null
  lastCopiedIsFavorite: boolean
  onToggleLastCopiedFavorite: () => void
  onComposeChange: (text: string, selection: ComposeSelection) => void
  onComposeSelect: (selection: ComposeSelection) => void
  onComposeCopy: () => void
  onComposeClear: () => void
  onPick: (entry: CharEntry) => void
  onClearRecent: () => void
}

/**
 * 우측 패널 — 조합 입력창 · 최근 사용 · 즐겨찾기.
 * 격자 칸을 클릭하면 클립보드에 복사되면서(D5 B안) 이 조합 입력창에도 이어 붙는다. 최근·즐겨찾기 칸도 같은 동작이다.
 */
export function SpecialCharactersSidePanel({
  variant = 'sidebar',
  compose,
  composeRef,
  composeSelection,
  history,
  flashChar,
  lastCopied,
  lastCopiedIsFavorite,
  onToggleLastCopiedFavorite,
  onComposeChange,
  onComposeSelect,
  onComposeCopy,
  onComposeClear,
  onPick,
  onClearRecent,
}: SpecialCharactersSidePanelProps) {
  const isSheet = variant === 'sheet'
  const count = graphemeCount(compose)

  // Sheet를 열 때 새로 만들어진 입력창에 마지막 커서 위치를 되돌린다
  useLayoutEffect(() => {
    const el = composeRef.current
    const sel = composeSelection.current
    if (el && sel) el.setSelectionRange(Math.min(sel.start, el.value.length), Math.min(sel.end, el.value.length))
  }, [composeRef, composeSelection])

  const readSelection = (el: HTMLTextAreaElement): ComposeSelection => ({ start: el.selectionStart, end: el.selectionEnd })

  return (
    <div
      className={cn(
        'space-y-6 overflow-y-auto bg-background p-6',
        isSheet ? 'h-full min-h-0 w-full pt-14' : 'h-full w-[410px] border-l'
      )}
    >
      <h2 className="text-lg font-semibold">조합·최근 사용</h2>

      <section className="space-y-2" aria-labelledby={`sc-compose-${variant}`}>
        <div className="flex items-baseline justify-between">
          <h3 id={`sc-compose-${variant}`} className="text-sm font-semibold">
            조합 입력창
          </h3>
          <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite" data-testid="compose-count">
            {count}자
          </span>
        </div>
        <Textarea
          ref={composeRef}
          value={compose}
          maxLength={COMPOSE_MAX_LENGTH}
          rows={3}
          spellCheck={false}
          aria-label="조합 입력창"
          placeholder="문자를 클릭하면 클립보드에 복사되면서 여기에도 이어 붙습니다. 직접 입력·수정할 수도 있습니다."
          className="min-h-[88px] resize-y text-base"
          onChange={(e) => onComposeChange(e.target.value, readSelection(e.target))}
          onSelect={(e) => onComposeSelect(readSelection(e.currentTarget))}
        />
        <div className="flex gap-2">
          <Button type="button" className="flex-1" disabled={compose === ''} onClick={onComposeCopy}>
            <Copy className="mr-2 h-4 w-4" />
            전체 복사
          </Button>
          <Button type="button" variant="outline" disabled={compose === ''} onClick={onComposeClear}>
            <Eraser className="mr-2 h-4 w-4" />
            지우기
          </Button>
        </div>
      </section>

      <section className="space-y-2" aria-labelledby={`sc-recent-${variant}`}>
        <div className="flex items-center justify-between">
          <h3 id={`sc-recent-${variant}`} className="text-sm font-semibold">
            최근 사용 <span className="font-normal text-muted-foreground">({history.recent.length}/{RECENT_MAX})</span>
          </h3>
          {history.recent.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={onClearRecent}>
              모두 지우기
            </Button>
          )}
        </div>
        {history.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="recent-empty">
            복사한 문자가 여기에 쌓입니다.
          </p>
        ) : (
          <div data-testid="recent-list">
            <CharacterGrid layout="ordered" entries={history.recent} flashChar={flashChar} onPick={onPick} />
          </div>
        )}
      </section>

      <section className="space-y-2" aria-labelledby={`sc-fav-${variant}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 id={`sc-fav-${variant}`} className="shrink-0 text-sm font-semibold">
            즐겨찾기 <span className="font-normal text-muted-foreground">({history.favorites.length}/{FAVORITES_MAX})</span>
          </h3>
          {/* 방금 복사한 문자를 추가·해제 — 목록과 같은 곳에 둬 찾기 쉽게(화면 아래 고정 안내줄의 버튼과 같은 동작) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="fav-toggle-panel"
            className="h-8 min-w-0 gap-1.5 px-2.5 [@media(pointer:coarse)]:h-10"
            disabled={lastCopied === null}
            data-favorite={lastCopied ? lastCopiedIsFavorite : undefined}
            // 이름은 보이는 글자 그대로(「문자」 추가/해제), 어떤 문자인지는 고정 안내줄의 설명(복사됨: …)이 보충한다
            aria-describedby="special-characters-copied-info"
            onClick={onToggleLastCopiedFavorite}
          >
            <Star className={cn('h-4 w-4 shrink-0', lastCopied && lastCopiedIsFavorite && 'fill-amber-400 text-amber-500')} aria-hidden />
            {lastCopied ? (
              <>
                {/* 긴 이모티콘은 문자 부분만 말줄임 — 「추가/해제」는 항상 보인다 */}
                <span className="min-w-0 truncate whitespace-pre">「{lastCopied.char}」</span>
                <span className="shrink-0">{lastCopiedIsFavorite ? '해제' : '추가'}</span>
              </>
            ) : (
              <span className="truncate">방금 복사한 문자 추가</span>
            )}
          </Button>
        </div>
        {history.favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="favorites-empty">
            문자를 복사한 뒤 위의 ☆ 버튼을 누르면 여기에 추가됩니다.
          </p>
        ) : (
          <div data-testid="favorites-list">
            <CharacterGrid layout="ordered" entries={history.favorites} flashChar={flashChar} onPick={onPick} />
          </div>
        )}
      </section>
    </div>
  )
}
