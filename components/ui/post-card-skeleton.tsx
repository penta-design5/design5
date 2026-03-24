import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface PostCardSkeletonProps {
  width?: number
  height?: number
  showButtons?: boolean
  /** true면 고정 px 대신 부모 너비에 맞춤(갤러리 모바일 등). width/height 무시 */
  responsiveWidth?: boolean
}

export function PostCardSkeleton({
  width = 285,
  height,
  showButtons = false,
  responsiveWidth = false,
}: PostCardSkeletonProps) {
  const cardHeight = height || (width * 4) / 3

  if (responsiveWidth) {
    return (
      <div
        className={cn(
          'flex-shrink-0 w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted',
          showButtons && 'relative'
        )}
      >
        <Skeleton className="w-full h-full" />
        {showButtons && (
          <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex-shrink-0 rounded-lg overflow-hidden bg-muted"
      style={{ width: `${width}px`, height: `${cardHeight}px` }}
    >
      <Skeleton className="w-full h-full" />
      {showButtons && (
        <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      )}
    </div>
  )
}
