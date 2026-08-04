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
 * 닫기 정책: 배경(overlay) 클릭 시 **팝업만 닫고 상세 페이지에 머문다**(목록으로 이동하지 않음).
 * 닫기 버튼·ESC도 동일.
 *
 * ※ 이전에 배경 클릭이 목록 이동으로 이어진 원인은 **두 가지**였고, 둘 다 막아야 한다.
 *   (1) 고스트 클릭 — Radix 기본 동작은 pointerdown에서 닫기 → overlay가 즉시 unmount →
 *       뒤이어 도착한 click이 그 자리 아래 갤러리 배경 div에 떨어진다.
 *   (2) React 트리 전파 — React 포털은 DOM 트리가 아니라 **React 트리**를 따라 이벤트를 전파한다.
 *       이 컴포넌트는 ImageGallery 안에 있고 그 ImageGallery는 GalleryDetailPage의
 *       `onClick={handleBackdropClick}`(목록 이동) div 안에 있으므로, overlay가 body로 포털되어도
 *       클릭이 그 핸들러까지 도달한다. → overlay에서 stopPropagation 필수.
 *   기존 DialogContent의 stopPropagation은 (2)를 콘텐츠에 대해서만 막고 있었다.
 */
export function MediaPlayerDialog({ media, onClose }: MediaPlayerDialogProps) {
  const open = media !== null

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent
        // [&>button:last-child]:hidden — 공용 DialogContent의 기본 닫기 버튼(마지막 자식) 숨김(전용 버튼으로 대체)
        className="w-[95vw] max-w-4xl overflow-visible border-0 bg-transparent p-0 shadow-none [&>button:last-child]:hidden"
        // (1) pointerdown 기반 닫기를 끈다 → overlay가 click 시점까지 살아있어 고스트 클릭이 없다
        onPointerDownOutside={(e) => e.preventDefault()}
        // (2) 배경 클릭 = 팝업만 닫기. React 포털은 DOM이 아니라 **React 트리**를 따라 전파되므로
        //     stopPropagation 없이는 상위 갤러리 배경(handleBackdropClick=목록 이동)까지 도달한다.
        overlayProps={{
          onClick: (e) => {
            e.stopPropagation()
            onClose()
          },
          onPointerDown: (e) => e.stopPropagation(),
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
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
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-900 opacity-40 shadow-lg ring-1 ring-black/10 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
