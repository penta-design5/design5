'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { PdfUploadZone } from '@/components/pdf-extractor/PdfUploadZone'
import { Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobileViewport } from '@/lib/hooks/use-is-mobile-viewport'

// PdfExtractorPanel을 dynamic import로 로드 (SSR 비활성화)
const PdfExtractorPanel = dynamic(
  () =>
    import('@/components/pdf-extractor/PdfExtractorPanel').then((mod) => ({
      default: mod.PdfExtractorPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-0 right-0 top-0 flex h-full w-[410px] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

export default function PdfExtractorPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const isMobileViewport = useIsMobileViewport()

  useEffect(() => {
    if (!isMobileViewport) {
      setMobileSheetOpen(false)
    }
  }, [isMobileViewport])

  useEffect(() => {
    if (!pdfFile) {
      setMobileSheetOpen(false)
    }
  }, [pdfFile])

  const handleFileSelect = (file: File) => {
    setPdfFile(file)
    setNumPages(0)
    setMobileSheetOpen(true)
  }

  const handleFileRemove = () => {
    setPdfFile(null)
    setNumPages(0)
  }

  return (
    <div className="w-full h-full flex absolute inset-0 bg-neutral-50 dark:bg-neutral-900">
      {/* 좌측: 파일 업로드 영역 */}
      <PdfUploadZone
        onFileSelect={handleFileSelect}
        selectedFile={pdfFile}
        onFileRemove={handleFileRemove}
        onOpenExtractPanel={() => setMobileSheetOpen(true)}
      />

      {/* 우측 패널 vs 모바일 시트: 동시 마운트 시 PdfPageCounter·상태가 중복되므로 뷰포트당 하나만 */}
      {!isMobileViewport ? (
        <div className="hidden md:block">
          <PdfExtractorPanel
            pdfFile={pdfFile}
            numPages={numPages}
            setNumPages={setNumPages}
          />
        </div>
      ) : (
        <Sheet
          open={Boolean(mobileSheetOpen && pdfFile)}
          onOpenChange={setMobileSheetOpen}
        >
          <SheetContent side="bottom" className="h-[70vh] overflow-y-auto p-0">
            <SheetTitle className="sr-only">PDF 추출 설정</SheetTitle>
            {pdfFile && (
              <PdfExtractorPanel
                variant="sheet"
                pdfFile={pdfFile}
                numPages={numPages}
                setNumPages={setNumPages}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
