'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Layout, Pencil, Trash2 } from 'lucide-react'
import { Flipper, Flipped } from 'react-flip-toolkit'
import type { CardTemplate } from '@/lib/card-schemas'
import { getB2ImageSrc } from '@/lib/b2-client-url'

interface CardGalleryProps {
  templates: CardTemplate[]
  loading: boolean
  isAdmin: boolean
  onSelectTemplate: (template: CardTemplate) => void
  onEditTemplate?: (template: CardTemplate) => void
  onDeleteTemplate?: (templateId: string) => void
}

const CARD_WIDTH = 320
const CARD_PREVIEW_HEIGHT = 167
const CARD_GAP = 8

function getThumbnailSrc(url: string | null | undefined): string {
  if (!url) return ''
  return getB2ImageSrc(url)
}

export function CardGallery({
  templates,
  loading,
  isAdmin,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: CardGalleryProps) {
  const [columns, setColumns] = useState<CardTemplate[][]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const calculateColumns = useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.offsetWidth
    const numColumns = Math.max(1, Math.floor((containerWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP)))
    const newColumns: CardTemplate[][] = Array(numColumns)
      .fill(null)
      .map(() => [])
    templates.forEach((t) => {
      const i = newColumns.reduce((min, col, j) => (col.length < newColumns[min].length ? j : min), 0)
      newColumns[i].push(t)
    })
    setColumns(newColumns)
  }, [templates])

  useEffect(() => {
    if (templates.length === 0) {
      setColumns([])
      return
    }
    calculateColumns()
    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)
      resizeTimeoutRef.current = setTimeout(calculateColumns, 150)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)
    }
  }, [calculateColumns, templates.length])

  const flipKey =
    columns.length > 0
      ? `card:${columns.map((col, i) => `${i}:${col.map((t) => t.id).join(',')}`).join('|')}`
      : 'empty'

  if (loading) {
    return (
      <div ref={containerRef} className="masonry-container justify-center md:justify-start">
        {Array.from({
          length: Math.min(4, Math.max(1, Math.floor((containerRef.current?.offsetWidth || 1200) / (CARD_WIDTH + CARD_GAP)))),
        }).map((_, colIndex) => (
          <div
            key={colIndex}
            className="masonry-column"
            style={{ flex: `0 0 ${CARD_WIDTH}px`, width: `${CARD_WIDTH}px`, gap: `${CARD_GAP}px` }}
          >
            {[1, 2].map((i) => (
              <div key={i} className="bg-card border rounded-lg overflow-hidden" style={{ width: `${CARD_WIDTH}px` }}>
                <Skeleton className="w-full" style={{ height: CARD_PREVIEW_HEIGHT }} />
                <div className="p-4 border-t">
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Layout className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg text-muted-foreground mb-2">등록된 감사/연말 카드 템플릿이 없습니다.</p>
        {isAdmin && (
          <p className="text-sm text-muted-foreground">
            상단의 &quot;템플릿 추가&quot; 버튼을 클릭하여 새 템플릿을 만들어보세요.
          </p>
        )}
      </div>
    )
  }

  return (
    <Flipper flipKey={flipKey}>
      <div ref={containerRef} className="masonry-container justify-center md:justify-start">
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="masonry-column"
            style={{ flex: `0 0 ${CARD_WIDTH}px`, width: `${CARD_WIDTH}px`, gap: `${CARD_GAP}px` }}
          >
            {column.map((template) => {
              const thumbSrc = template.thumbnailUrl ? getThumbnailSrc(template.thumbnailUrl) : null
              return (
                <Flipped key={template.id} flipId={template.id}>
                  <div
                    className="group relative bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                    style={{ width: `${CARD_WIDTH}px` }}
                  >
                    <div className="relative w-full bg-muted overflow-hidden" style={{ height: CARD_PREVIEW_HEIGHT }}>
                      {thumbSrc ? (
                        <Image
                          src={thumbSrc}
                          alt={template.name}
                          fill
                          className="object-contain"
                          sizes={`${CARD_WIDTH}px`}
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Layout className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-auto">
                        <Button variant="secondary" size="sm" onClick={() => onSelectTemplate(template)}>
                          편집하기
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 border-t">
                      <h3 className="font-semibold text-lg truncate text-center">{template.name}</h3>
                    </div>
                    {isAdmin && (onEditTemplate || onDeleteTemplate) && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                        {onEditTemplate && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditTemplate(template)
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {onDeleteTemplate && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteTemplate(template.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Flipped>
              )
            })}
          </div>
        ))}
      </div>
    </Flipper>
  )
}
