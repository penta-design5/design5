'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  computeColumnCount,
  distributeIntoColumns,
} from '@/lib/category-listing/masonry'

/**
 * 컨테이너 너비에 따라 카드들을 masonry(Pinterest 스타일) 열로 분배한다.
 * 리사이즈 시 150ms 디바운스 후 재계산. 원본 *ListPage의 calculateColumns 로직을 그대로 옮김.
 *
 * @returns containerRef(컨테이너 div에 부착), columns(열별 항목 배열)
 */
export function useMasonryLayout<T>(items: T[], cardWidth: number, gap = 8) {
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout>()
  const [columns, setColumns] = useState<T[][]>([])

  const calculateColumns = useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.offsetWidth
    const numColumns = computeColumnCount(containerWidth, cardWidth, gap)
    setColumns(distributeIntoColumns(items, numColumns))
  }, [items, cardWidth, gap])

  useEffect(() => {
    calculateColumns()

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      resizeTimeoutRef.current = setTimeout(() => {
        calculateColumns()
      }, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [calculateColumns])

  return { containerRef, columns }
}
