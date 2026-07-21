'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { IconUploadDialog } from '@/components/category-pages/IconCategory/IconUploadDialog'
import { IconCard } from '@/components/category-pages/IconCategory/IconCard'
import { IconPropertyPanel, DEFAULT_COLOR, DEFAULT_STROKE_WIDTH, DEFAULT_SIZE } from '@/components/category-pages/IconCategory/IconPropertyPanel'
import { changeIconSvgProperties } from '@/lib/svg-utils'
import JSZip from 'jszip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import { HorizontalScrollEdgeFades } from '@/components/ui/horizontal-scroll-edge-fades'
import { ICON_GROUPS, ICON_GROUP_ALL, isIconGroup } from '@/lib/icon-groups'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface IconTabProps {
  category: Category
  /** 공통 헤더(타이틀 + 구독 버튼 + 탭 바). 좌측 컬럼(pr-[410px]) 안에 렌더되어 우측 속성 패널과 겹치지 않는다. */
  header?: ReactNode
}

interface Post {
  id: string
  title: string
  fileUrl?: string | null
  thumbnailUrl?: string | null
  subtitle?: string | null // 그룹 슬러그(그룹 필터·섹션용)
}

export function IconTab({ category, header }: IconTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>(ICON_GROUP_ALL)
  const [loading, setLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mobilePropertySheetOpen, setMobilePropertySheetOpen] = useState(false)
  const isMobileViewport = useIsMobileViewport()

  // 속성 상태
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH)
  const [size, setSize] = useState(DEFAULT_SIZE)

  const fetchInProgressRef = useRef(false)

  // 그룹 + 검색 필터링 (전량 로드 후 클라이언트에서 처리)
  useEffect(() => {
    let list = posts

    // 1) 그룹 필터 (ALL이 아니면 해당 그룹만)
    if (selectedGroup !== ICON_GROUP_ALL) {
      list = list.filter((post) => post.subtitle === selectedGroup)
    }

    // 2) 검색 필터
    const query = searchQuery.toLowerCase().trim()
    if (query) {
      // 파일명 추출 헬퍼 함수
      const getFileName = (url: string | null | undefined): string => {
        if (!url) return ''
        const fileName = url.split('/').pop() || ''
        const nameWithoutExt = fileName.replace(/\.(svg|png|jpg|jpeg)$/i, '')
        return nameWithoutExt.toLowerCase()
      }

      list = list.filter((post) => {
        const titleMatch = post.title.toLowerCase().includes(query)
        const fileName = getFileName(post.fileUrl)
        const fileMatch =
          fileName.includes(query) || post.fileUrl?.toLowerCase().includes(query)
        return titleMatch || fileMatch
      })
    }

    setFilteredPosts(list)
  }, [posts, searchQuery, selectedGroup])

  useEffect(() => {
    if (!isMobileViewport) {
      setMobilePropertySheetOpen(false)
    }
  }, [isMobileViewport])

  useEffect(() => {
    if (selectedPostIds.size === 0) {
      setMobilePropertySheetOpen(false)
    }
  }, [selectedPostIds])

  // 게시물 전량 로드 (아이콘은 소규모라 페이지를 순차로 돌며 모두 로드 → 클라이언트에서 그룹/검색/섹션 처리)
  const loadAllPosts = useCallback(
    async (forceRefresh: boolean = false) => {
      if (fetchInProgressRef.current) {
        return
      }

      fetchInProgressRef.current = true
      try {
        setLoading(true)

        const all: Post[] = []
        let pageNum = 1
        // 안전 상한(페이지당 100개 × 100페이지 = 10,000개)
        while (pageNum <= 100) {
          const params = new URLSearchParams({
            categorySlug: category.slug,
            page: pageNum.toString(),
            limit: '100', // /api/posts 최대치
          })

          if (forceRefresh) {
            params.append('_t', Date.now().toString())
          }

          const response = await fetch(`/api/posts?${params.toString()}`, {
            cache: forceRefresh ? 'no-store' : 'default',
          })

          if (!response.ok) {
            throw new Error('게시물 목록을 불러오는데 실패했습니다.')
          }

          const data = await response.json()
          all.push(...data.posts)

          if (!data.pagination?.hasMore) break
          pageNum++
        }

        setPosts(all)
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setLoading(false)
        fetchInProgressRef.current = false
      }
    },
    [category.slug]
  )

  // 초기 로드
  useEffect(() => {
    loadAllPosts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 새로고침 파라미터 감지
  useEffect(() => {
    const refreshParam = searchParams.get('refresh')
    if (refreshParam) {
      setPosts([])
      loadAllPosts(true)
      router.replace(`/${category.slug}`, { scroll: false })
    }
  }, [searchParams, loadAllPosts, category.slug, router])

  // postId 파라미터 감지하여 게시물 자동 선택
  useEffect(() => {
    const postIdParam = searchParams.get('postId')
    if (postIdParam && posts.length > 0) {
      const post = posts.find((p) => p.id === postIdParam)
      if (post) {
        setSelectedPostIds(new Set([postIdParam]))
        setMobilePropertySheetOpen(true)
        router.replace(`/${category.slug}`, { scroll: false })
      }
    }
  }, [searchParams, posts, category.slug, router])

  // 아이콘 선택/해제
  const handleIconClick = (postId: string) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      if (next.size > 0) {
        queueMicrotask(() => setMobilePropertySheetOpen(true))
      } else {
        queueMicrotask(() => setMobilePropertySheetOpen(false))
      }
      return next
    })
  }

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedPostIds.size === filteredPosts.length) {
      setSelectedPostIds(new Set())
      setMobilePropertySheetOpen(false)
    } else {
      setSelectedPostIds(new Set(filteredPosts.map((p) => p.id)))
      setMobilePropertySheetOpen(true)
    }
  }

  // 선택 해제 (부분 선택 상태에서도 즉시 해제)
  const handleDeselectAll = () => {
    setSelectedPostIds(new Set())
    setMobilePropertySheetOpen(false)
  }

  // 선택된 아이콘 삭제
  const handleDelete = async () => {
    if (selectedPostIds.size === 0) {
      toast.error('삭제할 아이콘을 선택해주세요.')
      return
    }

    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedPostIds.size === 0) return

    try {
      setDeleting(true)

      const selectedIds = Array.from(selectedPostIds)
      let successCount = 0
      let failCount = 0

      // 각 아이콘 삭제
      for (const postId of selectedIds) {
        try {
          const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('삭제에 실패했습니다.')
          }

          successCount++
        } catch (error) {
          console.error(`Failed to delete post ${postId}:`, error)
          failCount++
        }
      }

      // 목록에서 제거
      setPosts((prev) => prev.filter((p) => !selectedPostIds.has(p.id)))
      setSelectedPostIds(new Set())

      setDeleteDialogOpen(false)

      if (failCount > 0) {
        toast.warning(`${successCount}개 삭제 성공, ${failCount}개 삭제 실패`)
      } else {
        toast.success(`${successCount}개의 아이콘이 삭제되었습니다.`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  // 속성 리셋
  const handleReset = () => {
    setColor(DEFAULT_COLOR)
    setStrokeWidth(DEFAULT_STROKE_WIDTH)
    setSize(DEFAULT_SIZE)
  }

  // 속성 패널용 다운로드 (단일/다중 모두 처리)
  const handlePropertyPanelDownload = async (format: 'png' | 'jpg' | 'svg') => {
    if (selectedPostIds.size === 0) {
      toast.error('다운로드할 아이콘을 선택해주세요.')
      return
    }

    try {
      setDownloading(true)

      const selectedPosts = posts.filter((p) => selectedPostIds.has(p.id))

      // 단일 아이콘 다운로드
      if (selectedPosts.length === 1) {
        const post = selectedPosts[0]
        if (!post.fileUrl || !post.id) {
          toast.error('다운로드할 파일이 없습니다.')
          setDownloading(false)
          return
        }

        // SVG 포맷인 경우 클라이언트 사이드 처리
        if (format === 'svg') {
          try {
            const response = await fetch(post.fileUrl)
            if (!response.ok) throw new Error(`Failed to fetch ${post.title}`)

            let svgContent = await response.text()

            // 속성 적용
            svgContent = changeIconSvgProperties(svgContent, color, strokeWidth, size)

            // 파일명 생성
            const fileName = `${post.title}.svg`

            // 직접 다운로드
            const blob = new Blob([svgContent], { type: 'image/svg+xml' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          } catch (error) {
            console.error(`Error downloading ${post.title}:`, error)
            toast.error('다운로드 중 오류가 발생했습니다.')
          }
        } else {
          // PNG/JPG 포맷인 경우 API 호출
          try {
            const queryParams = new URLSearchParams({
              format,
              size: size.toString(),
              color,
              strokeWidth: strokeWidth.toString(),
            })

            const response = await fetch(
              `/api/posts/${post.id}/icon/download?${queryParams.toString()}`
            )

            if (!response.ok) {
              const errorText = await response.text()
              console.error('[IconTab] 다운로드 에러 응답:', errorText)
              throw new Error('다운로드에 실패했습니다.')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url

            // 파일명 생성
            const fileName = `${post.title}.${format}`
            a.download = fileName

            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
          } catch (error) {
            console.error('[IconTab] Download error:', error)
            toast.error('다운로드 중 오류가 발생했습니다.')
          }
        }
      } else {
        // 여러 아이콘 ZIP 다운로드 (PNG / JPG / SVG 선택 가능)
        const zip = new JSZip()

        if (format === 'svg') {
          // SVG: 클라이언트에서 SVG fetch 후 속성 적용하여 ZIP에 추가
          for (const post of selectedPosts) {
            if (!post.fileUrl) continue

            try {
              const response = await fetch(post.fileUrl)
              if (!response.ok) throw new Error(`Failed to fetch ${post.title}`)

              let svgContent = await response.text()
              svgContent = changeIconSvgProperties(svgContent, color, strokeWidth, size)
              zip.file(`${post.title}.svg`, svgContent)
            } catch (error) {
              console.error(`Error processing ${post.title}:`, error)
            }
          }
        } else {
          // PNG / JPG: API 호출로 변환 후 ZIP에 추가
          for (const post of selectedPosts) {
            if (!post.id) continue

            try {
              const queryParams = new URLSearchParams({
                format,
                size: size.toString(),
                color,
                strokeWidth: strokeWidth.toString(),
              })
              const response = await fetch(
                `/api/posts/${post.id}/icon/download?${queryParams.toString()}`
              )
              if (!response.ok) throw new Error(`Failed to fetch ${post.title}`)

              const blob = await response.blob()
              zip.file(`${post.title}.${format}`, blob)
            } catch (error) {
              console.error(`Error processing ${post.title}:`, error)
            }
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url
        const now = new Date()
        const datePart = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
        ].join('')
        const timePart = [
          String(now.getHours()).padStart(2, '0'),
          String(now.getMinutes()).padStart(2, '0'),
          String(now.getSeconds()).padStart(2, '0'),
        ].join('')
        a.download = `icons_${datePart}_${timePart}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  // 업로드 성공 핸들러
  const handleUploadSuccess = () => {
    setPosts([])
    loadAllPosts(true)
    router.refresh()
  }

  // 표시 크기 계산 (16-56px 제한)
  const displaySize = Math.min(size, 56)

  // 아이콘 카드 렌더러 (섹션/단일 그리드 공용)
  const renderCard = (post: Post) => (
    <IconCard
      key={post.id}
      post={post}
      isSelected={selectedPostIds.has(post.id)}
      onClick={handleIconClick}
      size={displaySize}
      color={color}
      strokeWidth={strokeWidth}
    />
  )

  // 그룹 섹션 구성: ALL이면 14그룹 순서(+미분류) 섹션, 특정 그룹이면 null(단일 그리드)
  const uncategorized = filteredPosts.filter((post) => !isIconGroup(post.subtitle))
  const sections =
    selectedGroup === ICON_GROUP_ALL
      ? [
          ...ICON_GROUPS.map((group) => ({
            group,
            items: filteredPosts.filter((post) => post.subtitle === group),
          })),
          ...(uncategorized.length > 0
            ? [{ group: '기타', items: uncategorized }]
            : []),
        ].filter((section) => section.items.length > 0)
      : null

  const groupTabs: string[] = [ICON_GROUP_ALL, ...ICON_GROUPS]

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50 dark:bg-neutral-900">
      {/* 좌측: 게시물 목록 (모바일에서는 속성 패널 없음 → pr-0) */}
      <div className="flex-1 pr-0 md:pr-[410px] overflow-y-auto">
        {/* 공통 헤더(타이틀 + 구독 + 탭) — 좌측 컬럼 안에 두어 우측 속성 패널과 겹치지 않음 */}
        {header}

        {/* 검색 및 액션 버튼 */}
        <div className="flex-none px-8 pt-4 pb-4 bg-neutral-50 dark:bg-neutral-900">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`아이콘 이름으로 검색... (총 ${posts.length} icons)`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 전체 선택/해제 버튼 - 모든 사용자 사용 가능 */}
            {filteredPosts.length > 0 && (
              <Button
                variant="outline"
                onClick={handleSelectAll}
                disabled={deleting}
              >
                {selectedPostIds.size === filteredPosts.length ? (
                  <>
                    전체 해제
                  </>
                ) : (
                  <>
                    전체 선택
                  </>
                )}
              </Button>
            )}

            {/* 선택 해제 버튼 - 선택된 항목이 있을 때만 표시 */}
            {selectedPostIds.size > 0 && (
              <Button
                variant="outline"
                onClick={handleDeselectAll}
                disabled={deleting}
              >
                선택 해제 ({selectedPostIds.size})
              </Button>
            )}


            {/* 관리자용 삭제 버튼 */}
            {isAdmin && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || selectedPostIds.size === 0}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  <>
                    삭제 {selectedPostIds.size > 0 && `(${selectedPostIds.size})`}
                  </>
                )}
              </Button>
            )}

            {/* 관리자용 아이콘 추가 버튼 - 삭제 버튼 우측 */}
            {isAdmin && (
              <Button
                onClick={() => setUploadDialogOpen(true)}
              >
                아이콘 추가
              </Button>
            )}
          </div>

          {/* 그룹 필터 메뉴 (ALL + 14그룹, 한 줄 + 가로 스크롤 + 엣지 페이드) */}
          <HorizontalScrollEdgeFades className="mt-3">
            <div className="flex flex-nowrap items-center gap-4">
              {groupTabs.map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`shrink-0 px-0 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedGroup === group
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </HorizontalScrollEdgeFades>
        </div>

        {/* 아이콘 그리드 */}
        <div className="px-8 py-6">
          {loading && posts.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>불러오는 중...</span>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                {searchQuery ? '검색 결과가 없습니다.' : '아이콘이 없습니다.'}
              </p>
            </div>
          ) : sections ? (
            // ALL: 그룹별 섹션 헤더 + 그리드
            sections.map((section) => (
              <div key={section.group} className="mb-8">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  {section.group}{' '}
                  <span className="text-muted-foreground font-normal">
                    ({section.items.length})
                  </span>
                </h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-1">
                  {section.items.map(renderCard)}
                </div>
              </div>
            ))
          ) : (
            // 특정 그룹: 단일 그리드
            <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-1">
              {filteredPosts.map(renderCard)}
            </div>
          )}
        </div>
      </div>

      {/* 우측: 속성 패널 (데스크톱) */}
      <div className="hidden md:block">
        <IconPropertyPanel
          color={color}
          strokeWidth={strokeWidth}
          size={size}
          selectedCount={selectedPostIds.size}
          onColorChange={setColor}
          onStrokeWidthChange={setStrokeWidth}
          onSizeChange={setSize}
          onReset={handleReset}
          onDownload={handlePropertyPanelDownload}
        />
      </div>

      <Sheet
        open={Boolean(
          isMobileViewport &&
            mobilePropertySheetOpen &&
            selectedPostIds.size > 0
        )}
        onOpenChange={setMobilePropertySheetOpen}
      >
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto p-0">
          <SheetTitle className="sr-only">아이콘 속성</SheetTitle>
          <IconPropertyPanel
            variant="sheet"
            color={color}
            strokeWidth={strokeWidth}
            size={size}
            selectedCount={selectedPostIds.size}
            onColorChange={setColor}
            onStrokeWidthChange={setStrokeWidth}
            onSizeChange={setSize}
            onReset={handleReset}
            onDownload={handlePropertyPanelDownload}
          />
        </SheetContent>
      </Sheet>

      {/* 업로드 다이얼로그 */}
      {isAdmin && (
        <IconUploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onSuccess={handleUploadSuccess}
          categoryId={category.id}
          categorySlug={category.slug}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>아이콘 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedPostIds.size}개의 아이콘을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
