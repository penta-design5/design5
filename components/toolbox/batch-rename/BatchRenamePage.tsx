'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { formatFileSize } from '@/lib/design-request-attachments'
import { downloadBlob } from '@/lib/toolbox/common/export'
import { clipboardHasText, filesFromClipboard, nameClipboardFiles } from '@/lib/toolbox/batch-rename/capture-name'
import { filesFromDataTransfer } from '@/lib/toolbox/batch-rename/drop'
import { addFiles, addResultMessage, LIMIT_LABEL, moveItem, removeItem, sortByOriginalName, summaryLabel } from '@/lib/toolbox/batch-rename/list'
import { buildNewName, buildNewNames, DEFAULT_DIGITS, DEFAULT_START, firstOverflowNumber, parseRule, sanitizeBaseName, zipFileName } from '@/lib/toolbox/batch-rename/name'
import { createProgressReporter, createRenameZip, findUnreadableFile, ZIP_GENERATE_OPTIONS } from '@/lib/toolbox/batch-rename/zip'
import type { RenameItem } from '@/lib/toolbox/batch-rename/types'
import { FileDropZone } from './FileDropZone'
import { RenameSidePanel, SaveProgress } from './RenameSidePanel'
import { RenameTable } from './RenameTable'
import { RenameToolbar } from './RenameToolbar'
import { RuleFields, type RuleInputs } from './RuleFields'
import { RulePreview } from './RulePreview'

interface StatusMessage {
  text: string
  warning: boolean
}

/**
 * TOOLBOX「파일명 일괄 변경」 — 브라우저에서만 처리(파일 서버 전송·저장 없음, DB 없음).
 * 레이아웃: 좌측 작업 영역(파일 목록) + 우측 410px 이름 규칙 패널(xl 이상).
 * xl 미만은 이름 규칙·바뀔 이름을 본문 위 카드로, 저장을 헤더 「ZIP 저장」 버튼으로 옮긴다 — 규칙이 세 칸뿐이라 Sheet에 숨기지 않는다.
 * 768px 미만은 표 대신 카드형 목록.
 * 사이드바 메뉴: lib/toolbox/menu.ts의 TOOLBOX_MENU.
 * 구현 기록: docs/TOOLBOX_batch-rename_handoff.md
 */
export function BatchRenamePage() {
  const isCompactViewport = useMediaQuery('(max-width: 1279px)')
  const isNarrowViewport = useMediaQuery('(max-width: 767px)')
  const { confirm } = useConfirmDialog()
  const [items, setItems] = useState<RenameItem[]>([])
  // 콜백을 고정해 행(memo)이 매번 다시 그려지지 않도록 최신 목록은 ref로 읽는다
  const itemsRef = useRef(items)
  itemsRef.current = items
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const dragDepth = useRef(0)
  const nextId = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [ruleInputs, setRuleInputs] = useState<RuleInputs>({
    baseName: '',
    startText: String(DEFAULT_START),
    digitsText: String(DEFAULT_DIGITS),
  })
  // ZIP 만드는 중이면 진행률(0~100), 아니면 null
  const [progress, setProgress] = useState<number | null>(null)
  const saving = progress !== null
  // 삭제·이동 후 포커스를 옮길 버튼 선택자(목록이 다시 그려진 뒤 처리)
  const focusAfterChange = useRef<string | null>(null)

  const createId = useCallback(() => `f${++nextId.current}`, [])

  const add = useCallback(
    (files: File[], folders = 0) => {
      if (files.length === 0 && folders === 0) return
      const result = addFiles(itemsRef.current, files, createId)
      const message = addResultMessage(result, folders)
      setItems(result.items)
      setStatus(message)
      // 건너뛴 파일·폴더가 있으면 하단 상태 줄은 목록이 길 때 눈에 띄지 않으므로 토스트로도 알린다
      if (message.warning) toast.warning(message.text)
    },
    [createId]
  )

  const browse = () => fileInputRef.current?.click()

  // 붙여넣은 캡처 이미지에 이름(캡처_YYYYMMDD_HHmmss.png)을 붙여 추가한다
  const addPasted = useCallback(
    (files: File[]) => add(nameClipboardFiles(files, itemsRef.current.map((item) => item.originalName), new Date())),
    [add]
  )

  // 「캡처 붙여넣기」 버튼 — Clipboard API로 이미지를 읽는다. 클릭 핸들러 안에서 바로 호출해야 한다(Safari 사용자 제스처 요건).
  // Clipboard API는 브라우저 보안상 복사한 파일을 읽을 수 없다 → 파인더·탐색기에서 복사한 파일은 Ctrl/⌘ + V(paste 이벤트)로만 받는다
  const pasteFromClipboard = useCallback(async () => {
    if (!navigator.clipboard?.read) {
      toast.info('이 브라우저에서는 캡처 붙여넣기 버튼을 쓸 수 없습니다. Ctrl/⌘ + V로 붙여넣어 주세요.')
      return
    }
    try {
      const clipboardItems = await navigator.clipboard.read()
      const files: File[] = []
      for (const item of clipboardItems) {
        const type = item.types.find((t) => t.startsWith('image/'))
        if (type) files.push(new File([await item.getType(type)], '', { type }))
      }
      if (files.length === 0) {
        toast.info('클립보드에 캡처 이미지가 없습니다. 파인더나 탐색기에서 복사한 파일은 이 버튼으로 붙여넣을 수 없으니 Ctrl/⌘ + V를 눌러 주세요.')
        return
      }
      addPasted(files)
    } catch {
      toast.warning('클립보드를 읽지 못했습니다. 브라우저의 클립보드 권한을 확인하거나 Ctrl/⌘ + V로 붙여넣어 주세요.')
    }
  }, [addPasted])

  // 행을 지우면 같은 자리(마지막 행이면 위) 행의 삭제 버튼으로, 목록이 비면 업로드 영역으로 포커스를 옮긴다
  const remove = useCallback((id: string) => {
    const prev = itemsRef.current
    const index = prev.findIndex((item) => item.id === id)
    focusAfterChange.current =
      prev.length > 1 ? `[data-remove-index="${Math.min(index, prev.length - 2)}"]` : '[data-drop-zone]'
    setItems(removeItem(prev, id))
    setStatus(null)
  }, [])

  // 옮긴 행의 같은 방향 버튼에 포커스를 유지한다(끝에 닿아 비활성이면 반대 방향 버튼)
  const move = useCallback((id: string, delta: -1 | 1) => {
    const prev = itemsRef.current
    const index = prev.findIndex((item) => item.id === id)
    const to = index + delta
    if (index < 0 || to < 0 || to >= prev.length) return
    const atEdge = delta === -1 ? to === 0 : to === prev.length - 1
    const dir = (delta === -1) !== atEdge ? 'up' : 'down'
    focusAfterChange.current = `[data-move-${dir}-index="${to}"]`
    setItems(moveItem(prev, index, delta))
    setStatus(null)
  }, [])

  const sortByName = useCallback(() => {
    setItems(sortByOriginalName(itemsRef.current))
    setStatus({ text: '원본 이름순으로 정렬했습니다. ↑↓로 다시 조정할 수 있습니다.', warning: false })
  }, [])

  const clearAll = useCallback(async () => {
    if (items.length === 0) return
    if (!(await confirm(`목록의 파일 ${items.length.toLocaleString('ko-KR')}개를 모두 지울까요?`, { confirmText: '전체 삭제', variant: 'destructive' }))) {
      return
    }
    setItems([])
    setStatus({ text: '목록을 비웠습니다.', warning: false })
  }, [items.length, confirm])

  useEffect(() => {
    const selector = focusAfterChange.current
    if (!selector) return
    focusAfterChange.current = null
    document.querySelector<HTMLElement>(selector)?.focus()
  }, [items])

  // 끌어다 놓기 — 작업 영역 전체가 대상. preventDefault로 브라우저가 파일을 새 탭에서 여는 기본 동작 차단
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
      if (saving) return // ZIP 만드는 중에는 목록을 바꾸지 않는다
      const { files, folders } = filesFromDataTransfer(e.dataTransfer)
      add(files, folders)
    },
  }

  const summary = useMemo(() => summaryLabel(items), [items])

  // Ctrl/⌘ + V — 클립보드에 파일(캡처 이미지·복사한 파일)이 있으면 목록에 추가한다.
  // 입력칸에서 글자를 붙여넣는 경우는 가로채지 않는다(글자 없이 파일만 있으면 입력칸에서도 추가).
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (saving || document.querySelector('[role="alertdialog"]')) return
      const files = filesFromClipboard(e.clipboardData)
      if (files.length === 0) return
      const target = e.target as HTMLElement | null
      const editable = target?.closest('input, textarea, [contenteditable="true"]')
      if (editable && clipboardHasText(e.clipboardData)) return
      e.preventDefault()
      addPasted(files)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [addPasted, saving])

  // 이름 규칙 → 새 이름. 2,000행에서도 입력이 끊기지 않도록 지연된 값으로 계산한다
  const changeRuleInputs = useCallback((patch: Partial<RuleInputs>) => setRuleInputs((prev) => ({ ...prev, ...patch })), [])
  const deferredInputs = useDeferredValue(ruleInputs)
  const parsedRule = useMemo(() => parseRule(ruleInputs.baseName, ruleInputs.startText, ruleInputs.digitsText), [ruleInputs])
  const sanitized = useMemo(() => sanitizeBaseName(ruleInputs.baseName), [ruleInputs.baseName])
  const deferredRule = useMemo(
    () => parseRule(deferredInputs.baseName, deferredInputs.startText, deferredInputs.digitsText),
    [deferredInputs]
  )
  const newNames = useMemo(
    () => (deferredRule.ok ? buildNewNames(items.map((item) => item.originalName), deferredRule.rule) : null),
    [items, deferredRule]
  )
  const example = useMemo(() => {
    if (!parsedRule.ok || items.length === 0) return null
    const lastIndex = items.length - 1
    return {
      first: buildNewName(items[0].originalName, 0, parsedRule.rule),
      last: lastIndex > 0 ? buildNewName(items[lastIndex].originalName, lastIndex, parsedRule.rule) : null,
    }
  }, [items, parsedRule])
  const overflowFrom = parsedRule.ok ? firstOverflowNumber(items.length, parsedRule.rule) : null
  const zipName = zipFileName(ruleInputs.baseName)
  const canSave = parsedRule.ok && items.length > 0 && !saving

  const save = useCallback(async () => {
    if (!parsedRule.ok || saving) return
    const list = itemsRef.current
    if (list.length === 0) return
    // 지연값(표)이 아닌 현재 규칙으로 이름을 만든다
    const names = buildNewNames(list.map((item) => item.originalName), parsedRule.rule)
    const zip = createRenameZip(list.map((item, i) => ({ name: names[i], data: item.file, lastModified: item.file.lastModified })))
    setProgress(0)
    setStatus(null)
    try {
      const blob = await zip.generateAsync({ ...ZIP_GENERATE_OPTIONS, type: 'blob' }, createProgressReporter(setProgress))
      downloadBlob(blob, zipName)
      setStatus({
        text: `${list.length.toLocaleString('ko-KR')}개 파일을 새 이름으로 묶어 ${zipName}(${formatFileSize(blob.size)})로 내려받았습니다.`,
        warning: false,
      })
    } catch {
      const unreadable = await findUnreadableFile(list)
      const text = unreadable
        ? `「${unreadable.originalName}」 파일을 읽을 수 없습니다. 원본 파일이 옮겨졌거나 삭제되었는지 확인하고, 목록에서 지운 뒤 다시 추가해 주세요.`
        : 'ZIP을 만들지 못했습니다. 파일 수나 용량을 줄여 다시 시도해 주세요.'
      toast.error(text)
      setStatus({ text, warning: true })
    } finally {
      setProgress(null)
    }
  }, [parsedRule, saving, zipName])

  const ruleProps = {
    inputs: ruleInputs,
    errors: parsedRule.ok ? {} : parsedRule.errors,
    sanitized,
    onInputsChange: changeRuleInputs,
  }
  const previewProps = { example, hasErrors: !parsedRule.ok, overflowFrom }

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50">
      <div className="flex-1 min-w-0 pr-0 xl:pr-[410px]">
        <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 pt-16 pb-8 sm:px-8">
          {/* 1280px 미만 헤더 저장 버튼은 아래쪽을 안내 문구 아래쪽에 맞춘다 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="page-header-title">파일명 일괄 변경</h1>
              <p className="text-muted-foreground mt-2">
                여러 파일 이름을 공통 이름과 순번으로 한 번에 바꾸고 ZIP으로 내려받으세요. 파일은 서버로 전송되지 않습니다.
              </p>
            </div>
            {isCompactViewport && (
              // ZIP 파일명은 툴팁으로 보여 준다. 비활성 버튼은 포인터 이벤트가 없어 span이 트리거를 맡는다
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0">
                    <Button type="button" className="w-full [@media(pointer:coarse)]:h-11" onClick={save} disabled={!canSave}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {saving ? `ZIP 만드는 중… ${progress}%` : '새 이름으로 ZIP 저장'}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>파일명 {zipName}</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* 1280px 미만: 이름 규칙·바뀔 이름을 목록 위에 둔다(우측 패널 대신) */}
          {isCompactViewport && (
            <section aria-labelledby="batch-rename-rule-title" className="space-y-3 rounded-lg border bg-card p-4">
              <h2 id="batch-rename-rule-title" className="text-sm font-semibold">
                이름 규칙
              </h2>
              <RuleFields idPrefix="main" layout="inline" disabled={saving} {...ruleProps} />
              <div className="space-y-1 border-t pt-3" aria-live="polite">
                <RulePreview {...previewProps} />
              </div>
              {progress !== null && <SaveProgress progress={progress} />}
            </section>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              add(Array.from(e.target.files ?? []))
              e.target.value = '' // 같은 파일을 다시 고를 수 있도록
            }}
          />

          <div className="relative flex min-h-[320px] flex-1 flex-col" {...dropHandlers}>
            {items.length === 0 ? (
              <FileDropZone dragActive={dragActive} onBrowse={browse} onPaste={pasteFromClipboard} className="flex-1" />
            ) : (
              // ZIP 만드는 중에는 목록 편집(추가·삭제·이동·정렬)을 잠근다
              <fieldset disabled={saving} aria-busy={saving} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
                <RenameToolbar summary={summary} limitLabel={LIMIT_LABEL} addButtonRef={addButtonRef} onBrowse={browse} onPaste={pasteFromClipboard} onClearAll={clearAll} onSortByName={sortByName} />
                <div ref={listRef} className="min-h-0 flex-1 overflow-auto" role="region" aria-label="파일 목록" tabIndex={0}>
                  <RenameTable items={items} newNames={newNames} compact={isNarrowViewport} onMove={move} onRemove={remove} />
                </div>
                {dragActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--penta-indigo)] bg-[rgb(var(--penta-indigo-rgb)/0.1)] text-sm font-medium">
                    여기에 놓으면 목록 뒤에 추가됩니다
                  </div>
                )}
              </fieldset>
            )}
          </div>

          <p className={cn('min-h-5 text-sm', status?.warning ? 'text-amber-700' : 'text-muted-foreground')} role="status" aria-live="polite">
            {status?.text}
          </p>
        </div>
      </div>

      {/* 1280px 미만에서는 패널을 렌더하지 않는다(숨겨진 중복 입력칸이 DOM에 남지 않도록) */}
      {!isCompactViewport && (
        <div className="fixed right-0 top-0 bottom-0">
          <RenameSidePanel {...ruleProps} {...previewProps} zipName={zipName} canSave={canSave} progress={progress} onSave={save} />
        </div>
      )}
    </div>
  )
}
