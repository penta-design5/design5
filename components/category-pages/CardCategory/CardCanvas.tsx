'use client'

import { forwardRef, useMemo } from 'react'
import Image from 'next/image'
import type { CardTemplate, CardTemplateConfig, CardUserEditData } from '@/lib/card-schemas'
import { getB2ImageSrc } from '@/lib/b2-client-url'

interface CardCanvasProps {
  template: CardTemplate
  userEditData: CardUserEditData
  scale?: number
  showEditHighlight?: boolean
  activeElementId?: string | null
  onElementClick?: (elementId: string) => void
}

function getImageSrc(url: string) {
  if (!url) return ''
  return getB2ImageSrc(url)
}

function getFontWeight(weight: string): number {
  const map: Record<string, number> = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
  return map[weight] || 400
}

function getTransformByAlign(textAlign: string, verticalAlign: string = 'middle'): string {
  const x = textAlign === 'left' ? '0' : textAlign === 'right' ? '-100%' : '-50%'
  const y = verticalAlign === 'top' ? '0' : verticalAlign === 'bottom' ? '-100%' : '-50%'
  return `translate(${x}, ${y})`
}

export const CardCanvas = forwardRef<HTMLDivElement, CardCanvasProps>(
  function CardCanvas(
    { template, userEditData, scale = 1, showEditHighlight = false, activeElementId, onElementClick },
    ref
  ) {
    const config = template.config as CardTemplateConfig
    const images = Array.isArray(template.backgroundImages) ? template.backgroundImages : []
    const idx = Math.min(
      Math.max(0, userEditData.selectedBackgroundIndex ?? 0),
      images.length - 1
    )
    const bgItem = images[idx]
    const canvasWidth = bgItem ? bgItem.width : template.width
    const canvasHeight = bgItem ? bgItem.height : template.height

    const textValues = useMemo(() => {
      const values: Record<string, string> = {}
      config.textElements.forEach((el) => {
        values[el.id] = userEditData.textValues[el.id] ?? el.defaultValue
      })
      return values
    }, [config.textElements, userEditData.textValues])

    return (
      <div
        ref={ref}
        id="card-canvas"
        className="relative overflow-hidden"
        style={{
          width: canvasWidth * scale,
          height: canvasHeight * scale,
        }}
      >
        {bgItem && (
          <div className="absolute inset-0 z-0">
            <Image
              src={getImageSrc(bgItem.url)}
              alt="배경"
              fill
              sizes={`${canvasWidth}px`}
              className="object-cover"
              priority={false}
              crossOrigin="anonymous"
              unoptimized
            />
          </div>
        )}

        {config.textElements.map((element) => {
          const isActive = activeElementId === element.id
          return (
            <div
              key={element.id}
              className={`absolute z-10 transition-all ${
                showEditHighlight ? 'cursor-pointer hover:ring-2 hover:ring-penta-blue/50' : ''
              } ${isActive ? 'ring-2 ring-penta-blue' : ''}`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                transform: getTransformByAlign(element.textAlign, element.verticalAlign || 'middle'),
                width: element.id === 'greeting' ? `${element.width ?? 90}%` : element.width ? `${element.width}%` : 'auto',
                fontSize: element.fontSize * scale,
                fontWeight: getFontWeight(element.fontWeight),
                fontFamily: 'Pretendard, sans-serif',
                color: element.color,
                textAlign: element.textAlign,
                whiteSpace: element.multiline ? 'pre-wrap' : 'nowrap',
                wordBreak: 'keep-all',
              }}
              onClick={() => {
                if (showEditHighlight && onElementClick) onElementClick(element.id)
              }}
            >
              {textValues[element.id]}
            </div>
          )
        })}

        {config.logoArea && (
          <div
            className={`absolute z-10 flex items-center transition-all ${
              showEditHighlight && !userEditData.logoUrl
                ? 'border-2 border-dashed border-gray-400 bg-white/30 cursor-pointer hover:ring-2 hover:ring-penta-blue/50'
                : ''
            } ${activeElementId === 'logo' ? 'ring-2 ring-penta-blue' : ''}`}
            style={{
              left: `${config.logoArea.x}%`,
              top: `${config.logoArea.y}%`,
              transform: 'translate(-50%, -50%)',
              width: config.logoArea.width * scale,
              height: config.logoArea.height * scale,
              justifyContent:
                (userEditData.logoAlign ?? 'center') === 'left'
                  ? 'flex-start'
                  : (userEditData.logoAlign ?? 'center') === 'right'
                    ? 'flex-end'
                    : 'center',
            }}
            onClick={() => {
              if (showEditHighlight && onElementClick) onElementClick('logo')
            }}
          >
            {userEditData.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userEditData.logoUrl}
                alt="로고 또는 서명"
                className="object-contain w-full h-full"
                style={{
                  objectPosition:
                    (userEditData.logoAlign ?? 'center') === 'left'
                      ? 'left'
                      : (userEditData.logoAlign ?? 'center') === 'right'
                        ? 'right'
                        : 'center',
                }}
              />
            ) : (
              showEditHighlight && (
                <span className="text-gray-500 text-sm">{config.logoArea.placeholder}</span>
              )
            )}
          </div>
        )}
      </div>
    )
  }
)
