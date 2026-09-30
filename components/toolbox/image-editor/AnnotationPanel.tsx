'use client'

import { ArrowDownToLine, ArrowUpToLine, Copy, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { TEXT_FONT_STACKS } from '@/lib/toolbox/image-editor/annotation-render'
import {
  COLOR_PRESETS,
  TEXT_FONTS,
  TOOL_LABELS,
  type Annotation,
  type DrawStyle,
  type EditorTool,
  type TextBackground,
} from '@/lib/toolbox/image-editor/annotations'

interface AnnotationPanelProps {
  tool: EditorTool
  style: DrawStyle
  selected: Annotation | null
  /** apply=false: 슬라이더 드래그 중(패널 값만 갱신), true: 확정(선택한 개체에도 반영) */
  onStyleChange: (patch: Partial<DrawStyle>, apply: boolean) => void
  onDuplicate: () => void
  onReorder: (direction: 1 | -1) => void
  onDelete: () => void
}

const BACKGROUND_OPTIONS: { value: TextBackground; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'white', label: '흰색' },
  { value: 'black', label: '검정' },
]

/** 그리기 도구·선택한 개체의 스타일 패널 */
export function AnnotationPanel({ tool, style, selected, onStyleChange, onDuplicate, onReorder, onDelete }: AnnotationPanelProps) {
  const kind = selected?.type ?? (tool === 'select' ? null : tool)
  const isText = kind === 'text'
  const isBox = kind === 'rect' || kind === 'ellipse'
  const hasStroke = kind !== null && !isText

  const pressed = 'border-[var(--penta-indigo)] text-[var(--penta-indigo)]'

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">그리기</h3>
        <span className="text-xs text-muted-foreground">
          {selected ? `선택: ${TOOL_LABELS[selected.type]}` : TOOL_LABELS[tool]}
        </span>
      </div>

      {kind === null ? (
        <p className="text-xs text-muted-foreground">
          툴바에서 펜·도형·텍스트 도구를 고르거나, 캔버스의 개체를 클릭해 선택하세요.
        </p>
      ) : (
        <div className="space-y-4 rounded-lg border bg-card p-3">
          <div className="space-y-2">
            <Label>색상</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`색상 ${color}`}
                  aria-pressed={style.color === color}
                  onClick={() => onStyleChange({ color }, true)}
                  className={cn(
                    'h-6 w-6 rounded-full border shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    style.color === color && 'ring-2 ring-[var(--penta-indigo)] ring-offset-1'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                aria-label="색상 직접 선택"
                className="h-6 w-8 cursor-pointer rounded border bg-transparent p-0"
                value={style.color}
                onChange={(e) => onStyleChange({ color: e.target.value }, true)}
              />
            </div>
          </div>

          {hasStroke && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>굵기</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{style.strokeWidth}px</span>
              </div>
              <Slider
                aria-label="굵기"
                value={[style.strokeWidth]}
                min={1}
                max={100}
                step={1}
                onValueChange={([v]) => onStyleChange({ strokeWidth: v }, false)}
                onValueCommit={([v]) => onStyleChange({ strokeWidth: v }, true)}
              />
            </div>
          )}

          {isBox && (
            <div className="flex items-center justify-between">
              <Label>채우기</Label>
              <Switch aria-label="채우기" checked={style.filled} onCheckedChange={(filled) => onStyleChange({ filled }, true)} />
            </div>
          )}

          {isText && (
            <>
              <div className="space-y-2">
                <Label>글꼴</Label>
                <div className="grid grid-cols-4 gap-2">
                  {TEXT_FONTS.map((font) => (
                    <Button
                      key={font.value}
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label={`글꼴 ${font.label}`}
                      aria-pressed={style.textFont === font.value}
                      className={cn('h-8 text-sm', style.textFont === font.value && pressed)}
                      style={{ fontFamily: TEXT_FONT_STACKS[font.value] }}
                      onClick={() => onStyleChange({ textFont: font.value }, true)}
                    >
                      {font.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">PC에 설치된 글꼴을 사용합니다. 글꼴이 없으면 비슷한 글꼴로 표시·저장됩니다.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>글자 크기</Label>
                  <span className="text-xs tabular-nums text-muted-foreground">{Math.round(style.fontSize)}px</span>
                </div>
                <Slider
                  aria-label="글자 크기"
                  value={[style.fontSize]}
                  min={8}
                  max={400}
                  step={1}
                  onValueChange={([v]) => onStyleChange({ fontSize: v }, false)}
                  onValueCommit={([v]) => onStyleChange({ fontSize: v }, true)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>굵게</Label>
                <Switch aria-label="굵게" checked={style.bold} onCheckedChange={(bold) => onStyleChange({ bold }, true)} />
              </div>
              <div className="space-y-2">
                <Label>배경</Label>
                <div className="flex gap-2">
                  {BACKGROUND_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-pressed={style.textBackground === option.value}
                      className={cn('h-8 flex-1', style.textBackground === option.value && pressed)}
                      onClick={() => onStyleChange({ textBackground: option.value }, true)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>불투명도</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{Math.round(style.opacity * 100)}%</span>
            </div>
            <Slider
              aria-label="불투명도"
              value={[style.opacity]}
              min={0.1}
              max={1}
              step={0.05}
              onValueChange={([v]) => onStyleChange({ opacity: v }, false)}
              onValueCommit={([v]) => onStyleChange({ opacity: v }, true)}
            />
          </div>

          {!selected && tool === 'text' && (
            <p className="text-xs text-muted-foreground">캔버스를 클릭해 입력하세요. ⌘/Ctrl+Enter 또는 바깥 클릭으로 확정, Esc 취소.</p>
          )}
          {!selected && (tool === 'line' || tool === 'arrow') && (
            <p className="text-xs text-muted-foreground">Shift를 누른 채 그리면 45° 단위로 맞춰집니다.</p>
          )}
          {!selected && isBox && <p className="text-xs text-muted-foreground">Shift를 누른 채 그리면 정사각형·정원이 됩니다.</p>}
        </div>
      )}

      {selected && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '복제', icon: Copy, onClick: onDuplicate, hint: '⌘/Ctrl+D' },
            { label: '앞으로', icon: ArrowUpToLine, onClick: () => onReorder(1) },
            { label: '뒤로', icon: ArrowDownToLine, onClick: () => onReorder(-1) },
            { label: '삭제', icon: Trash2, onClick: onDelete, hint: 'Delete' },
          ].map(({ label, icon: Icon, onClick, hint }) => (
            <Button
              key={label}
              type="button"
              variant="outline"
              className="h-auto flex-col gap-1 px-1 py-2 text-xs"
              onClick={onClick}
              title={hint}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      )}
    </section>
  )
}
