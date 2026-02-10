'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Type, FileText, Calendar as CalendarIcon } from 'lucide-react'

interface DesktopLeftToolbarProps {
  onAddElement: (type: 'title' | 'description' | 'calendar') => void
}

export function DesktopLeftToolbar({ onAddElement }: DesktopLeftToolbarProps) {
  return (
    <TooltipProvider>
      <div className="w-16 border-r bg-background flex flex-col items-center py-4 gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddElement('title')}
              className="w-12 h-12"
            >
              <Type className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>제목 요소 추가</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddElement('description')}
              className="w-12 h-12"
            >
              <FileText className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>설명 요소 추가</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddElement('calendar')}
              className="w-12 h-12"
            >
              <CalendarIcon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>캘린더 요소 추가</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
