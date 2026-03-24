'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Post {
  id: string
  title: string
  concept?: string | null // 타입 (가로, 세로)
  tool?: string | null // 언어 (EN, KR, JP)
  description?: string | null
  producedAt?: Date | null // 제작일
  fileUrl?: string | null // PPT 파일 URL
}

interface PptPropertyPanelProps {
  post: Post | null
  onDownload?: (postId: string) => void
  variant?: 'sidebar' | 'sheet'
}

export function PptPropertyPanel({
  post,
  onDownload,
  variant = 'sidebar',
}: PptPropertyPanelProps) {
  const isSheet = variant === 'sheet'
  const [downloading, setDownloading] = useState(false)

  if (!post) {
    return (
      <div
        className={
          isSheet
            ? 'flex min-h-[200px] w-full items-center justify-center bg-background'
            : 'fixed bottom-0 right-0 top-0 flex h-full w-[410px] items-center justify-center bg-background'
        }
      >
        <p className="text-muted-foreground">게시물을 선택하세요</p>
      </div>
    )
  }

  return (
    <div
      className={
        isSheet
          ? 'w-full min-h-0 overflow-y-auto bg-background'
          : 'fixed bottom-0 right-0 top-0 h-full w-[410px] overflow-y-auto bg-background'
      }
    >
      <div className={isSheet ? 'space-y-6 px-6 pb-8 pt-6' : 'space-y-6 px-8 pb-8 pt-14'}>
        {/* 제목 및 타입 */}
        <div className="space-y-5 pb-8 border-b">
          <h2 className="text-xl font-bold">{post.title}</h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
              {post.concept || 'N/A'}
            </span>
            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
              {post.tool || 'N/A'}
            </span>
          </div>
        </div>

        {/* 내용 및 제작일 */}
        <div className="space-y-4 pt-4 pb-8 border-b">
          {post.description && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">내용</Label>
              <p className="text-sm whitespace-pre-wrap">{post.description}</p>
            </div>
          )}
          {post.producedAt && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">제작일</Label>
              <p className="text-sm">
                {format(new Date(post.producedAt), 'yyyy년 M월 d일', { locale: ko })}
              </p>
            </div>
          )}
        </div>

        {/* 다운로드 */}
        <div className="space-y-3 pt-4">
          <div className='pt-10'>
            <Button
              className="w-full"
              onClick={async () => {
                if (onDownload) {
                  try {
                    setDownloading(true)
                    await onDownload(post.id)
                  } catch (error) {
                    console.error('Download error:', error)
                  } finally {
                    setDownloading(false)
                  }
                }
              }}
              disabled={!post.fileUrl || downloading}
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  다운로드 중...
                </>
              ) : (
                <>
                  다운로드
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
