'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export interface SearchCategoryOption {
  slug: string
  name: string
}

interface SearchFilterDropdownProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchQuery: string
  onSearch: (params: {
    q: string
    categorySlug?: string
    dateFrom?: string
    dateTo?: string
  }) => void
  categoryOptions: SearchCategoryOption[]
  trigger?: React.ReactNode
}

export function SearchFilterDropdown({
  open,
  onOpenChange,
  searchQuery,
  onSearch,
  categoryOptions,
  trigger,
}: SearchFilterDropdownProps) {
  const [categorySlug, setCategorySlug] = useState<string>('__all__')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  const handleSearch = () => {
    onSearch({
      q: searchQuery.trim(),
      categorySlug: categorySlug && categorySlug !== '__all__' ? categorySlug : undefined,
      dateFrom: dateFrom?.toISOString().split('T')[0],
      dateTo: dateTo?.toISOString().split('T')[0],
    })
    onOpenChange(false)
  }

  const canSearch =
    searchQuery.trim().length > 0 ||
    (categorySlug && categorySlug !== '__all__') ||
    dateFrom !== undefined ||
    dateTo !== undefined

  const handleReset = () => {
    setCategorySlug('__all__')
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="icon" aria-label="상세 검색 조건">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>카테고리</Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">전체</SelectItem>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.slug} value={opt.slug}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>생성일 (시작)</Label>
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="시작일 선택"
            />
          </div>
          <div className="space-y-2">
            <Label>생성일 (종료)</Label>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder="종료일 선택"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              초기화
            </Button>
            <Button
              onClick={handleSearch}
              disabled={!canSearch}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
