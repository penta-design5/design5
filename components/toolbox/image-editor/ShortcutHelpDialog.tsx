'use client'

import { Fragment } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SHORTCUT_GROUPS } from '@/lib/toolbox/image-editor/shortcuts'

interface ShortcutHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium text-foreground shadow-[0_1px_0_rgba(0,0,0,0.08)]">
      {children}
    </kbd>
  )
}

/** 단축키 도움말 — 툴바 「단축키」 버튼 또는 `?` 키 */
export function ShortcutHelpDialog({ open, onOpenChange }: ShortcutHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>단축키</DialogTitle>
          <DialogDescription>입력창에 글자를 입력하는 중에는 단축키가 동작하지 않습니다.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
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
                          {combo.map((key, j) => (
                            <Fragment key={key}>
                              {j > 0 && combo.length > 1 && !combo.every((k) => k.length === 1 && /[←↑→↓]/.test(k)) && (
                                <span className="text-xs text-muted-foreground">+</span>
                              )}
                              <KeyCap>{key}</KeyCap>
                            </Fragment>
                          ))}
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
