'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Trash2 } from 'lucide-react'
import type { DesktopElement, CalendarThemeKey } from '@/lib/desktop-schemas'
import { CALENDAR_COLOR_PRESETS, calendarBgToHex, calendarBgToOpacity } from '@/lib/desktop-schemas'

interface DesktopPropertyPanelProps {
  element: DesktopElement | null
  onUpdate: (updates: Partial<DesktopElement>) => void
  onDelete: () => void
}

const defaultCalendarStyle = () => ({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  fontSize: 14,
  color: '#333333',
  backgroundColor: '#ffffff',
  backgroundOpacity: 0.9,
  theme: 'classic' as CalendarThemeKey,
  sundayColor: '#ec5851',
  holidayColor: '#ec5851',
  saturdayColor: '#8196f7',
  todayCircleColor: '#8196f7',
})

const CALENDAR_THEME_LABELS: Record<CalendarThemeKey, string> = {
  classic: '클래식',
  pastel: '파스텔',
  dark: '다크',
  ocean: '오션',
  forest: '포레스트',
}

export function DesktopPropertyPanel({
  element,
  onUpdate,
  onDelete,
}: DesktopPropertyPanelProps) {
  if (!element) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">미리보기에서 요소를 선택하면 속성을 편집할 수 있습니다.</p>
      </div>
    )
  }

  if (element.type === 'title' || element.type === 'description') {
    const style = (element.textStyle || {}) as { fontFamily?: string; fontSize?: number; color?: string; fontWeight?: string }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{element.type === 'title' ? '제목' : '설명'}</span>
          <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <Label>내용</Label>
          {element.type === 'description' ? (
            <Textarea
              value={element.value || ''}
              onChange={(e) => onUpdate({ value: e.target.value })}
              placeholder="설명을 입력하세요"
              rows={4}
            />
          ) : (
            <Input
              value={element.value || ''}
              onChange={(e) => onUpdate({ value: e.target.value })}
              placeholder="제목을 입력하세요"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label>너비 (px)</Label>
          <Input
            type="number"
            min={60}
            max={2000}
            value={element.width ?? 400}
            onChange={(e) =>
              onUpdate({ width: Math.max(60, Math.min(2000, Number(e.target.value) || 400)) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>글자 크기</Label>
          <Input
            type="number"
            min={8}
            max={120}
            value={style.fontSize || 24}
            onChange={(e) =>
              onUpdate({
                textStyle: {
                  fontFamily: style.fontFamily || 'Pretendard, sans-serif',
                  fontSize: Math.max(8, Math.min(120, Number(e.target.value) || 24)),
                  color: style.color || '#333333',
                  fontWeight: (style.fontWeight || 'normal') as 'normal' | 'medium' | 'semibold' | 'bold',
                },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>글자 색상</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <span
                  className="w-4 h-4 rounded border mr-2"
                  style={{ backgroundColor: style.color || '#333' }}
                />
                {style.color || '#333333'}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <HexColorPicker
                color={style.color || '#333333'}
                onChange={(c) => onUpdate({
                textStyle: {
                  fontFamily: style.fontFamily || 'Pretendard, sans-serif',
                  fontSize: style.fontSize || 24,
                  color: c,
                  fontWeight: (style.fontWeight || 'normal') as 'normal' | 'medium' | 'semibold' | 'bold',
                },
              })}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>폰트 두께</Label>
          <Select
            value={style.fontWeight || 'normal'}
            onValueChange={(v: 'normal' | 'medium' | 'semibold' | 'bold') =>
              onUpdate({
                textStyle: {
                  fontFamily: style.fontFamily || 'Pretendard, sans-serif',
                  fontSize: style.fontSize || 24,
                  color: style.color || '#333333',
                  fontWeight: v,
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">보통</SelectItem>
              <SelectItem value="medium">중간</SelectItem>
              <SelectItem value="semibold">세미볼드</SelectItem>
              <SelectItem value="bold">볼드</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  if (element.type === 'calendar') {
    const style = (element.calendarStyle || {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      fontSize: 14,
      color: '#333',
      backgroundColor: '#ffffff',
      backgroundOpacity: 0.9,
      theme: 'classic' as CalendarThemeKey,
    }) as { year: number; month: number; fontSize?: number; color?: string; backgroundColor?: string; backgroundOpacity?: number; theme?: CalendarThemeKey; sundayColor?: string; holidayColor?: string; saturdayColor?: string; todayCircleColor?: string }
    const themeKeys = Object.keys(CALENDAR_COLOR_PRESETS) as CalendarThemeKey[]
    const rawTheme = style.theme as string | undefined
    const themeValue: CalendarThemeKey = (rawTheme === 'default' ? 'classic' : rawTheme === 'minimal' ? 'pastel' : (rawTheme as CalendarThemeKey)) || 'classic'
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">속성</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">캘린더</span>
          <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>연도</Label>
            <Input
              type="number"
              min={2000}
              max={2100}
              value={style.year}
              onChange={(e) =>
                onUpdate({
                  calendarStyle: { ...defaultCalendarStyle(), ...style, year: Math.max(2000, Math.min(2100, Number(e.target.value) || style.year)) },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>월</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={style.month}
              onChange={(e) =>
                onUpdate({
                  calendarStyle: { ...defaultCalendarStyle(), ...style, month: Math.max(1, Math.min(12, Number(e.target.value) || style.month)) },
                })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>글자 크기</Label>
          <Input
            type="number"
            min={8}
            max={48}
            value={style.fontSize || 14}
            onChange={(e) =>
              onUpdate({
                calendarStyle: { ...defaultCalendarStyle(), ...style, fontSize: Math.max(8, Math.min(48, Number(e.target.value) || 14)) },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>글자 색상</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <span
                  className="w-4 h-4 rounded border mr-2"
                  style={{ backgroundColor: style.color || '#333' }}
                />
                {style.color || '#333333'}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <HexColorPicker
                color={style.color || '#333333'}
                onChange={(c) => onUpdate({ calendarStyle: { ...defaultCalendarStyle(), ...style, color: c } })}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">요일 / 오늘 색상</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">일요일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <span className="w-3 h-3 rounded border mr-1.5" style={{ backgroundColor: style.sundayColor || '#ec5851' }} />
                    {style.sundayColor || '#ec5851'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <HexColorPicker
                    color={style.sundayColor || '#ec5851'}
                    onChange={(c) => onUpdate({ calendarStyle: { ...defaultCalendarStyle(), ...style, sundayColor: c } })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">공휴일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <span className="w-3 h-3 rounded border mr-1.5" style={{ backgroundColor: style.holidayColor || '#ec5851' }} />
                    {style.holidayColor || '#ec5851'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <HexColorPicker
                    color={style.holidayColor || '#ec5851'}
                    onChange={(c) => onUpdate({ calendarStyle: { ...defaultCalendarStyle(), ...style, holidayColor: c } })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">토요일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <span className="w-3 h-3 rounded border mr-1.5" style={{ backgroundColor: style.saturdayColor || '#8196f7' }} />
                    {style.saturdayColor || '#8196f7'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <HexColorPicker
                    color={style.saturdayColor || '#8196f7'}
                    onChange={(c) => onUpdate({ calendarStyle: { ...defaultCalendarStyle(), ...style, saturdayColor: c } })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">오늘 날짜 원</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <span className="w-3 h-3 rounded border mr-1.5" style={{ backgroundColor: style.todayCircleColor || '#8196f7' }} />
                    {style.todayCircleColor || '#8196f7'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <HexColorPicker
                    color={style.todayCircleColor || '#8196f7'}
                    onChange={(c) => onUpdate({ calendarStyle: { ...defaultCalendarStyle(), ...style, todayCircleColor: c } })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>배경 색상</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <span
                  className="w-4 h-4 rounded border mr-2"
                  style={{ backgroundColor: calendarBgToHex(style.backgroundColor || '#ffffff') }}
                />
                {calendarBgToHex(style.backgroundColor || '#ffffff')}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <HexColorPicker
                color={calendarBgToHex(style.backgroundColor || '#ffffff')}
                onChange={(c) =>
                  onUpdate({
                    calendarStyle: {
                      ...defaultCalendarStyle(),
                      ...style,
                      backgroundColor: c,
                      backgroundOpacity: style.backgroundOpacity ?? calendarBgToOpacity(style.backgroundColor || '', 0.9),
                    },
                  })
                }
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>배경 투명도</Label>
          <div className="flex items-center gap-3">
            <Slider
              className="flex-1"
              min={0}
              max={100}
              step={1}
              value={[Math.round((style.backgroundOpacity ?? calendarBgToOpacity(style.backgroundColor || '', 0.9)) * 100)]}
              onValueChange={([v]) =>
                onUpdate({
                  calendarStyle: {
                    ...defaultCalendarStyle(),
                    ...style,
                    backgroundColor: calendarBgToHex(style.backgroundColor || '#ffffff'),
                    backgroundOpacity: v / 100,
                  },
                })
              }
            />
            <span className="text-sm text-muted-foreground w-10">
              {Math.round((style.backgroundOpacity ?? calendarBgToOpacity(style.backgroundColor || '', 0.9)) * 100)}%
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Label>테마 (색상 프리셋)</Label>
          <Select
            value={themeValue}
            onValueChange={(v: CalendarThemeKey) =>
              onUpdate({
                calendarStyle: {
                  ...defaultCalendarStyle(),
                  ...style,
                  ...CALENDAR_COLOR_PRESETS[v],
                  theme: v,
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themeKeys.map((t) => (
                <SelectItem key={t} value={t}>
                  {CALENDAR_THEME_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  return null
}
