'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { getViewUrl } from '@/lib/search-navigation'
import type { SearchResult } from '@/app/api/search/route'
import { TableRowSkeleton } from '@/components/ui/table-row-skeleton'

const PER_PAGE = 10

interface SearchResultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  results: SearchResult[]
  loading: boolean
}

function formatDate(dateString: string) {
  return format(new Date(dateString), 'yyyy년 M월 d일', { locale: ko })
}

export function SearchResultsDialog({
  open,
  onOpenChange,
  results,
  loading,
}: SearchResultsDialogProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE))
  const startIndex = (currentPage - 1) * PER_PAGE
  const paginatedResults = results.slice(startIndex, startIndex + PER_PAGE)

  useEffect(() => {
    if (open) {
      setCurrentPage(1)
    }
  }, [open, results])

  const handleViewClick = (result: SearchResult) => {
    const url = getViewUrl(result)
    onOpenChange(false)
    router.push(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>검색 결과</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>카테고리명</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="text-center">생성일</TableHead>
                  <TableHead className="text-center w-24">보기</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={4} />
                ))}
              </TableBody>
            </Table>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>카테고리명</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="text-center">생성일</TableHead>
                  <TableHead className="text-center w-24">보기</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResults.map((result) => (
                  <TableRow key={`${result.resourceType}-${result.id}`}>
                    <TableCell>
                      <Badge variant="secondary">{result.categoryName}</Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {result.title}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatDate(result.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewClick(result)}
                        className="h-8"
                      >
                        보기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {!loading && results.length > 0 && (
          <div className="flex items-center justify-between border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground">
              전체 {results.length}건 중 {startIndex + 1}-
              {Math.min(startIndex + PER_PAGE, results.length)}건
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
