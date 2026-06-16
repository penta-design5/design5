'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'
import {
  buildPdfDownloadFilename,
  getPostFileUrl,
  type PostImage,
} from '@/lib/category-listing/post-file'

export interface CategoryPost {
  id: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  images?: PostImage[] | string | null | unknown
  fileUrl?: string | null
  concept?: string | null // 타입 (D.AMO, Cloudbric 등)
  tool?: string | null // 언어 (EN, KR, JP)
  producedAt?: Date | null
  tags?: Array<{ tag: { id: string; name: string; slug: string } }>
}

interface CategoryLike {
  id: string
  name: string
  slug: string
  type: string
  pageType?: string | null
}

/**
 * 표준 카테고리 목록 페이지(Damo/Cloudbric/iSIGN/WAPPLES …)의 상태·동작을 통합한 훅.
 *
 * posts 페치 + 무한 스크롤(IntersectionObserver) + 최근 3개 필터 LRU 캐시(useRef) +
 * 선택/다운로드/수정/삭제/업로드 CRUD 핸들러 + 모바일 시트 상태를 모두 관리한다.
 * 원본 *ListPage.tsx의 동작을 동일하게 재현한다.
 */
export function useCategoryList(category: CategoryLike) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [posts, setPosts] = useState<CategoryPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<CategoryPost | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editPostId, setEditPostId] = useState<string | null>(null)
  const [editPost, setEditPost] = useState<CategoryPost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL') // 필터 상태
  const [mobilePropertySheetOpen, setMobilePropertySheetOpen] = useState(false)
  const isMobileViewport = useIsMobileViewport()

  // 하이브리드 캐싱: 최근 3개 필터의 데이터를 메모리에 저장 (useRef 사용으로 무한 루프 방지)
  const filterCacheRef = useRef<Record<string, CategoryPost[]>>({})
  const filterCacheOrderRef = useRef<string[]>([]) // 캐시 순서 추적 (LRU 방식)

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isInitialMountRef = useRef(true) // 초기 마운트 플래그
  const fetchInProgressRef = useRef(false) // fetch 진행 중 플래그

  // 무한 스크롤 구현
  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loading])

  useEffect(() => {
    if (!isMobileViewport) {
      setMobilePropertySheetOpen(false)
    }
  }, [isMobileViewport])

  // 게시물 목록 조회 (selectedFilter를 파라미터로 받도록 변경)
  const fetchPosts = useCallback(
    async (
      pageNum: number,
      filter: string,
      append: boolean = false,
      forceRefresh: boolean = false
    ) => {
      // 중복 호출 방지 (loading 상태와 fetchInProgressRef 모두 확인)
      if (fetchInProgressRef.current || loading) {
        return
      }

      fetchInProgressRef.current = true
      try {
        setLoading(true)

        // 필터 파라미터 구성
        const params = new URLSearchParams({
          categorySlug: category.slug,
          page: pageNum.toString(),
          limit: '20',
        })

        // 필터 적용 (concept 파라미터 사용)
        if (filter !== 'ALL') {
          params.append('concept', filter)
        }

        if (forceRefresh) {
          params.append('_t', Date.now().toString())
        }

        const response = await fetch(`/api/posts?${params.toString()}`, {
          cache: forceRefresh ? 'no-store' : 'default',
        })

        if (!response.ok) {
          // 에러 발생 시 더 이상 로드하지 않도록 설정
          setHasMore(false)
          throw new Error('게시물 목록을 불러오는데 실패했습니다.')
        }

        const data = await response.json()

        if (append) {
          setPosts((prev) => {
            // 중복 제거: 이미 존재하는 post.id는 추가하지 않음
            const existingIds = new Set(prev.map((p) => p.id))
            const newPosts = data.posts.filter(
              (p: CategoryPost) => !existingIds.has(p.id)
            )
            return [...prev, ...newPosts]
          })
        } else {
          setPosts(data.posts)

          // 캐시 저장 (최근 3개 필터만 유지 - LRU 방식)
          if (!append && pageNum === 1) {
            filterCacheRef.current[filter] = data.posts

            // 최근 사용한 필터 순서 업데이트
            const order = filterCacheOrderRef.current.filter((f) => f !== filter)
            order.unshift(filter) // 맨 앞에 추가

            // 최근 3개만 유지
            if (order.length > 3) {
              const removed = order.pop()
              if (removed) {
                delete filterCacheRef.current[removed]
              }
            }

            filterCacheOrderRef.current = order
          }
        }

        setHasMore(data.pagination.hasMore)
      } catch (error) {
        console.error('Error fetching posts:', error)
        // 에러 발생 시 더 이상 로드하지 않도록 설정
        setHasMore(false)
      } finally {
        setLoading(false)
        fetchInProgressRef.current = false
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category.slug] // loading은 내부에서 관리되므로 의존성에서 제외
  )

  // 필터 변경 시 목록 새로고침 및 선택 상태 초기화
  useEffect(() => {
    // 초기 마운트 시에는 실행하지 않음 (초기 로드 useEffect가 처리)
    if (isInitialMountRef.current) {
      return
    }

    setPage(1)
    // 선택 상태 초기화
    setSelectedPostId(null)
    setSelectedPost(null)

    // 하이브리드 캐싱: 캐시된 데이터가 있으면 즉시 표시
    if (
      filterCacheRef.current[selectedFilter] &&
      filterCacheRef.current[selectedFilter].length > 0
    ) {
      setPosts(filterCacheRef.current[selectedFilter])
      // 백그라운드에서 최신 데이터 확인 (브라우저 캐시 활용)
      fetchPosts(1, selectedFilter, false, false)
    } else {
      // 캐시가 없으면 로딩 표시 후 API 호출
      setPosts([])
      fetchPosts(1, selectedFilter, false, false)
    }
  }, [selectedFilter, fetchPosts]) // filterCache 의존성 제거 (무한 루프 방지)

  // 초기 로드 (마운트 시에만 실행)
  useEffect(() => {
    fetchPosts(1, 'ALL', false)
    isInitialMountRef.current = false // 초기 마운트 완료 표시
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 새로고침 파라미터 감지
  useEffect(() => {
    const refreshParam = searchParams.get('refresh')
    if (refreshParam) {
      // 모든 캐시 무효화
      filterCacheRef.current = {}
      filterCacheOrderRef.current = []

      setPage(1)
      // setHasMore(true) 제거 - fetchPosts에서 API 응답의 실제 hasMore 값을 설정함
      setPosts([]) // 기존 게시물 초기화
      fetchPosts(1, selectedFilter, false, true)
      router.replace(`/${category.slug}`, { scroll: false })
    }
  }, [searchParams, selectedFilter, fetchPosts, category.slug, router])

  // postId 파라미터 감지하여 게시물 자동 선택
  useEffect(() => {
    const postIdParam = searchParams.get('postId')
    if (postIdParam && posts.length > 0) {
      const post = posts.find((p) => p.id === postIdParam)
      if (post) {
        setSelectedPostId(postIdParam)
        setSelectedPost(post)
        setMobilePropertySheetOpen(true)
        router.replace(`/${category.slug}`, { scroll: false })
      }
    }
  }, [searchParams, posts, category.slug, router])

  useEffect(() => {
    if (!selectedPost) {
      setMobilePropertySheetOpen(false)
    }
  }, [selectedPost])

  // 페이지 변경 시 추가 로드
  useEffect(() => {
    // page가 1보다 크고, 현재 로딩 중이 아니고, fetch가 진행 중이 아니며, hasMore가 true일 때만 실행
    if (page > 1 && !loading && !fetchInProgressRef.current && hasMore) {
      fetchPosts(page, selectedFilter, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedFilter, fetchPosts, hasMore]) // loading은 fetchPosts 내부에서 관리되므로 의존성에서 제외

  // 게시물 선택
  const handlePostClick = (postId: string) => {
    const post = posts.find((p) => p.id === postId)
    if (!post) return
    if (selectedPostId === postId) {
      setMobilePropertySheetOpen(true)
      return
    }
    setSelectedPostId(postId)
    setSelectedPost(post)
    setMobilePropertySheetOpen(true)
  }

  // 다운로드
  const handleDownload = async () => {
    if (!selectedPost) return
    const fileUrl = getPostFileUrl(selectedPost)
    if (!fileUrl) return

    try {
      // 프록시를 통해 PDF 다운로드
      const proxyUrl = `/api/posts/files?url=${encodeURIComponent(fileUrl)}`

      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error('다운로드에 실패했습니다.')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = buildPdfDownloadFilename(selectedPost)

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error(`[${category.pageType ?? category.slug}] Download error:`, error)
      toast.error('다운로드 중 오류가 발생했습니다.')
    }
  }

  // 수정
  const handleEdit = (postId: string) => {
    const post = posts.find((p) => p.id === postId)
    if (post) {
      setEditPostId(postId)
      setEditPost(post)
      setEditDialogOpen(true)
    }
  }

  const closeEdit = () => {
    setEditDialogOpen(false)
    setEditPostId(null)
    setEditPost(null)
  }

  // 삭제
  const handleDeleteClick = (postId: string) => {
    setDeletePostId(postId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletePostId) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/posts/${deletePostId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.')
      }

      // 목록에서 제거
      setPosts((prev) => prev.filter((p) => p.id !== deletePostId))

      // 모든 필터 캐시에서도 제거
      Object.keys(filterCacheRef.current).forEach((filter) => {
        filterCacheRef.current[filter] = filterCacheRef.current[filter].filter(
          (p) => p.id !== deletePostId
        )
      })

      // 선택된 게시물이 삭제된 경우 선택 해제
      if (selectedPostId === deletePostId) {
        setSelectedPostId(null)
        setSelectedPost(null)
      }

      setDeleteDialogOpen(false)
      setDeletePostId(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const onDeleteDialogOpenChange = (open: boolean) => {
    if (!deleting) {
      setDeleteDialogOpen(open)
      if (!open) {
        setDeletePostId(null)
      }
    }
  }

  // 업로드 성공 핸들러
  const handleUploadSuccess = () => {
    // 현재 필터의 캐시 무효화
    delete filterCacheRef.current[selectedFilter]
    filterCacheOrderRef.current = filterCacheOrderRef.current.filter(
      (f) => f !== selectedFilter
    )

    setPage(1)
    setHasMore(true)
    setPosts([]) // 기존 게시물 초기화
    fetchPosts(1, selectedFilter, false, true) // 강제 새로고침
    router.refresh()
  }

  return {
    // 데이터/상태
    posts,
    loading,
    hasMore,
    selectedFilter,
    setSelectedFilter,
    selectedPostId,
    selectedPost,
    // 무한 스크롤
    loadMoreRef,
    // 선택/다운로드
    handlePostClick,
    handleDownload,
    // 수정
    editDialogOpen,
    editPostId,
    editPost,
    handleEdit,
    closeEdit,
    // 삭제
    deleteDialogOpen,
    deletePostId,
    deleting,
    handleDeleteClick,
    confirmDelete,
    onDeleteDialogOpenChange,
    // 업로드
    uploadDialogOpen,
    setUploadDialogOpen,
    handleUploadSuccess,
    // 모바일
    isMobileViewport,
    mobilePropertySheetOpen,
    setMobilePropertySheetOpen,
    // 헬퍼
    getFileUrl: getPostFileUrl,
  }
}
