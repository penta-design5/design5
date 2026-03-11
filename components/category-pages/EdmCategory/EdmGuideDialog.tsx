'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EDM_GUIDE_STEPS } from '@/app/_category-pages/edm/edm-guide-content'

interface EdmGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EdmGuideDialog({ open, onOpenChange }: EdmGuideDialogProps) {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const handleOpenChange = (next: boolean) => {
    if (!next) setImageErrors({})
    onOpenChange(next)
  }

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>eDM 사용 가이드</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
          <div className="flex flex-col gap-8">
            {EDM_GUIDE_STEPS.map((step, index) => (
              <section key={index} className="space-y-3">
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {step.body}
                </p>
                {step.image && !imageErrors[index] ? (
                  <div className="relative w-full rounded-lg overflow-hidden border bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-auto object-contain"
                      onError={() => handleImageError(index)}
                    />
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
