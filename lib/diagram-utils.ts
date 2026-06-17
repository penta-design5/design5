/**
 * 다이어그램 유틸리티 (배럴)
 *
 * 구현은 focused 모듈로 분리됨 (Phase 3):
 *  - 도형 모델·기하·팩토리 (순수): ./diagram/shapes
 *  - Konva/DOM 렌더링·다운로드:    ./diagram/render
 *  - SVG/PPTX 내보내기:            ./diagram/export
 *
 * 순수 기하만 필요하면 ./diagram/shapes에서 직접 import하면 konva/pptxgenjs 로딩을 피할 수 있습니다.
 * 기존 import 경로(`@/lib/diagram-utils`) 호환을 위해 이 배럴을 유지합니다.
 */

export type { ShapeType, DiagramTool, Shape, Bounds } from './diagram/shapes'

export {
  getShapeBounds,
  getCalloutRectPathData,
  getCalloutOvalPathData,
  getBlockArrowPoints,
  CALLOUT_OVAL_PATH_TEMPLATE,
  CALLOUT_OVAL_BASE_WIDTH,
  CALLOUT_OVAL_BASE_HEIGHT,
  generateId,
  createShape,
} from './diagram/shapes'

export {
  exportToPNG,
  exportToJPG,
  generateThumbnailDataUrl,
  downloadBlob,
} from './diagram/render'

export { exportToSVG, exportToPPTX } from './diagram/export'
