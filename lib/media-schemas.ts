import { z } from 'zod'

/** 게시물 미디어 항목 종류: 이미지 / 동영상(mp4) / 유튜브 링크 */
export const MEDIA_TYPES = ['image', 'video', 'youtube'] as const
export type MediaType = (typeof MEDIA_TYPES)[number]

/**
 * Post.images(JSON 배열) 요소 스키마.
 * `type` 미지정(기존 데이터)은 image로 취급 → 하위 호환.
 * - image/video: `url`=스토리지 원본 URL, `thumbnailUrl`=썸네일(image)·캡처 프레임(video)
 * - youtube: `url`=watch URL, `thumbnailUrl`=img.youtube.com URL, `videoId`=영상 ID
 */
export const mediaItemSchema = z.object({
  type: z.enum(MEDIA_TYPES).optional(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  blurDataURL: z.string().optional(),
  videoId: z.string().optional(),
  name: z.string(),
  order: z.number().int().nonnegative(),
})

export type MediaItem = z.infer<typeof mediaItemSchema>

/** 게시물 미디어 배열 (최소 1개). POST(생성)에서 사용 */
export const mediaArraySchema = z
  .array(mediaItemSchema)
  .min(1, '최소 1개의 이미지가 필요합니다.')
