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
import { Loader2, X, File, ImageIcon, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { getB2ImageSrc, isB2WorkerUrl } from '@/lib/b2-client-url'
import { cn } from '@/lib/utils'

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

interface PostImage {
  url: string
  thumbnailUrl?: string
  blurDataURL?: string
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

export interface PreviewImageItem {
  url: string
  name: string
  order: number
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<PostImage[]>([])
  const [originalImages, setOriginalImages] = useState<PostImage[]>([]) // 원본 이미지 보관
  /** 썸네일로 사용할 이미지 인덱스 (0 = 첫 번째). 이미지 1개일 때는 0 고정, 2개 이상일 때 선택 가능 */
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0)
  /** 선택한 파일의 미리보기 URL (썸네일 선택 UI용, URL.createObjectURL) */
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isSubmittingRef = useRef(false) // 중복 제출 방지
  const onPreviewOrderChangeRef = useRef(onPreviewOrderChange)
  onPreviewOrderChangeRef.current = onPreviewOrderChange

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

  // 다이얼로그가 열릴 때 플래그 리셋
  useEffect(() => {
    if (open) {
      isSubmittingRef.current = false
    }
  }, [open])

  // 수정 모드일 때 기존 데이터로 폼 초기화
  useEffect(() => {
    if (isEditMode && post) {
      // images 배열 추출
      let images: PostImage[] = []
      if (post.images) {
        if (Array.isArray(post.images)) {
          images = post.images as PostImage[]
        } else if (typeof post.images === 'string') {
          try {
            images = JSON.parse(post.images)
          } catch {
            images = []
          }
        } else {
          images = Array.isArray(post.images) ? post.images : []
        }
      }
      setExistingImages(images)
      setOriginalImages(images) // 원본 이미지도 저장

      // 수정 모드: 기존 게시물의 thumbnailUrl에 해당하는 이미지 인덱스를 썸네일 기본값으로
      const thumbUrl = post.thumbnailUrl
      if (thumbUrl && images.length > 0) {
        const idx = images.findIndex((img) => img.url === thumbUrl || img.thumbnailUrl === thumbUrl)
        setSelectedThumbnailIndex(idx >= 0 ? idx : 0)
      } else {
        setSelectedThumbnailIndex(0)
      }

      // 태그를 쉼표로 구분된 문자열로 변환
      const tagsString = post.tags
        ? post.tags.map(({ tag }) => tag.name).join(', ')
        : ''

      // producedAt을 Date 객체로 변환
      const producedAtDate = post.producedAt
        ? new Date(post.producedAt)
        : undefined

      form.reset({
        title: post.title || '',
        subtitle: post.subtitle || '',
        concept: post.concept || '',
        tool: post.tool || '',
        tags: tagsString,
        producedAt: producedAtDate,
      })
    } else {
      form.reset({
        title: '',
        subtitle: '',
        concept: '',
        tool: '',
        tags: '',
        producedAt: undefined,
      })
      setExistingImages([])
      setSelectedFiles([])
      setSelectedThumbnailIndex(0)
    }
  }, [isEditMode, post, form])

  const totalImageCount = (isEditMode ? existingImages.length : 0) + selectedFiles.length
  useEffect(() => {
    if (totalImageCount > 0 && selectedThumbnailIndex >= totalImageCount) {
      setSelectedThumbnailIndex(0)
    }
  }, [totalImageCount, selectedThumbnailIndex])

  // 선택한 파일에 대한 미리보기 URL 생성/해제 (썸네일 선택 영역 표시용)
  useEffect(() => {
    if (selectedFiles.length === 0) {
      setFilePreviewUrls([])
      return
    }
    const urls = selectedFiles.map((file) => URL.createObjectURL(file))
    setFilePreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [selectedFiles])

  // 편집 화면 좌측 갤러리 미리보기: 다이얼로그에서 순서 변경 시 현재 순서로 부모에 전달 (ref 사용으로 무한 루프 방지)
  useEffect(() => {
    if (!open || !onPreviewOrderChangeRef.current) return
    const list: PreviewImageItem[] = [
      ...existingImages.map((img, i) => ({ url: img.url, name: img.name, order: i })),
      ...selectedFiles.map((file, i) => ({
        url: filePreviewUrls[i] ?? '',
        name: file.name,
        order: existingImages.length + i,
      })),
    ]
    onPreviewOrderChangeRef.current(list)
  }, [open, existingImages, selectedFiles, filePreviewUrls])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const moveExistingImageUp = (index: number) => {
    if (index <= 0) return
    setExistingImages((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
    setSelectedThumbnailIndex((prev) => {
      if (prev === index) return index - 1
      if (prev === index - 1) return index
      return prev
    })
  }

  const moveExistingImageDown = (index: number) => {
    if (index >= existingImages.length - 1) return
    setExistingImages((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
    setSelectedThumbnailIndex((prev) => {
      if (prev === index) return index + 1
      if (prev === index + 1) return index
      return prev
    })
  }

  const moveSelectedFileUp = (index: number) => {
    if (index <= 0) return
    setSelectedFiles((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
    setFilePreviewUrls((prev) => {
      if (prev.length <= index) return prev
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
    const base = existingImages.length
    setSelectedThumbnailIndex((prev) => {
      if (prev === base + index) return base + index - 1
      if (prev === base + index - 1) return base + index
      return prev
    })
  }

  const moveSelectedFileDown = (index: number) => {
    if (index >= selectedFiles.length - 1) return
    setSelectedFiles((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
    setFilePreviewUrls((prev) => {
      if (prev.length <= index + 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
    const base = existingImages.length
    setSelectedThumbnailIndex((prev) => {
      if (prev === base + index) return base + index + 1
      if (prev === base + index + 1) return base + index
      return prev
    })
  }

  const onSubmit = async (values: PostFormValues) => {
    // 중복 제출 방지
    if (isSubmittingRef.current) {
      console.warn('이미 제출 중입니다.')
      return
    }

    // 수정 모드가 아니고 새 파일이 없으면 에러
    if (!isEditMode && selectedFiles.length === 0) {
      toast.error('최소 1개의 이미지를 선택해주세요.')
      return
    }

    // 수정 모드인데 기존 이미지도 없고 새 파일도 없으면 에러
    if (isEditMode && existingImages.length === 0 && selectedFiles.length === 0) {
      toast.error('최소 1개의 이미지가 필요합니다.')
      return
    }

    try {
      isSubmittingRef.current = true
      setSubmitting(true)
      setUploading(true)

      let finalImages: PostImage[] = []

      // 새 파일이 있으면 서버 경유 업로드 (Vercel 4.5MB 제한 회피: 파일별로 1건씩 요청)
      if (selectedFiles.length > 0) {
        const allUploadedImages: PostImage[] = []
        const baseOrder = isEditMode ? existingImages.length : 0

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const formData = new FormData()
          formData.append('files', file)
          formData.append('categorySlug', categorySlug)

          const uploadResponse = await fetch('/api/posts/upload', {
            method: 'POST',
            body: formData,
          })

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json().catch(() => ({}))
            throw new Error((error as { error?: string }).error || '파일 업로드에 실패했습니다.')
          }

          const data = await uploadResponse.json()
          if (!data.images || data.images.length === 0) {
            throw new Error('업로드된 이미지가 없습니다.')
          }

          const one = data.images[0] as PostImage
          allUploadedImages.push({ ...one, order: baseOrder + allUploadedImages.length })
        }

        if (isEditMode && existingImages.length > 0) {
          finalImages = [...existingImages, ...allUploadedImages]
        } else {
          finalImages = allUploadedImages
        }
      } else if (isEditMode) {
        finalImages = existingImages
      }

      setUploading(false)

      const thumbnailUrl =
        finalImages.length > 0 ? finalImages[selectedThumbnailIndex]?.url ?? finalImages[0].url : undefined

      // 태그 문자열을 배열로 변환
      const tags = values.tags
        ? values.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : []

      if (isEditMode) {
        // 수정 모드: PUT 요청
        const response = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: values.title,
            subtitle: values.subtitle || null,
            images: finalImages,
            thumbnailUrl: thumbnailUrl ?? null,
            concept: values.concept || null,
            tool: values.tool || null,
            tags,
            producedAt: values.producedAt ? values.producedAt.toISOString() : null,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '게시물 수정에 실패했습니다.')
        }
      } else {
        // 생성 모드: POST 요청
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: values.title,
            subtitle: values.subtitle || null,
            categoryId,
            images: finalImages,
            thumbnailUrl: thumbnailUrl ?? null,
            concept: values.concept || null,
            tool: values.tool || null,
            tags,
            producedAt: values.producedAt ? values.producedAt.toISOString() : null,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '게시물 생성에 실패했습니다.')
        }
      }

      // 성공 시 폼 초기화
      form.reset()
      setSelectedFiles([])
      setExistingImages([])
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} post:`, error)
      toast.error(error.message || `게시물 ${isEditMode ? '수정' : '생성'}에 실패했습니다.`)
    } finally {
      setSubmitting(false)
      setUploading(false)
      isSubmittingRef.current = false // 제출 완료 후 플래그 리셋
    }
  }

  const handleClose = () => {
    form.reset()
    setSelectedFiles([])
    setExistingImages(originalImages) // 원본 이미지로 복원
    isSubmittingRef.current = false // 플래그 리셋
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={false}>
      <DialogContent
        data-gallery-edit-dialog
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        overlayProps={{
          onClick: onClose,
          onPointerDown: onClose,
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? '게시물 수정' : '게시물 추가'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? '게시물 정보를 수정합니다. 이미지를 변경하거나 정보를 업데이트할 수 있습니다.'
              : '새로운 게시물을 등록합니다. 이미지를 업로드하고 정보를 입력해주세요.'}
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
                      disabled={submitting || uploading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 이미지 업로드 섹션 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                이미지 {!isEditMode && '*'}
              </label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading || submitting}
              />

              {/* 기존 이미지 목록 (수정 모드) */}
              {isEditMode && existingImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">기존 이미지 (순서 변경 가능):</p>
                  <div className="grid grid-cols-3 gap-2">
                    {existingImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square border rounded-md overflow-hidden bg-muted group"
                      >
                        <Image
                          src={getB2ImageSrc(image.url)}
                          alt={image.name}
                          fill
                          unoptimized={isB2WorkerUrl(getB2ImageSrc(image.url))}
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 150px"
                        />
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveExistingImageUp(index)}
                            disabled={index === 0 || uploading || submitting}
                            title="위로 이동"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveExistingImageDown(index)}
                            disabled={index === existingImages.length - 1 || uploading || submitting}
                            title="아래로 이동"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveExistingImage(index)}
                          disabled={uploading || submitting}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    이미지에 마우스를 올리면 순서 변경·삭제 버튼이 표시됩니다. 새 이미지를 선택하면 기존 이미지 뒤에 추가됩니다.
                  </p>
                </div>
              )}

              {/* 썸네일 선택 (이미지 2개 이상일 때만) */}
              {totalImageCount >= 2 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">썸네일로 사용할 이미지 선택</p>
                  <p className="text-xs text-muted-foreground">
                    목록·카드에 표시될 대표 이미지를 선택하세요.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((image, index) => (
                      <button
                        key={`ex-${index}`}
                        type="button"
                        onClick={() => setSelectedThumbnailIndex(index)}
                        className={cn(
                          'relative w-14 h-14 rounded-md overflow-hidden border-2 transition-colors shrink-0',
                          selectedThumbnailIndex === index
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-transparent hover:border-muted-foreground/30'
                        )}
                      >
                        <Image
                          src={getB2ImageSrc(image.url)}
                          alt={image.name}
                          fill
                          unoptimized={isB2WorkerUrl(getB2ImageSrc(image.url))}
                          className="object-cover"
                          sizes="56px"
                        />
                        {selectedThumbnailIndex === index && (
                          <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] text-center py-0.5">
                            썸네일
                          </span>
                        )}
                      </button>
                    ))}
                    {selectedFiles.map((file, index) => {
                      const previewUrl = filePreviewUrls[index]
                      return (
                        <button
                          key={`new-${index}`}
                          type="button"
                          onClick={() => setSelectedThumbnailIndex(existingImages.length + index)}
                          className={cn(
                            'relative w-14 h-14 rounded-md border-2 overflow-hidden shrink-0 transition-colors',
                            selectedThumbnailIndex === existingImages.length + index
                              ? 'border-primary ring-2 ring-primary ring-offset-2'
                              : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                          )}
                        >
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="w-full h-full bg-muted flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </span>
                          )}
                          {selectedThumbnailIndex === existingImages.length + index && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[10px] text-center py-0.5">
                              썸네일
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 선택된 파일 목록 */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {isEditMode ? '새로 추가할 이미지 (순서 변경 가능):' : '선택된 이미지 (순서 변경 가능):'}
                  </p>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 p-2 border rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <File className="h-4 w-4 shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveSelectedFileUp(index)}
                          disabled={index === 0 || uploading || submitting}
                          title="위로 이동"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveSelectedFileDown(index)}
                          disabled={index === selectedFiles.length - 1 || uploading || submitting}
                          title="아래로 이동"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(index)}
                          disabled={uploading || submitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    저장 버튼을 클릭하면 파일이 자동으로 업로드됩니다.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={submitting || uploading}
              >
                취소
              </Button>
              <Button type="submit" disabled={submitting || uploading}>
                {submitting || uploading ? (
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

