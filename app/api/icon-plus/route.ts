import { NextResponse } from 'next/server'
import { IconPlusType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth-helpers'
import { withRouteHandler } from '@/lib/api/with-route-handler'
import { BadRequestError } from '@/lib/api/errors'
import { processSvgFile } from '@/lib/svg/process-svg'

export const dynamic = 'force-dynamic'

const iconPlusTypes = new Set<string>(Object.values(IconPlusType))

/**
 * 쿼리/폼의 type 값을 IconPlusType으로 해석한다.
 * - null/빈 값 → null (타입 필터 없음)
 * - 유효하지 않은 값 → undefined (400 처리용)
 */
function parseIconPlusType(value: string | null): IconPlusType | null | undefined {
  if (!value) return null
  const normalized = value.toUpperCase()
  if (!iconPlusTypes.has(normalized)) return undefined
  return normalized as IconPlusType
}

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : null
}

function getNumberValue(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function isFile(value: FormDataEntryValue): value is File {
  return value instanceof File
}

/** GET /api/icon-plus?type=MAIN|MERGE_ICON|MERGE_TEXT — 공용 라이브러리 타입별 조회 (로그인 사용자) */
export const GET = withRouteHandler(async (request: Request) => {
  await requireAuth()

  const url = new URL(request.url)
  const type = parseIconPlusType(url.searchParams.get('type'))

  if (type === undefined) {
    throw new BadRequestError('유효하지 않은 아이콘 타입입니다.')
  }

  // presets는 MAIN 전용이지만 MERGE_*는 빈 배열이 되어 무해하므로 타입 분기 없이 항상 포함한다.
  const resources = await prisma.iconPlusResource.findMany({
    where: type ? { type } : {},
    orderBy: { createdAt: 'desc' },
    include: { presets: true },
  })

  return NextResponse.json({ resources })
}, 'ICON+ 리소스를 불러오는 중 오류가 발생했습니다.')

/**
 * POST /api/icon-plus — SVG 업로드(검증·sanitize·normalize·DB 저장). 관리자 전용.
 * MAIN은 파일 1개 제한만 있고 anchor는 필수가 아니다(마스킹 프리셋에서 위치별로 설정).
 * anchorX/anchorY가 전달되면 legacy pre-cut 아이콘용으로 그대로 저장한다.
 */
export const POST = withRouteHandler(async (request: Request) => {
  const admin = await requireAdmin()

  const formData = await request.formData()
  const type = parseIconPlusType(getStringValue(formData.get('type')))
  const files = formData.getAll('files').filter(isFile)

  if (!type) {
    throw new BadRequestError('유효하지 않은 아이콘 타입입니다.')
  }

  if (files.length === 0) {
    throw new BadRequestError('업로드할 SVG 파일을 선택해 주세요.')
  }

  if (type === IconPlusType.MAIN && files.length !== 1) {
    throw new BadRequestError('메인 아이콘은 한 번에 1개만 업로드할 수 있습니다.')
  }

  const anchorX = getNumberValue(formData.get('anchorX'))
  const anchorY = getNumberValue(formData.get('anchorY'))

  // processSvgFile은 SvgProcessingError(=BadRequestError)를 던질 수 있음 → withRouteHandler에서 400 처리
  const processedSvgs = await Promise.all(files.map((file) => processSvgFile({ file })))

  const isMain = type === IconPlusType.MAIN
  const resources = await prisma.$transaction(
    processedSvgs.map((svg) =>
      prisma.iconPlusResource.create({
        data: {
          authorId: admin.id,
          type,
          name: svg.name,
          svgContent: svg.svgContent,
          viewBox: svg.viewBox,
          width: svg.width,
          height: svg.height,
          baseWidth: isMain ? svg.width : null,
          baseHeight: isMain ? svg.height : null,
          anchorX: isMain ? anchorX : null,
          anchorY: isMain ? anchorY : null,
        },
      })
    )
  )

  return NextResponse.json({ resources }, { status: 201 })
}, 'ICON+ 리소스를 업로드하는 중 오류가 발생했습니다.')

/** DELETE /api/icon-plus — id 배열 일괄 삭제. 관리자 전용 */
export const DELETE = withRouteHandler(async (request: Request) => {
  await requireAdmin()

  const payload = (await request.json().catch(() => ({}))) as { ids?: unknown }
  const ids = Array.isArray(payload.ids)
    ? payload.ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : []

  if (ids.length === 0) {
    throw new BadRequestError('삭제할 리소스를 선택해 주세요.')
  }

  const result = await prisma.iconPlusResource.deleteMany({
    where: { id: { in: ids } },
  })

  return NextResponse.json({ deletedCount: result.count })
}, 'ICON+ 리소스를 삭제하는 중 오류가 발생했습니다.')
