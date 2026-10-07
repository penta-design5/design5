'use client'

import { Fragment } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MosaicShortcutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const mod = (isMac: boolean) => (isMac ? '⌘' : 'Ctrl')

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium text-foreground shadow-[0_1px_0_rgba(0,0,0,0.08)]">
      {children}
    </kbd>
  )
}

/** 키 조합 한 줄 — 각 조합은 키 배열, 여러 조합은 「또는」으로 잇는다 */
type Combo = string[]

function groups(isMac: boolean): { title: string; items: { label: string; keys: Combo[] }[] }[] {
  const m = mod(isMac)
  return [
    {
      title: '편집',
      items: [
        { label: '되돌리기', keys: [[m, 'Z']] },
        { label: '다시 실행', keys: [[m, 'Shift', 'Z'], ['Ctrl', 'Y']] },
        { label: '선택 영역 삭제', keys: [['Delete'], ['Backspace']] },
        { label: '선택 해제', keys: [['Esc']] },
        { label: '영역 고르기(이전/다음)', keys: [['['], [']']] },
      ],
    },
    {
      title: '영역',
      items: [
        { label: '영역 그리기', keys: [['빈 곳 끌기']] },
        { label: '정사각형·정원으로 그리기', keys: [['Shift', '끌기']] },
        { label: '선택 영역 1px 이동', keys: [['←'], ['→'], ['↑'], ['↓']] },
        { label: '선택 영역 10px 이동', keys: [['Shift', '방향키']] },
      ],
    },
    {
      title: '화면',
      items: [
        { label: '화면 이동', keys: [['Space', '끌기']] },
        { label: '확대/축소', keys: [['휠']] },
        { label: '단축키 도움말', keys: [['?']] },
      ],
    },
  ]
}

/** 단축키 도움말 — 툴바 「단축키」 버튼 또는 `?` 키 */
export function MosaicShortcutDialog({ open, onOpenChange }: MosaicShortcutDialogProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>단축키</DialogTitle>
          <DialogDescription>입력창에 글자를 입력하는 중에는 단축키가 동작하지 않습니다. 터치 기기에서는 두 손가락으로 화면을 옮기고 확대/축소합니다.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {groups(isMac).map((group) => (
            <section key={group.title} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</h3>
              <dl className="space-y-1.5">
                {group.items.map((item) => (
                  <div key={`${group.title}-${item.label}`} className="flex items-center justify-between gap-3 text-sm">
                    <dt className="min-w-[4.5rem] break-keep">{item.label}</dt>
                    <dd className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                      {item.keys.map((combo, i) => (
                        <Fragment key={combo.join('+')}>
                          {i > 0 && <span className="text-xs text-muted-foreground">또는</span>}
                          <span className="inline-flex items-center gap-0.5">
                            {combo.map((k, j) => (
                              <Fragment key={`${k}-${j}`}>
                                {j > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
                                <KeyCap>{k}</KeyCap>
                              </Fragment>
                            ))}
                          </span>
                        </Fragment>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
