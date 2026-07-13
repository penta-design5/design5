'use client'

import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog'
import { X } from 'lucide-react'
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
 *
 * 상세페이지 배경 클릭은 목록으로 이동하도록 되어 있고, 포털 이벤트는 React 트리를 타고
 * 배경 핸들러로 버블링된다. 따라서 (1) 배경(overlay) 클릭 전파를 차단하고 (2) 바깥 클릭으로는
 * 닫히지 않게 한 뒤(onPointerDownOutside/onInteractOutside preventDefault), 우측 상단 닫기 버튼과
 * ESC로만 닫는다.
 */
export function MediaPlayerDialog({ media, onClose }: MediaPlayerDialogProps) {
  const open = media !== null

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent
        // [&>button:last-child]:hidden — 공용 DialogContent의 기본 닫기 버튼(마지막 자식) 숨김(전용 버튼으로 대체)
        className="w-[95vw] max-w-4xl overflow-visible border-0 bg-transparent p-0 shadow-none [&>button:last-child]:hidden"
        overlayProps={{
          // 배경 클릭: 목록 이동(배경 핸들러) 차단 + 재생 팝업만 닫기. 바깥 pointerdown 자동 닫힘을
          // 막았으므로(아래) overlay가 click까지 유지되어 목록으로의 통과 클릭이 발생하지 않음
          onClick: (e) => {
            e.stopPropagation()
            onClose()
          },
          onPointerDown: (e) => e.stopPropagation(),
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{media?.name || '미디어 재생'}</DialogTitle>

        <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: '16 / 9' }}>
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

        {/* 전용 닫기 버튼 (우측 상단, 고대비) */}
        <DialogClose
          aria-label="닫기"
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-lg ring-1 ring-black/10 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
