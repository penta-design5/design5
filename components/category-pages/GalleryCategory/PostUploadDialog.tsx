'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Play,
  Youtube,
  ImageIcon,
  Film,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { getB2ImageSrc } from '@/lib/b2-client-url'
import { cn } from '@/lib/utils'
import { parseYouTubeUrl } from '@/lib/youtube'
import { captureVideoFrame } from '@/lib/video-thumbnail'
import type { MediaType } from '@/lib/media-schemas'

const postSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  subtitle: z.string().optional(),
  concept: z.string().optional(),
  tool: z.string().optional(),
  tags: z.string().optional(), // 쉼표로 구분된 태그 문자열
  producedAt: z.date({
    required_error: '제작일을 선택해주세요.',
  }),
})

type PostFormValues = z.infer<typeof postSchema>

/** 저장/전송되는 미디어 항목 (Post.images 요소) */
interface PostImage {
  type?: MediaType
  url: string
  thumbnailUrl?: string
  blurDataURL?: string
  videoId?: string
  name: string
  order: number
}

interface Post {
  id: string
  title: string
  subtitle?: string | null
  concept?: string | null
  tool?: string | null
  thumbnailUrl?: string | null
  images?: PostImage[] | null | any
  tags?: Array<{ tag: { id: string; name: string; slug: string } }>
  producedAt?: Date | string | null
}

/** 좌측 갤러리 미리보기(편집 중)로 전달하는 항목. P4 ImageGallery가 type별로 렌더 */
export interface PreviewImageItem {
  type?: MediaType
  url: string
  thumbnailUrl?: string
  videoId?: string
  name: string
  order: number
}

/**
 * 다이얼로그 내부의 통합 미디어 드래프트 항목.
 * - existing: 이미 업로드된 기존 항목(수정 모드)
 * - file: 새로 선택한 파일(image 또는 video/mp4)
 * - youtube: 유튜브 링크
 */
interface DraftMedia {
  key: string
  source: 'existing' | 'file' | 'youtube'
  type: MediaType
  name: string
  /** 목록/대표선택 미리보기에 쓰는 이미지 src (blob: 또는 원격 URL) */
  previewUrl: string
  // source === 'existing'
  existing?: PostImage
  // source === 'file'
  file?: File
  /** 동영상 파일에서 캡처한 썸네일 프레임(제출 시 재사용) */
  thumbnailBlob?: Blob
  // source === 'youtube'
  youtubeUrl?: string
  youtubeThumbnailUrl?: string
  videoId?: string
}

interface PostUploadDialogProps {
  open: boolean
  onClose: () => void
  categorySlug: string
  categoryId: string
  onSuccess: () => void
  postId?: string // 수정 모드일 때 게시물 ID
  post?: Post // 수정 모드일 때 게시물 데이터
  /** 편집 화면 좌측 갤러리 미리보기용: 다이얼로그 내 순서 변경 시 호출 */
  onPreviewOrderChange?: (images: PreviewImageItem[]) => void
}

const MAX_IMAGE_SIZE_BYTES = 4.5 * 1024 * 1024 // 이미지 4.5MB (Vercel 요청 제한 고려)
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024 // 동영상 100MB (사내망 완화)

/** Post.images(JSON/배열/문자열)을 PostImage[]로 정규화 */
function parsePostImages(raw: unknown): PostImage[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as PostImage[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/** 기존(저장된) 미디어 항목 → 드래프트 */
function toDraftFromExisting(image: PostImage, index: number): DraftMedia {
  const type: MediaType = image.type ?? 'image'
  const previewUrl =
    type === 'youtube'
      ? image.thumbnailUrl ?? ''
      : getB2ImageSrc(image.thumbnailUrl ?? image.url)
  return {
    key: `existing-${index}-${image.url}`,
    source: 'existing',
    type,
    name: image.name,
    previewUrl,
    existing: image,
    videoId: image.videoId,
  }
}

export function PostUploadDialog({
  open,
  onClose,
  categorySlug,
  categoryId,
  onSuccess,
  postId,
  post,
  onPreviewOrderChange,
}: PostUploadDialogProps) {
  const isEditMode = !!postId && !!post
  /** 이미지·동영상·유튜브를 아우르는 통합 미디어 목록 */
  const [mediaItems, setMediaItems] = useState<DraftMedia[]>([])
  /** 대표(커버) 썸네일로 사용할 항목 인덱스 */
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0)
  /** 유튜브 URL 입력값 */
  const [youtubeInput, setYoutubeInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isSubmittingRef = useRef(false) // 중복 제출 방지
  const initializedRef = useRef(false) // open 세션당 1회 초기화 가드
  const keyCounterRef = useRef(0)
  const onPreviewOrderChangeRef = useRef(onPreviewOrderChange)
  onPreviewOrderChangeRef.current = onPreviewOrderChange

  const nextKey = () => `draft-${keyCounterRef.current++}`

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      concept: '',
      tool: '',
      tags: '',
      producedAt: undefined,
    },
  })

  /** blob: URL만 해제 (원격 URL은 무시) */
  const revokePreview = (url?: string) => {
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  // 다이얼로그 open 세션당 1회 초기화 (post 참조가 바뀌어도 편집 중 목록을 덮어쓰지 않음)
  useEffect(() => {
    if (open && !initializedRef.current) {
      initializedRef.current = true
      isSubmittingRef.current = false
      setYoutubeInput('')

      if (isEditMode && post) {
        const images = parsePostImages(post.images)
        setMediaItems(images.map(toDraftFromExisting))

        const thumbUrl = post.thumbnailUrl
        if (thumbUrl && images.length > 0) {
          const idx = images.findIndex(
            (img) => img.url === thumbUrl || img.thumbnailUrl === thumbUrl
          )
          setSelectedThumbnailIndex(idx >= 0 ? idx : 0)
        } else {
          setSelectedThumbnailIndex(0)
        }

        const tagsString = post.tags
          ? post.tags.map(({ tag }) => tag.name).join(', ')
          : ''
        const producedAtDate = post.producedAt ? new Date(post.producedAt) : undefined

        form.reset({
          title: post.title || '',
          subtitle: post.subtitle || '',
          concept: post.concept || '',
          tool: post.tool || '',
          tags: tagsString,
          producedAt: producedAtDate,
        })
      } else {
        setMediaItems([])
        setSelectedThumbnailIndex(0)
        form.reset({
          title: '',
          subtitle: '',
          concept: '',
          tool: '',
          tags: '',
          producedAt: undefined,
        })
      }
    }
    if (!open) {
      initializedRef.current = false
    }
  }, [open, isEditMode, post, form])

  // 대표 인덱스가 목록 범위를 벗어나면 0으로 보정
  useEffect(() => {
    if (mediaItems.length > 0 && selectedThumbnailIndex >= mediaItems.length) {
      setSelectedThumbnailIndex(0)
    }
  }, [mediaItems.length, selectedThumbnailIndex])

  // 편집 화면 좌측 갤러리 미리보기: 현재 목록/순서를 부모로 전달 (ref로 무한 루프 방지)
  useEffect(() => {
    if (!open || !onPreviewOrderChangeRef.current) return
    const list: PreviewImageItem[] = mediaItems.map((item, i) => ({
      type: item.type,
      url:
        item.source === 'existing'
          ? item.existing!.url
          : item.source === 'youtube'
          ? item.youtubeUrl!
          : item.previewUrl,
      thumbnailUrl:
        item.source === 'existing'
          ? item.existing!.thumbnailUrl
          : item.source === 'youtube'
          ? item.youtubeThumbnailUrl
          : item.previewUrl,
      videoId: item.videoId,
      name: item.name,
      order: i,
    }))
    onPreviewOrderChangeRef.current(list)
  }, [open, mediaItems])

  // 언마운트 시 남은 blob URL 정리
  useEffect(() => {
    return () => {
      mediaItems.forEach((item) => revokePreview(item.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : []
    e.target.value = '' // 같은 파일 재선택 시에도 onChange가 발생하도록 초기화
    if (picked.length === 0) return

    const accepted: DraftMedia[] = []
    for (const file of picked) {
      const isImage = file.type.startsWith('image/')
      const isMp4 = file.type === 'video/mp4'
      if (!isImage && !isMp4) {
        toast.error(
          `지원하지 않는 파일 형식입니다: ${file.name} (이미지 또는 mp4 동영상만 첨부할 수 있습니다.)`
        )
        continue
      }
      accepted.push({
        key: nextKey(),
        source: 'file',
        type: isMp4 ? 'video' : 'image',
        name: file.name,
        // 이미지는 즉시 objectURL, 동영상은 캡처 완료 전까지 빈 값(플레이스홀더 표시)
        previewUrl: isImage ? URL.createObjectURL(file) : '',
        file,
      })
    }

    if (accepted.length === 0) return
    setMediaItems((prev) => [...prev, ...accepted])

    // 동영상 파일은 1초 프레임을 캡처해 미리보기/썸네일로 사용 (캡처 Blob은 제출 시 재사용)
    accepted
      .filter((item) => item.type === 'video')
      .forEach((item) => {
        captureVideoFrame(item.file!)
          .then((blob) => {
            const previewUrl = URL.createObjectURL(blob)
            setMediaItems((prev) => {
              if (!prev.some((p) => p.key === item.key)) {
                // 캡처 완료 전에 제거된 경우 누수 방지
                URL.revokeObjectURL(previewUrl)
                return prev
              }
              return prev.map((p) =>
                p.key === item.key ? { ...p, thumbnailBlob: blob, previewUrl } : p
              )
            })
          })
          .catch(() => {
            // 캡처 실패: 미리보기는 플레이스홀더 유지, 제출 시 썸네일 없이 저장
          })
      })
  }

  const handleAddYoutube = () => {
    const parsed = parseYouTubeUrl(youtubeInput)
    if (!parsed) {
      toast.error('유효한 유튜브 링크가 아닙니다. URL을 다시 확인해주세요.')
      return
    }
    if (
      mediaItems.some(
        (item) => item.type === 'youtube' && item.videoId === parsed.videoId
      )
    ) {
      toast.error('이미 추가된 유튜브 동영상입니다.')
      return
    }
    setMediaItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        source: 'youtube',
        type: 'youtube',
        name: `유튜브 동영상 ${parsed.videoId}`,
        previewUrl: parsed.thumbnailUrl,
        youtubeUrl: parsed.watchUrl,
        youtubeThumbnailUrl: parsed.thumbnailUrl,
        videoId: parsed.videoId,
      },
    ])
    setYoutubeInput('')
  }

  const handleRemoveItem = (index: number) => {
    setMediaItems((prev) => {
      const target = prev[index]
      if (target) revokePreview(target.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
    setSelectedThumbnailIndex((prev) => {
      if (index === prev) return 0
      if (index < prev) return prev - 1
      return prev
    })
  }

  // 항목을 from → to 위치로 이동. 한 칸 이동·맨 처음/맨 마지막 이동을 모두 처리한다.
  const moveItemTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= mediaItems.length) return
    setMediaItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    // 이동 항목 사이에 끼인 항목들은 한 칸씩 밀리므로 대표 인덱스를 재계산
    setSelectedThumbnailIndex((prev) => {
      if (prev === from) return to
      if (from < prev && prev <= to) return prev - 1
      if (to <= prev && prev < from) return prev + 1
      return prev
    })
  }

  const moveItem = (index: number, dir: -1 | 1) => moveItemTo(index, index + dir)
  const moveItemToStart = (index: number) => moveItemTo(index, 0)
  const moveItemToEnd = (index: number) => moveItemTo(index, mediaItems.length - 1)

  const onSubmit = async (values: PostFormValues) => {
    if (isSubmittingRef.current) {
      console.warn('이미 제출 중입니다.')
      return
    }

    if (mediaItems.length === 0) {
      toast.error('최소 1개의 미디어(이미지/동영상/유튜브)가 필요합니다.')
      return
    }

    // 새 파일 크기 검증: 이미지 4.5MB / 동영상 100MB
    const oversized = mediaItems
      .filter((item) => item.source === 'file')
      .filter((item) =>
        item.type === 'video'
          ? item.file!.size > MAX_VIDEO_SIZE_BYTES
          : item.file!.size > MAX_IMAGE_SIZE_BYTES
      )
    if (oversized.length > 0) {
      const names = oversized.map((item) => item.name).join(', ')
      toast.error(
        `파일 크기 제한을 초과했습니다(이미지 4.5MB · 동영상 100MB): ${names}`
      )
      return
    }

    // 파일/Blob 1건 업로드 → 저장용 항목 반환
    const uploadBinary = async (payload: File | Blob, filename: string): Promise<PostImage> => {
      const formData = new FormData()
      formData.append('files', payload, filename)
      formData.append('categorySlug', categorySlug)
      const res = await fetch('/api/posts/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error((error as { error?: string }).error || '파일 업로드에 실패했습니다.')
      }
      const data = await res.json()
      if (!data.images || data.images.length === 0) {
        throw new Error('업로드된 이미지가 없습니다.')
      }
      return data.images[0] as PostImage
    }

    try {
      isSubmittingRef.current = true
      setSubmitting(true)
      setUploading(true)

      const finalImages: PostImage[] = []

      for (const item of mediaItems) {
        const order = finalImages.length

        if (item.source === 'existing') {
          finalImages.push({ ...item.existing!, order })
          continue
        }

        if (item.source === 'youtube') {
          finalImages.push({
            type: 'youtube',
            url: item.youtubeUrl!,
            thumbnailUrl: item.youtubeThumbnailUrl,
            videoId: item.videoId,
            name: item.name,
            order,
          })
          continue
        }

        // source === 'file'
        if (item.type === 'image') {
          const up = await uploadBinary(item.file!, item.file!.name)
          finalImages.push({ ...up, type: 'image', order })
          continue
        }

        // 동영상: (a) mp4 원본 업로드 → url, (b) 캡처 프레임 이미지 업로드 → thumbnailUrl/blurDataURL
        const videoUp = await uploadBinary(item.file!, item.file!.name)
        let thumbnailUrl: string | undefined
        let blurDataURL: string | undefined
        const blob =
          item.thumbnailBlob ?? (await captureVideoFrame(item.file!).catch(() => null))
        if (blob) {
          const frameName = `${item.file!.name.replace(/\.[^.]+$/, '')}-thumb.jpg`
          const frameUp = await uploadBinary(blob, frameName)
          thumbnailUrl = frameUp.thumbnailUrl ?? frameUp.url
          blurDataURL = frameUp.blurDataURL
        }
        finalImages.push({
          type: 'video',
          url: videoUp.url,
          thumbnailUrl,
          blurDataURL,
          name: item.file!.name,
          order,
        })
      }

      setUploading(false)

      // 대표(커버) 썸네일: 선택 항목의 thumbnailUrl(없으면 url) — 동영상/유튜브가 대표여도 이미지 썸네일이 저장됨
      const cover = finalImages[selectedThumbnailIndex] ?? finalImages[0]
      const thumbnailUrl = cover ? cover.thumbnailUrl ?? cover.url : undefined

      const tags = values.tags
        ? values.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : []

      const body = {
        title: values.title,
        subtitle: values.subtitle || null,
        images: finalImages,
        thumbnailUrl: thumbnailUrl ?? null,
        concept: values.concept || null,
        tool: values.tool || null,
        tags,
        producedAt: values.producedAt ? values.producedAt.toISOString() : null,
      }

      if (isEditMode) {
        const response = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '게시물 수정에 실패했습니다.')
        }
      } else {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, categoryId }),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '게시물 생성에 실패했습니다.')
        }
      }

      // 성공: 목록 정리 후 닫기
      mediaItems.forEach((item) => revokePreview(item.previewUrl))
      form.reset()
      setMediaItems([])
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} post:`, error)
      toast.error(error.message || `게시물 ${isEditMode ? '수정' : '생성'}에 실패했습니다.`)
    } finally {
      setSubmitting(false)
      setUploading(false)
      isSubmittingRef.current = false
    }
  }

  const handleClose = () => {
    mediaItems.forEach((item) => revokePreview(item.previewUrl))
    form.reset()
    setMediaItems([])
    setYoutubeInput('')
    isSubmittingRef.current = false
    onClose()
  }

  /** Radix onOpenChange는 열릴 때 true·닫힐 때 false 모두 호출됨. true에서 handleClose를 호출하면 열자마자 닫힘 */
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose()
    }
  }

  const busy = uploading || submitting

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal>
      <DialogContent
        data-gallery-edit-dialog
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? '게시물 수정' : '게시물 추가'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? '게시물 정보를 수정합니다. 이미지·동영상·유튜브 링크를 변경하거나 정보를 업데이트할 수 있습니다.'
              : '새로운 게시물을 등록합니다. 이미지·동영상(mp4)·유튜브 링크를 첨부하고 정보를 입력해주세요.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목 *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="게시물 제목을 입력하세요" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>부제목</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="부제목을 입력하세요" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="concept"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CONCEPT</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="CONCEPT를 입력하세요"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="tool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TOOL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="TOOL을 입력하세요" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>태그</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="태그는 쉼표로 구분 입력 (예: 디자인, 브랜딩)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="producedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제작일 *</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="제작일을 선택하세요"
                      disabled={busy}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 미디어 첨부 섹션 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                미디어 {!isEditMode && '*'}
              </label>
              <p className="text-xs text-muted-foreground">
                이미지(4.5MB 이하)나 동영상(mp4, 100MB 이하)을 선택하거나 유튜브 링크를 추가하세요.
              </p>

              {/* 파일 선택 (이미지 + mp4) */}
              <Input
                type="file"
                multiple
                accept="image/*,video/mp4"
                onChange={handleFileSelect}
                disabled={busy}
              />

              {/* 유튜브 링크 추가 */}
              <div className="flex gap-2">
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="유튜브 링크 붙여넣기 (watch/youtube/shorts)"
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddYoutube()
                    }
                  }}
                  disabled={busy}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddYoutube}
                  disabled={busy || youtubeInput.trim().length === 0}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  유튜브 추가
                </Button>
              </div>

              {/* 통합 미디어 목록 (미리보기 · 타입배지 · 대표선택 · 순서이동 · 삭제) */}
              {mediaItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    항목을 클릭하면 대표(커버) 썸네일로 지정됩니다. 마우스를 올리면 순서 변경·삭제 버튼이 표시되며, 겹화살표(⇈ ⇊)는 맨 처음·맨 마지막으로 즉시 이동합니다.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {mediaItems.map((item, index) => {
                      const isCover = selectedThumbnailIndex === index
                      return (
                        <div
                          key={item.key}
                          className={cn(
                            'relative aspect-square border-2 rounded-md overflow-hidden bg-muted group cursor-pointer transition-colors',
                            isCover
                              ? 'border-primary ring-2 ring-primary ring-offset-2'
                              : 'border-transparent hover:border-muted-foreground/30'
                          )}
                          onClick={() => setSelectedThumbnailIndex(index)}
                          title="클릭하여 대표 썸네일로 지정"
                        >
                          {item.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center">
                              {item.type === 'video' ? (
                                <Film className="h-8 w-8 text-muted-foreground" />
                              ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              )}
                            </span>
                          )}

                          {/* 동영상/유튜브 재생 오버레이 */}
                          {(item.type === 'video' || item.type === 'youtube') && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55">
                                <Play className="h-4 w-4 text-white fill-white" />
                              </span>
                            </span>
                          )}

                          {/* 타입 배지 */}
                          <span className="absolute left-1 top-1 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white pointer-events-none">
                            {item.type === 'youtube' ? (
                              <>
                                <Youtube className="h-3 w-3" /> YouTube
                              </>
                            ) : item.type === 'video' ? (
                              <>
                                <Film className="h-3 w-3" /> 동영상
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-3 w-3" /> 이미지
                              </>
                            )}
                          </span>

                          {/* 순서 이동: 위 행=앞으로, 아래 행=뒤로 / 좌측 열=맨 끝까지, 우측 열=한 칸 */}
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 grid grid-cols-2 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveItemToStart(index)
                              }}
                              disabled={index === 0 || busy}
                              title="맨 처음으로 이동"
                            >
                              <ChevronsUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveItem(index, -1)
                              }}
                              disabled={index === 0 || busy}
                              title="한 칸 앞으로 이동"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveItemToEnd(index)
                              }}
                              disabled={index === mediaItems.length - 1 || busy}
                              title="맨 마지막으로 이동"
                            >
                              <ChevronsDown className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveItem(index, 1)
                              }}
                              disabled={index === mediaItems.length - 1 || busy}
                              title="한 칸 뒤로 이동"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* 삭제 */}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveItem(index)
                            }}
                            disabled={busy}
                          >
                            <X className="h-3 w-3" />
                          </Button>

                          {/* 대표 라벨 */}
                          {isCover && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] text-center py-0.5 pointer-events-none">
                              대표
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={busy}>
                취소
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploading ? '업로드 중...' : '저장 중...'}
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
