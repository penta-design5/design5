'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { LOGO_ALT } from '@/lib/brand'

interface ThemeLogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function ThemeLogo({ width = 160, height = 40, className, priority = false }: ThemeLogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // mounted 전에는 light 모드 로고를 표시 (hydration mismatch 방지)
  const currentTheme = mounted ? (resolvedTheme || theme) : 'light'
  const logoSrc = currentTheme === 'dark' ? '/img/site_logo_white.svg' : '/img/site_logo.svg'

  return (
    <Image
      src={logoSrc}
      alt={LOGO_ALT}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  )
}

