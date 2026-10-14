'use client'

import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Copy, Loader2, Search, SlidersHorizontal, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { copyText } from '@/lib/toolbox/special-characters/clipboard'
import { COMPOSE_MAX_LENGTH, graphemeCount, insertAtSelection } from '@/lib/toolbox/special-characters/compose'
import { KAOMOJI_CATEGORIES } from '@/lib/toolbox/special-characters/data/kaomoji'
import { SYMBOL_CATEGORIES } from '@/lib/toolbox/special-characters/data/symbols'
import { queryTokens, SEARCH_LIMIT, searchEntries } from '@/lib/toolbox/special-characters/search'
import { codePointLabel, type CharEntry } from '@/lib/toolbox/special-characters/types'
import { CategoryTabs } from './CategoryTabs'
import { CharacterGrid } from './CharacterGrid'
import { SpecialCharactersSidePanel, type ComposeSelection } from './SpecialCharactersSidePanel'
import { useCharHistory } from './use-char-history'
import { useEmojiCatalog } from './use-emoji-catalog'

type Kind = 'symbols' | 'emoji' | 'kaomoji'
const KINDS: { id: Kind; label: string }[] = [
  { id: 'symbols', label: '특수 문자' },
  { id: 'emoji', label: '이모지' },
  { id: 'kaomoji', label: '텍스트 이모티콘' },
]

const PANEL_ID = 'special-characters-panel'

/** 카테고리 목록을 검색용 평면 목록으로(카테고리 사이 중복 문자는 처음 것만) */
function flattenUnique(categories: { entries: CharEntry[] }[]): CharEntry[] {
  const seen = new Set<string>()
  return categories.flatMap((c) => c.entries).filter((e) => !seen.has(e.char) && !!seen.add(e.char))
}
/** 검색용 특수 문자·텍스트 이모티콘 목록(이모지는 불러온 뒤 합친다) */
const STATIC_SEARCH_ENTRIES: CharEntry[] = [...flattenUnique(SYMBOL_CATEGORIES), ...flattenUnique(KAOMOJI_CATEGORIES)]

/**
 * TOOLBOX「특수 문자 및 이모티콘」 — 브라우저에서만 처리(서버 전송 없음, DB 없음).
 * 레이아웃: 좌측 검색·종류·카테고리·격자 + 우측 410px 패널(xl 이상), xl 미만은 Sheet(모바일 하단 / 태블릿 오른쪽) — 이미지 편집·QR 코드와 동일.
 * 사이드바 메뉴: lib/toolbox/menu.ts의 TOOLBOX_MENU(마지막 Phase에서 등록).
 * 구현 기록: docs/TOOLBOX_special-characters_handoff.md
 */
export function SpecialCharactersPage() {
  const isMobileViewport = useIsMobileViewport()
  const isCompactViewport = useMediaQuery('(max-width: 1279px)')
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheetOpener = useRef<HTMLElement | null>(null)
  const headerButtonRef = useRef<HTMLButtonElement>(null)
  const openSheet = useCallback(() => {
    sheetOpener.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
    setSheetOpen(true)
  }, [])
  const [kind, setKind] = useState<Kind>('symbols')
  const [categoryIds, setCategoryIds] = useState<Record<Kind, string>>({ symbols: SYMBOL_CATEGORIES[0].id, emoji: '', kaomoji: KAOMOJI_CATEGORIES[0].id })
  const [query, setQuery] = useState('')
  const [lastCopied, setLastCopied] = useState<CharEntry | null>(null)
  const [flashChar, setFlashChar] = useState<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout>>()

  // 조합 입력창(D5 B안): 복사와 함께 문자를 이어 붙인다. 최신 값은 ref로도 들고 있어 연속 클릭에도 stale 없이 이어 붙는다.
  const [compose, setCompose] = useState('')
  const composeText = useRef('')
  const composeEl = useRef<HTMLTextAreaElement>(null)
  const composeSel = useRef<ComposeSelection>({ start: 0, end: 0 })
  const { history, recordUse, clearRecent, toggleFav, isFav } = useCharHistory()

  const updateCompose = useCallback((text: string, selection: ComposeSelection) => {
    composeText.current = text
    composeSel.current = selection
    setCompose(text)
  }, [])

  const deferredQuery = useDeferredValue(query)
  const searching = queryTokens(deferredQuery).length > 0
  // 이모지 데이터는 이모지 탭을 열거나 검색할 때 처음 불러온다
  const emoji = useEmojiCatalog(kind === 'emoji' || searching)
  const catalog = emoji.status === 'ready' ? emoji.catalog : null

  const categories = kind === 'symbols' ? SYMBOL_CATEGORIES : kind === 'kaomoji' ? KAOMOJI_CATEGORIES : (catalog?.categories ?? [])
  const category = categories.find((c) => c.id === categoryIds[kind]) ?? categories[0]

  // 이모지는 현재 브라우저가 그리지 못하는 것을 숨긴다(감지 결과는 캐시)
  const visibleEntries = useMemo(
    () => (category ? (kind === 'emoji' && catalog ? category.entries.filter((e) => catalog.isSupported(e.char)) : category.entries) : []),
    [category, kind, catalog]
  )
  const hiddenCount = category ? category.entries.length - visibleEntries.length : 0

  const searchResult = useMemo(() => {
    if (!searching) return null
    const pool = catalog ? [...STATIC_SEARCH_ENTRIES, ...catalog.categories.flatMap((c) => c.entries)] : STATIC_SEARCH_ENTRIES
    return searchEntries(pool, deferredQuery, (e) => !e.emoji || !catalog || catalog.isSupported(e.char))
  }, [searching, deferredQuery, catalog])

  // 클릭 즉시 복사(Safari는 사용자 제스처 안에서 동기 호출이 필요해 await 앞에 다른 작업을 두지 않는다 — copyText를 가장 먼저 호출)
  const pick = useCallback(
    (entry: CharEntry) => {
      const copied = copyText(entry.char)
      // 조합 입력창에는 복사 성공 여부와 무관하게 이어 붙인다(클립보드가 막힌 환경에서도 입력창에서 직접 복사할 수 있다)
      const r = insertAtSelection(composeText.current, composeSel.current.start, composeSel.current.end, { char: entry.char, wide: entry.wide })
      if (r) updateCompose(r.text, { start: r.caret, end: r.caret })
      else toast.error(`조합 입력창은 최대 ${COMPOSE_MAX_LENGTH.toLocaleString()}자까지입니다.`, { id: 'special-characters-compose-full' })
      void copied.then((ok) => {
        if (!ok) {
          toast.error('복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.')
          return
        }
        toast.success(`「${entry.char}」 복사했습니다`, { id: 'special-characters-copy', duration: 1500 })
        setLastCopied(entry)
        recordUse(entry) // 최근 사용은 복사에 성공했을 때만 쌓는다
        setFlashChar(entry.char)
        clearTimeout(flashTimer.current)
        flashTimer.current = setTimeout(() => setFlashChar(null), 1200)
      })
    },
    [recordUse, updateCompose]
  )

  const copyCompose = useCallback(() => {
    const text = composeText.current
    if (text === '') return
    void copyText(text).then((ok) => {
      if (ok) toast.success(`${graphemeCount(text).toLocaleString()}자를 복사했습니다`, { id: 'special-characters-copy', duration: 1500 })
      else toast.error('복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.')
    })
  }, [])

  const clearCompose = useCallback(() => {
    updateCompose('', { start: 0, end: 0 })
    composeEl.current?.focus()
  }, [updateCompose])

  const toggleLastCopiedFavorite = useCallback(() => {
    if (!lastCopied) return
    const action = toggleFav(lastCopied)
    if (action === 'full') toast.error('즐겨찾기는 최대 60개까지 저장할 수 있습니다. 다른 항목을 해제한 뒤 추가해 주세요.', { id: 'special-characters-fav' })
    else toast.success(action === 'added' ? `「${lastCopied.char}」 즐겨찾기에 추가했습니다` : `「${lastCopied.char}」 즐겨찾기에서 해제했습니다`, { id: 'special-characters-fav', duration: 1500 })
  }, [lastCopied, toggleFav])

  // 입력창에 포커스가 없을 때(격자 클릭으로 이어 붙인 직후) 커서를 삽입 지점 뒤로 옮겨 둔다
  useLayoutEffect(() => {
    const el = composeEl.current
    if (el && document.activeElement !== el) el.setSelectionRange(composeSel.current.start, composeSel.current.end)
  }, [compose])

  useEffect(() => () => clearTimeout(flashTimer.current), [])

  useEffect(() => {
    if (!isCompactViewport) setSheetOpen(false)
  }, [isCompactViewport])

  const panelProps = {
    compose,
    composeRef: composeEl,
    composeSelection: composeSel,
    history,
    flashChar,
    lastCopied,
    lastCopiedIsFavorite: lastCopied ? isFav(lastCopied.char) : false,
    onToggleLastCopiedFavorite: toggleLastCopiedFavorite,
    onComposeChange: updateCompose,
    onComposeSelect: (selection: ComposeSelection) => {
      composeSel.current = selection
    },
    onComposeCopy: copyCompose,
    onComposeClear: clearCompose,
    onPick: pick,
    onClearRecent: clearRecent,
  }

  const lastCopiedIsFavorite = panelProps.lastCopiedIsFavorite
  const emojiLoading = (kind === 'emoji' || searching) && emoji.status !== 'ready' && emoji.status !== 'error'
  const showAttribution = catalog !== null && (kind === 'emoji' || searching)

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50">
      <div className="flex-1 min-w-0 pr-0 xl:pr-[410px]">
        {/* 칸이 많은 카테고리에서 자식이 줄어들어 격자가 패널 밖으로 넘치지 않도록 자식은 줄이지 않고(shrink-0) 이 영역이 스크롤한다.
            scroll-pb-24: 아래 고정 안내줄에 가려지지 않도록 키보드 포커스 이동 시 스크롤 여백을 둔다 */}
        <div className="flex h-full scroll-pb-24 flex-col gap-4 overflow-y-auto px-4 pt-16 pb-8 sm:px-8 [&>*]:shrink-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="page-header-title">특수 문자 및 이모티콘</h1>
              <p className="text-muted-foreground mt-2">
                문자를 클릭하면 클립보드에 복사됩니다. 사용 기록은 이 브라우저에만 저장됩니다.
              </p>
            </div>
            <div className="flex shrink-0 gap-2 xl:hidden">
              <Button ref={headerButtonRef} type="button" variant="outline" onClick={openSheet}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                조합·최근 사용
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setQuery('')
              }}
              placeholder="이름으로 검색 (예: 하트, 화살표, heart, 대한민국)"
              aria-label="문자·이모지 검색"
              autoComplete="off"
              spellCheck={false}
              className="bg-background pl-9 pr-10"
            />
            {query !== '' && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!searching && (
            <div className="space-y-2">
              <CategoryTabs
                tabs={KINDS}
                activeId={kind}
                label="종류"
                idPrefix="special-characters-kind"
                panelId={PANEL_ID}
                onChange={(id) => setKind(id as Kind)}
              />
              {categories.length > 0 && (
                <CategoryTabs
                  tabs={categories}
                  activeId={category.id}
                  label="카테고리"
                  idPrefix="special-characters"
                  panelId={PANEL_ID}
                  onChange={(id) => setCategoryIds((prev) => ({ ...prev, [kind]: id }))}
                />
              )}
            </div>
          )}

          <div
            role={searching ? 'region' : 'tabpanel'}
            id={PANEL_ID}
            aria-label={searching ? '검색 결과' : undefined}
            aria-labelledby={searching || !category ? undefined : `special-characters-tab-${category.id}`}
            className="min-h-[320px] grow rounded-lg border bg-card p-3 sm:p-4"
          >
            {searching ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground" aria-live="polite" data-testid="search-status">
                  {searchResult && searchResult.total > 0
                    ? `검색 결과 ${searchResult.total.toLocaleString()}개${searchResult.total > SEARCH_LIMIT ? ` — 처음 ${SEARCH_LIMIT}개만 표시합니다. 검색어를 더 구체적으로 입력해 보세요.` : ''}`
                    : emojiLoading
                      ? '이모지를 불러오는 중…'
                      : `「${deferredQuery.trim()}」에 해당하는 문자가 없습니다.`}
                  {searchResult && searchResult.total > 0 && emojiLoading ? ' (이모지를 불러오는 중…)' : ''}
                </p>
                {searchResult && searchResult.entries.length > 0 && (
                  <CharacterGrid entries={searchResult.entries} flashChar={flashChar} onPick={pick} />
                )}
              </div>
            ) : emojiLoading ? (
              <div className="flex h-full min-h-[240px] items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" />
                이모지를 불러오는 중…
              </div>
            ) : emoji.status === 'error' && kind === 'emoji' ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-sm" role="alert">
                <p className="text-destructive">이모지를 불러오지 못했습니다.</p>
                <Button type="button" variant="outline" size="sm" onClick={emoji.retry}>
                  다시 시도
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <CharacterGrid entries={visibleEntries} flashChar={flashChar} onPick={pick} />
                {hiddenCount > 0 && (
                  <p className="text-xs text-muted-foreground" data-testid="hidden-note">
                    이 브라우저·운영체제에서 표시할 수 없는 이모지 {hiddenCount}개는 숨겼습니다.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 화면 아래에 고정(sticky) — 칸이 많은 카테고리를 스크롤해도 방금 복사한 문자와 ☆ 버튼이 항상 보인다.
              -bottom-8: sticky 기준선은 스크롤 영역의 아래 패딩(pb-8)만큼 올라가므로 상쇄해야 화면 가장자리에 딱 붙는다 */}
          <div
            data-testid="copied-bar"
            className="sticky -bottom-8 z-10 -mx-4 flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 border-t bg-neutral-50/95 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm sm:-mx-8 sm:px-8"
          >
            <p id="special-characters-copied-info" aria-live="polite" data-testid="copied-info" className="min-w-0 break-all">
              {lastCopied
                ? // 텍스트 이모티콘은 코드포인트가 길어 이름만 표시한다
                  `복사됨: ${lastCopied.char} ${lastCopied.name}${lastCopied.wide ? '' : ` (${codePointLabel(lastCopied.char)})`}`
                : '문자를 클릭하면 바로 복사됩니다.'}
            </p>
            {lastCopied && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-2.5 [@media(pointer:coarse)]:h-10"
                data-testid="fav-toggle-bar"
                data-favorite={lastCopiedIsFavorite}
                aria-describedby="special-characters-copied-info"

                onClick={toggleLastCopiedFavorite}
              >
                <Star className={cn('h-4 w-4', lastCopiedIsFavorite && 'fill-amber-400 text-amber-500')} aria-hidden />
                {lastCopiedIsFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              </Button>
            )}
            {/* 1280px 미만: 조합 입력창이 Sheet 안에 있어 안 보이므로, 이어 붙은 내용을 한 줄 요약으로 보여 주고 바로 복사할 수 있게 한다(누르면 Sheet가 열려 전체를 편집) */}
            {isCompactViewport && compose !== '' && (
              <div className="flex min-w-[240px] flex-1 items-center gap-2" data-testid="compose-summary">
                <button
                  type="button"
                  onClick={openSheet}
                  className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-md border bg-background px-3 text-left text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">조합 {graphemeCount(compose)}자</span>
                  <span className="min-w-0 flex-1 truncate whitespace-nowrap" data-testid="compose-summary-text">
                    {compose.replace(/\s*\n\s*/g, ' ↵ ')}
                  </span>
                  <span className="sr-only">— 눌러서 조합 입력창 편집</span>
                </button>
                <Button type="button" size="sm" className="h-10 shrink-0 px-3" onClick={copyCompose}>
                  <Copy className="mr-1.5 h-4 w-4" aria-hidden />
                  복사
                </Button>
              </div>
            )}
          </div>

          {showAttribution && (
            <p className="text-xs text-muted-foreground" data-testid="attribution">
              이모지 데이터: Emojibase(MIT). 국기 그림(일부 환경에서만 사용): Twemoji © Twitter, Inc. 및 기여자,{' '}
              <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
                CC BY 4.0
              </a>
              {' '}— Twemoji Country Flags 글꼴(TalkJS)에서 국기 글리프만 추출.
            </p>
          )}
        </div>
      </div>

      {/* 1280px 미만에서는 패널을 렌더하지 않는다(숨겨진 중복 입력창이 DOM에 남지 않도록) */}
      {!isCompactViewport && (
        <div className="fixed right-0 top-0 bottom-0">
          <SpecialCharactersSidePanel {...panelProps} />
        </div>
      )}

      <Sheet open={Boolean(isCompactViewport && sheetOpen)} onOpenChange={setSheetOpen}>
        <SheetContent
          // 닫으면 열었던 버튼으로 포커스를 돌려준다(열기 직전 포커스 요소가 사라졌으면 헤더 버튼으로)
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            const opener = sheetOpener.current
            ;(opener?.isConnected ? opener : headerButtonRef.current)?.focus()
          }}
          side={isMobileViewport ? 'bottom' : 'right'}
          className={isMobileViewport ? 'h-[70vh] overflow-y-auto p-0' : 'w-[410px] max-w-[90vw] overflow-y-auto p-0 sm:max-w-[410px]'}
        >
          <SheetTitle className="sr-only">조합·최근 사용</SheetTitle>
          <SpecialCharactersSidePanel variant="sheet" {...panelProps} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
