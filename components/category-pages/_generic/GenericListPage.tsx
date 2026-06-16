'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { HorizontalScrollEdgeFades } from '@/components/ui/horizontal-scroll-edge-fades'
import { Flipper, Flipped } from 'react-flip-toolkit'
import { PostCardSkeleton } from '@/components/ui/post-card-skeleton'
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
import { Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { GenericCard } from '@/components/category-pages/_generic/GenericCard'
import { GenericPropertyPanel } from '@/components/category-pages/_generic/GenericPropertyPanel'
import { GenericUploadDialog } from '@/components/category-pages/_generic/GenericUploadDialog'
import { useCategoryList } from '@/lib/hooks/use-category-list'
import { useMasonryLayout } from '@/lib/hooks/use-masonry-layout'
import {
  getCategoryFilters,
  type CategoryListingConfig,
} from '@/lib/category-listing-config'

interface Category {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

interface GenericListPageProps {
  category: Category
  config: CategoryListingConfig
}

/**
 * 표준 카테고리(Damo/Cloudbric/iSIGN/WAPPLES …) 공통 목록 페이지.
 * config로 카드 너비/필터/타입/언어/라벨을 주입받아 동작은 동일하게 재현한다.
 * 각 `*ListPage.tsx`는 이 컴포넌트에 config를 넘기는 얇은 래퍼가 된다.
 */
export function GenericListPage({ category, config }: GenericListPageProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const list = useCategoryList(category)
  const { containerRef, columns } = useMasonryLayout(
    list.posts,
    config.cardWidth
  )

  const cardWidth = config.cardWidth
  const filters = getCategoryFilters(config)

  // Flipper의 flipKey는 columns 구조가 변경될 때마다 업데이트되어 애니메이션 트리거
  const flipKey =
    columns.length > 0
      ? `${list.selectedFilter}:${columns
          .map((col, idx) => `${idx}:${col.map((p) => p.id).join(',')}`)
          .join('|')}`
      : 'empty'

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50 dark:bg-neutral-900">
      {/* 좌측: 게시물 목록 (모바일에서는 속성 패널 없음 → pr-0) */}
      <div className="flex-1 pr-0 md:pr-[410px] overflow-y-auto">
        <div className="px-8 pt-16 pb-8">
          <div className="page-header-stack">
            <div>
              <h1 className="page-header-title">{category.name}</h1>
              <p className="text-muted-foreground mt-2 mb-2 md:mb-0">
                업로드된 게시물은 디자인팀의 최신 버전이며, 회사 공식 버전은 마케팅 또는 기획에 문의하시기 바랍니다.
              </p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => list.setUploadDialogOpen(true)}
                className="page-header-action-btn"
              >
                게시물 추가
              </Button>
            )}
          </div>

          {/* 필터 메뉴 (한 줄 + 가로 스크롤 + 엣지 페이드) */}
          <HorizontalScrollEdgeFades className="mb-3">
            <div className="flex flex-nowrap items-center gap-0">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => list.setSelectedFilter(filter)}
                  className={`shrink-0 pl-0 pr-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    list.selectedFilter === filter
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </HorizontalScrollEdgeFades>

          {/* 로딩 중 Skeleton 표시 */}
          {list.loading && list.posts.length === 0 && (
            <div ref={containerRef} className="masonry-container justify-center md:justify-start">
              {Array.from({ length: Math.min(4, Math.max(1, Math.floor((containerRef.current?.offsetWidth || 1200) / (cardWidth + 8)))) }).map((_, colIndex) => (
                <div key={colIndex} className="masonry-column" style={{ flex: `0 0 ${cardWidth}px`, width: `${cardWidth}px`, gap: '8px' }}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <PostCardSkeleton key={index} width={cardWidth} height={230} showButtons={true} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* 게시물이 없을 때 빈 상태 메시지 */}
          {list.posts.length === 0 && !list.loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                등록된 게시물이 없습니다.
              </p>
              {isAdmin && (
                <Button onClick={() => list.setUploadDialogOpen(true)}>
                  첫 게시물 추가하기
                </Button>
              )}
            </div>
          )}

          {/* 카드 그리드 */}
          {list.posts.length > 0 && (
            <Flipper
              flipKey={flipKey}
              spring={{ stiffness: 160, damping: 22 }}
              staggerConfig={{
                default: {
                  speed: 0.5,
                },
              }}
              decisionData={columns}
            >
              <div ref={containerRef} className="masonry-container justify-center md:justify-start">
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="masonry-column" style={{ flex: `0 0 ${cardWidth}px`, width: `${cardWidth}px`, gap: '8px' }}>
                    {column.map((post) => (
                      <Flipped key={post.id} flipId={post.id}>
                        <div>
                          <GenericCard
                            post={{
                              ...post,
                              fileUrl: list.getFileUrl(post),
                            }}
                            isSelected={list.selectedPostId === post.id}
                            onClick={list.handlePostClick}
                            onEdit={isAdmin ? list.handleEdit : undefined}
                            onDelete={isAdmin ? list.handleDeleteClick : undefined}
                            showActions={isAdmin}
                            cardWidth={cardWidth}
                          />
                        </div>
                      </Flipped>
                    ))}
                  </div>
                ))}
              </div>
            </Flipper>
          )}

          {/* 무한 스크롤 트리거 */}
          {list.hasMore && (
            <div ref={list.loadMoreRef} className="h-20 flex items-center justify-center">
              {list.loading && list.posts.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">더 불러오는 중...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 우측: 속성 패널 (데스크톱) */}
      <div className="hidden md:block">
        <GenericPropertyPanel
          post={list.selectedPost ? {
            ...list.selectedPost,
            fileUrl: list.getFileUrl(list.selectedPost),
          } : null}
          onDownload={list.handleDownload}
        />
      </div>

      <Sheet
        open={Boolean(
          list.isMobileViewport && list.mobilePropertySheetOpen && list.selectedPost
        )}
        onOpenChange={list.setMobilePropertySheetOpen}
      >
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto p-0">
          <SheetTitle className="sr-only">게시물 속성</SheetTitle>
          {list.selectedPost && (
            <GenericPropertyPanel
              variant="sheet"
              post={{
                ...list.selectedPost,
                fileUrl: list.getFileUrl(list.selectedPost),
              }}
              onDownload={list.handleDownload}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* 업로드 다이얼로그 */}
      {isAdmin && (
        <GenericUploadDialog
          open={list.uploadDialogOpen}
          onClose={() => list.setUploadDialogOpen(false)}
          categorySlug={category.slug}
          categoryId={category.id}
          onSuccess={list.handleUploadSuccess}
          label={config.label}
          types={config.types}
          languages={config.languages}
        />
      )}

      {/* 수정 다이얼로그 */}
      {isAdmin && list.editPostId && list.editPost && (
        <GenericUploadDialog
          open={list.editDialogOpen}
          onClose={list.closeEdit}
          categorySlug={category.slug}
          categoryId={category.id}
          postId={list.editPostId}
          post={list.editPost}
          onSuccess={list.handleUploadSuccess}
          label={config.label}
          types={config.types}
          languages={config.languages}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={list.deleteDialogOpen} onOpenChange={list.onDeleteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시물 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={list.deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                list.confirmDelete()
              }}
              disabled={list.deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {list.deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
