/**
 * SVG 업로드 전처리 유틸리티 (ICON+)
 *
 * 업로드된 SVG를 서버에서 검증(확장자/MIME/크기) → sanitize(위험 태그·속성·외부 URL 제거)
 * → normalize(viewBox/width/height 메타데이터 추출 및 루트 태그 정규화)한다.
 *
 * icon-merger `src/lib/svg/process-svg.ts` 이식본.
 * - 의존성: `sanitize-html`, `fast-xml-parser` (P0에서 추가)
 * - 에러: `SvgProcessingError`를 Design5 `BadRequestError`로 통합 → withRouteHandler/errorResponse에서
 *   자동으로 400 + 메시지로 매핑된다.
 */
import sanitizeHtml from 'sanitize-html'
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { BadRequestError } from '@/lib/api/errors'

export const MAX_SVG_FILE_SIZE = 256 * 1024

const allowedSvgTags = [
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'clipPath',
  'mask',
  'linearGradient',
  'radialGradient',
  'stop',
  'title',
  'desc',
]

const allowedSvgAttributes = [
  'aria-hidden',
  'aria-label',
  'class',
  'clip-path',
  'clip-rule',
  'cx',
  'cy',
  'd',
  'dx',
  'dy',
  'fill',
  'fill-opacity',
  'fill-rule',
  'font-family',
  'font-size',
  'height',
  'id',
  'mask',
  'offset',
  'opacity',
  'points',
  'r',
  'role',
  'rx',
  'ry',
  'stroke',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'transform',
  'viewBox',
  'width',
  'x',
  'x1',
  'x2',
  'y',
  'y1',
  'y2',
]

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
})

type ProcessSvgInput = {
  file: File
}

export type ProcessedSvg = {
  name: string
  svgContent: string
  viewBox: string
  width: number
  height: number
}

/** SVG 전처리 실패 에러. BadRequestError(400)를 상속하여 표준 에러 응답으로 매핑된다. */
export class SvgProcessingError extends BadRequestError {
  constructor(message: string) {
    super(message)
  }
}

export async function processSvgFile({ file }: ProcessSvgInput): Promise<ProcessedSvg> {
  validateSvgFile(file)

  const rawSvg = await file.text()
  return sanitizeAndNormalizeSvg(rawSvg, file.name)
}

/**
 * 파일 레벨 검증(MIME/크기/확장자) 없이 SVG **문자열**을 검증(XML)·sanitize·normalize한다.
 *
 * ICON+ 탭은 SVG를 DB(`IconPlusResource.svgContent`)에 저장하지만,
 * ICON 탭은 파일을 MinIO에 저장(Post/URL 모델)한다. 저장 모델이 달라도
 * "self-closing 태그 제거·XML 보장·루트 정규화"는 동일하게 필요하므로 이 코어를 공유한다.
 * (ICON 탭 업로드는 자체 크기/타입 검증을 별도로 수행하므로 여기서는 파일 검증을 제외한다.)
 *
 * @param rawSvg SVG 원본 문자열
 * @param fileName 이름 정규화에 쓸 파일명
 */
export function sanitizeAndNormalizeSvg(rawSvg: string, fileName: string): ProcessedSvg {
  const validationResult = XMLValidator.validate(rawSvg)

  if (validationResult !== true) {
    throw new SvgProcessingError('XML로 파싱할 수 없는 SVG입니다.')
  }

  const parsed = parser.parse(rawSvg) as { svg?: Record<string, unknown> }

  if (!parsed.svg) {
    throw new SvgProcessingError('루트 요소가 svg인 파일만 업로드할 수 있습니다.')
  }

  const sanitizedSvg = sanitizeSvg(rawSvg)
  const metadata = extractSvgMetadata(sanitizedSvg)

  return {
    name: normalizeFileName(fileName),
    svgContent: normalizeSvgRoot(sanitizedSvg, metadata),
    ...metadata,
  }
}

function validateSvgFile(file: File) {
  const fileName = file.name.toLowerCase()

  if (!fileName.endsWith('.svg')) {
    throw new SvgProcessingError('SVG 확장자 파일만 업로드할 수 있습니다.')
  }

  if (file.type !== 'image/svg+xml') {
    throw new SvgProcessingError('MIME 타입이 image/svg+xml인 파일만 업로드할 수 있습니다.')
  }

  if (file.size > MAX_SVG_FILE_SIZE) {
    throw new SvgProcessingError('SVG 파일은 256KB 이하만 업로드할 수 있습니다.')
  }
}

function sanitizeSvg(rawSvg: string) {
  const sanitizedSvg = sanitizeHtml(rawSvg, {
    allowedTags: allowedSvgTags,
    allowedAttributes: {
      '*': allowedSvgAttributes,
    },
    allowedSchemes: [],
    disallowedTagsMode: 'discard',
    parser: {
      lowerCaseAttributeNames: false,
      lowerCaseTags: false,
    },
  }).trim()

  if (!sanitizedSvg.startsWith('<svg')) {
    throw new SvgProcessingError('sanitize 후 유효한 SVG가 남아있지 않습니다.')
  }

  if (containsExternalReference(sanitizedSvg)) {
    throw new SvgProcessingError('외부 URL 또는 JavaScript 참조가 포함된 SVG는 업로드할 수 없습니다.')
  }

  return sanitizedSvg
}

function extractSvgMetadata(svg: string) {
  const openingSvgTag = svg.match(/<svg\b[^>]*>/i)?.[0]

  if (!openingSvgTag) {
    throw new SvgProcessingError('SVG 루트 태그를 찾을 수 없습니다.')
  }

  const viewBox = getAttribute(openingSvgTag, 'viewBox')
  const width = parseSvgLength(getAttribute(openingSvgTag, 'width'))
  const height = parseSvgLength(getAttribute(openingSvgTag, 'height'))

  if (viewBox) {
    const values = parseViewBox(viewBox)

    return {
      viewBox: values.join(' '),
      width: values[2],
      height: values[3],
    }
  }

  if (width === null || height === null) {
    throw new SvgProcessingError('viewBox가 없으면 width와 height가 필요합니다.')
  }

  return {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
  }
}

function normalizeSvgRoot(
  svg: string,
  metadata: Pick<ProcessedSvg, 'viewBox' | 'width' | 'height'>
) {
  const openingSvgTag = svg.match(/<svg\b[^>]*>/i)?.[0]

  if (!openingSvgTag) {
    throw new SvgProcessingError('SVG 루트 태그를 찾을 수 없습니다.')
  }

  const normalizedOpeningTag = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${metadata.viewBox}" width="${metadata.width}" height="${metadata.height}">`

  return svg.replace(openingSvgTag, normalizedOpeningTag)
}

function containsExternalReference(svg: string) {
  return /(?:javascript:|https?:\/\/|url\(\s*['"]?https?:\/\/)/i.test(svg)
}

function getAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\s${name}=["']([^"']+)["']`, 'i'))

  return match?.[1] ?? null
}

function parseViewBox(viewBox: string) {
  const values = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number)

  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    throw new SvgProcessingError('viewBox 값이 올바르지 않습니다.')
  }

  if (values[2] <= 0 || values[3] <= 0) {
    throw new SvgProcessingError('viewBox 너비와 높이는 0보다 커야 합니다.')
  }

  return values
}

function parseSvgLength(value: string | null) {
  if (!value) {
    return null
  }

  const match = value.trim().match(/^(\d+(?:\.\d+)?)(?:px)?$/i)

  if (!match) {
    return null
  }

  return Number(match[1])
}

function normalizeFileName(fileName: string) {
  return fileName.replace(/\.svg$/i, '').trim() || 'Untitled'
}
