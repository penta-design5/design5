'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style'
import { Bold, Check, ChevronDown, ChevronsLeft, ChevronsRight, Palette } from 'lucide-react'
import { ParagraphIndent } from '@/lib/tiptap/paragraph-indent'
import {
  isProbablyRichHtml,
  legacyPlainTextToTipTapHtml,
} from '@/lib/design-request-content'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  DESIGN_REQUEST_COLOR_PRESETS,
  designRequestColorMatchesPreset,
} from '@/lib/design-request-editor-preset-colors'

const FONT_SIZE_OPTIONS = [
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
] as const

export interface DesignRequestRichTextEditorProps {
  value: string
  onChange: (html: string) => void
  onBlur: () => void
  disabled?: boolean
  placeholder?: string
  id?: string
  'aria-invalid'?: boolean
}

function normalizeInitialContent(raw: string): string {
  if (!raw.trim()) return ''
  if (isProbablyRichHtml(raw)) return raw
  return legacyPlainTextToTipTapHtml(raw)
}

/** `<input type="color">` 는 #rrggbb 만 허용 */
function toHexForColorInput(c: string | undefined): string {
  if (!c?.trim()) return '#000000'
  const t = c.trim()
  if (/^#[0-9a-f]{6}$/i.test(t)) return `#${t.replace(/^#/i, '').toLowerCase()}`
  const compact = t.replace(/\s/g, '')
  const m = /^rgb\((\d+),(\d+),(\d+)\)$/i.exec(compact)
  if (m) {
    const h = (n: string) =>
      Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, '0')
    return `#${h(m[1])}${h(m[2])}${h(m[3])}`
  }
  return '#000000'
}

export function DesignRequestRichTextEditor({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = '내용을 입력해주세요.',
  id,
  'aria-invalid': ariaInvalid,
}: DesignRequestRichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        codeBlock: false,
        code: false,
        heading: false,
        horizontalRule: false,
        strike: false,
        italic: false,
        underline: false,
        link: false,
      }),
      TextStyle,
      Color,
      FontSize,
      ParagraphIndent,
      Placeholder.configure({ placeholder }),
    ],
    content: normalizeInitialContent(value),
    editable: !disabled,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        'aria-invalid': ariaInvalid ? 'true' : 'false',
        class: cn(
          'min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          '[&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:outline-none',
          '[&_p]:my-1 [&_p]:leading-relaxed [&_strong]:font-semibold',
          ariaInvalid && 'border-destructive ring-destructive'
        ),
      },
      handleDOMEvents: {
        blur: () => {
          onBlur()
          return false
        },
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  useEffect(() => {
    if (!editor) return
    if (editor.view.hasFocus()) return
    const next = normalizeInitialContent(value)
    const current = editor.getHTML()
    if (next === current) return
    editor.commands.setContent(next, { emitUpdate: false })
  }, [value, editor])

  if (!editor) {
    return (
      <div
        className={cn(
          'min-h-[140px] w-full rounded-md border border-input bg-muted/40 animate-pulse',
          ariaInvalid && 'border-destructive'
        )}
        aria-hidden
      />
    )
  }

  const colorAttr = editor.getAttributes('textStyle').color as string | undefined
  const color = toHexForColorInput(colorAttr)

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex min-w-0 flex-nowrap items-center gap-3 rounded-md border border-input bg-muted/30 px-2 py-0.5',
          disabled && 'pointer-events-none opacity-50'
        )}
        role="toolbar"
        aria-label="서식"
      >
        <div
          className="flex shrink-0 items-center gap-1"
          role="group"
          aria-label="글자 색"
        >
          <Palette className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <label className="inline-flex h-7 cursor-pointer items-center shrink-0 rounded px-0.5 hover:bg-muted/80">
            <span className="sr-only">색 직접 선택</span>
            <input
              type="color"
              className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
              value={color}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              disabled={disabled}
              title="색 직접 선택"
            />
          </label>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                className="h-7 gap-1 px-2 text-[11px] font-normal leading-none"
                aria-label="프리셋 색상"
              >
                프리셋
                <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={6}
              className="z-[200] min-w-[8.5rem] p-1"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {DESIGN_REQUEST_COLOR_PRESETS.map((preset) => {
                const active = designRequestColorMatchesPreset(colorAttr, preset.hex)
                return (
                  <DropdownMenuItem
                    key={preset.id}
                    className="cursor-pointer gap-2 py-2"
                    onSelect={() => {
                      editor.chain().focus().setColor(preset.hex).run()
                    }}
                  >
                    <span
                      className={cn(
                        'h-5 w-8 shrink-0 rounded border border-border',
                        preset.id === 'penta-yellow' && 'ring-1 ring-inset ring-black/15'
                      )}
                      style={{ backgroundColor: preset.hex }}
                      aria-hidden
                    />
                    <span className="flex-1 truncate text-xs">{preset.label}</span>
                    {active ? <Check className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden /> : null}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-1 text-[11px] leading-tight"
            onClick={() => editor.chain().focus().unsetColor().run()}
            disabled={disabled}
            title="색 초기화"
          >
            색 초기화
          </Button>
        </div>
        <span className="mx-0 h-5 w-px shrink-0 bg-border" aria-hidden />
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 shrink-0 px-1.5"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-pressed={editor.isActive('bold')}
          title="굵게"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <label className="inline-flex h-7 shrink-0 items-center gap-1 rounded px-0.5 hover:bg-muted/80">
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">크기</span>
          <select
            className={cn(
              'h-6 w-[3.65rem] shrink-0 rounded border border-input bg-background px-1 text-[11px]',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            )}
            aria-label="글자 크기"
            disabled={disabled}
            value={
              (() => {
                const fs = editor.getAttributes('textStyle').fontSize as string | undefined
                if (!fs) return ''
                const known = FONT_SIZE_OPTIONS.some((o) => o.value === fs)
                return known ? fs : ''
              })()
            }
            onChange={(e) => {
              const v = e.target.value
              if (!v) editor.chain().focus().unsetFontSize().run()
              else editor.chain().focus().setFontSize(v).run()
            }}
          >
            <option value="">기본</option>
            {FONT_SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}px
              </option>
            ))}
          </select>
        </label>
        <span className="mx-0 h-5 w-px shrink-0 bg-border" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-1.5"
          onClick={() => editor.chain().focus().increaseParagraphIndent().run()}
          disabled={disabled}
          title="문단 들여쓰기"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-1.5"
          onClick={() => editor.chain().focus().decreaseParagraphIndent().run()}
          disabled={disabled}
          title="문단 내어쓰기"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
