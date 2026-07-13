'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { youTubeEmbedUrl } from '@/lib/youtube'

export interface PlayableMedia {
  type: 'video' | 'youtube'
  /** video: 스토리지 공개 URL(mp4), youtube: watch URL */
  url: string
  /** youtube 전용 */
  videoId?: string
  name?: string
}

interface MediaPlayerDialogProps {
  media: PlayableMedia | null
  onClose: () => void
}

/**
 * 동영상/유튜브 재생 다이얼로그.
 * - video: `<video controls autoPlay>` 로 스토리지 공개 URL 직접 재생(브라우저가 Range 요청)
 * - youtube: `<iframe>` embed(autoplay=1)
 * 16:9 비율, 넓은 컨텐츠(max-w-4xl).
 */
export function MediaPlayerDialog({ media, onClose }: MediaPlayerDialogProps) {
  const open = media !== null

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent
        className="w-[95vw] max-w-4xl overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogTitle className="sr-only">{media?.name || '미디어 재생'}</DialogTitle>
        <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
          {media?.type === 'video' && (
            <video
              key={media.url}
              src={media.url}
              controls
              autoPlay
              playsInline
              className="absolute inset-0 h-full w-full"
            >
              브라우저가 동영상 재생을 지원하지 않습니다.
            </video>
          )}
          {media?.type === 'youtube' && media.videoId && (
            <iframe
              key={media.videoId}
              src={`${youTubeEmbedUrl(media.videoId)}?autoplay=1`}
              title={media.name || 'YouTube'}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
