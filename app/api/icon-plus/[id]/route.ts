import { NextRequest, NextResponse } from 'next/server'
import { IconPlusCutPosition, IconPlusType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError, NotFoundError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

const cutPositions = new Set<string>(Object.values(IconPlusCutPosition))

/** 마스킹 프리셋 1건의 입력값 (position + 절단 원 + 병합 앵커) */
interface PresetInput {
  position: IconPlusCutPosition
  cutX: number
  cutY: number
  cutRadius: number
  anchorX: number
  anchorY: number
}

function getNumberValue(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

/** 프리셋 배열을 검증한다. position은 enum·중복 불가, 수치는 finite, cutRadius > 0, anchor는 음수 허용 */
function parsePresets(value: unknown): PresetInput[] {
  if (!Array.isArray(value)) {
    throw new BadRequestError('presets는 배열이어야 합니다.')
  }

  const seen = new Set<string>()

  return value.map((raw) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new BadRequestError('프리셋 형식이 올바르지 않습니다.')
    }

    const entry = raw as Record<string, unknown>
    const position = typeof entry.position === 'string' ? entry.position : ''

    if (!cutPositions.has(position)) {
      throw new BadRequestError('유효하지 않은 마스킹 위치입니다.')
    }
    if (seen.has(position)) {
      throw new BadRequestError('같은 마스킹 위치의 프리셋이 중복되었습니다.')
    }
    seen.add(position)

    const cutX = getNumberValue(entry.cutX)
    const cutY = getNumberValue(entry.cutY)
    const cutRadius = getNumberValue(entry.cutRadius)
    // 앵커는 아이콘 밖으로 오버플로할 수 있어 음수를 허용한다(우측 상단 프리셋 등).
    const anchorX = getNumberValue(entry.anchorX)
    const anchorY = getNumberValue(entry.anchorY)

    if (cutX === null || cutY === null || cutRadius === null || anchorX === null || anchorY === null) {
      throw new BadRequestError('프리셋 좌표는 모두 숫자여야 합니다.')
    }
    if (cutRadius <= 0) {
      throw new BadRequestError('절단 원 반경은 0보다 커야 합니다.')
    }

    return {
      position: position as IconPlusCutPosition,
      cutX,
      cutY,
      cutRadius,
      anchorX,
      anchorY,
    }
  })
}

/**
 * PATCH /api/icon-plus/[id] — MAIN 아이콘 수정. 관리자 전용.
 * - `presets`: 마스킹 프리셋 **전체 교체**(배열에서 빠진 위치는 삭제 = 초기화). 키가 없으면 프리셋을 건드리지 않는다.
 * - `anchorX`/`anchorY`: legacy pre-cut 아이콘 anchor 수정(하위호환).
 */
export const PATCH = withRouteHandler(async (request: NextRequest, { params }: RouteParams) => {
  await requireAdmin()
  const { id } = await params

  const payload = (await request.json().catch(() => ({}))) as {
    presets?: unknown
    anchorX?: unknown
    anchorY?: unknown
  }

  const hasPresets = 'presets' in payload && payload.presets !== undefined
  const presets = hasPresets ? parsePresets(payload.presets) : null

  const hasAnchor = payload.anchorX !== undefined || payload.anchorY !== undefined
  const anchorX = getNumberValue(payload.anchorX)
  const anchorY = getNumberValue(payload.anchorY)

  if (hasAnchor && (anchorX === null || anchorY === null)) {
    throw new BadRequestError('anchorX와 anchorY는 숫자여야 합니다.')
  }
  if (!hasPresets && !hasAnchor) {
    throw new BadRequestError('수정할 내용이 없습니다.')
  }

  // MAIN 타입만 수정 대상
  const resource = await prisma.iconPlusResource.findFirst({
    where: { id, type: IconPlusType.MAIN },
    select: { id: true },
  })

  if (!resource) {
    throw new NotFoundError('메인 아이콘을 찾을 수 없습니다.')
  }

  await prisma.$transaction(async (tx) => {
    if (presets) {
      // 전체 교체: 기존 프리셋을 지우고 전달된 배열로 다시 만든다.
      await tx.iconPlusMainPreset.deleteMany({ where: { resourceId: resource.id } })
      if (presets.length > 0) {
        await tx.iconPlusMainPreset.createMany({
          data: presets.map((preset) => ({ ...preset, resourceId: resource.id })),
        })
      }
    }

    if (hasAnchor && anchorX !== null && anchorY !== null) {
      await tx.iconPlusResource.update({
        where: { id: resource.id },
        data: { anchorX, anchorY },
      })
    }
  })

  const updated = await prisma.iconPlusMainPreset.findMany({
    where: { resourceId: resource.id },
  })

  return NextResponse.json({ ok: true, presets: updated })
}, '메인 아이콘 설정을 수정하는 중 오류가 발생했습니다.')
