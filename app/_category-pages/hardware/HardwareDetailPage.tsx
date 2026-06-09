'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Download, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { HardwareProductPost } from '@/lib/hardware-schemas'
import { getB2ImageSrc, isB2WorkerUrl } from '@/lib/b2-client-url'

interface Category {
  id: string
  name: string
  slug: string
}

interface HardwareDetailPageProps {
  category: Category
  productId: string
}

export function HardwareDetailPage({ category, productId }: HardwareDetailPageProps) {
  const router = useRouter()
  const [product, setProduct] = useState<HardwareProductPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/hardware/${productId}`)
        if (!res.ok) throw new Error('제품을 불러오는데 실패했습니다.')
        const data = await res.json()
        setProduct(data)
      } catch (error) {
        console.error('Error fetching hardware product:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  const handleClose = () => {
    router.push(`/${category.slug}`)
  }

  const handleDownload = async () => {
    if (!product) return
    try {
      setDownloading(true)
      const res = await fetch(`/api/hardware/${product.id}/download`)
      if (!res.ok) throw new Error('다운로드에 실패했습니다.')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = (product.imageUrl.split('?')[0].split('.').pop() || 'png').toLowerCase()
      a.download = `${(product.title || 'hardware').replace(/[\\/:*?"<>|]/g, '_')}.${ext}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">제품을 찾을 수 없습니다.</p>
          <Button onClick={handleClose}>목록으로 돌아가기</Button>
        </div>
      </div>
    )
  }

  const imgSrc = getB2ImageSrc(product.imageUrl)

  return (
    <div className="h-full w-full flex flex-col md:flex-row">
      {/* 좌측: 큰 이미지 미리보기 — 클릭 시 우측 패널 토글(줌) */}
      <div
        className={`relative flex-1 min-h-[40vh] md:min-h-0 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center ${
          zoomed ? 'p-0 md:p-2 cursor-zoom-out' : 'p-4 md:p-8 cursor-zoom-in'
        }`}
        onClick={() => setZoomed((v) => !v)}
        role="presentation"
      >
        <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="bg-background/80 backdrop-blur-sm"
            title="목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative w-full h-full min-h-[40vh]">
          <Image
            src={imgSrc}
            alt={product.title}
            fill
            unoptimized={isB2WorkerUrl(imgSrc)}
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* 우측: 정보 패널 (제목·설명·다운로드) — 줌 상태에선 숨김 */}
      <div
        className={`w-full md:w-[28rem] md:flex-shrink-0 border-t md:border-t-0 md:border-l overflow-y-auto ${
          zoomed ? 'hidden' : ''
        }`}
      >
        <div className="p-6 flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold break-words">{product.title}</h1>
          </div>

          {product.description && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-1">설명</h2>
              <p className="text-sm whitespace-pre-wrap break-words">
                {product.description}
              </p>
            </div>
          )}

          <Button onClick={handleDownload} disabled={downloading} className="w-full">
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                다운로드 중...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                이미지 다운로드
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
