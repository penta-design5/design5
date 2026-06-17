/**
 * SVG 유틸리티 (배럴)
 *
 * 구현은 focused 모듈로 분리됨 (Phase 3):
 *  - 색상:        ./svg/color
 *  - 크기:        ./svg/resize
 *  - stroke:      ./svg/stroke
 *  - 복합 속성:   ./svg/properties
 *
 * 신규 코드는 위 모듈에서 직접 import하는 것을 권장합니다.
 * 기존 import 경로(`@/lib/svg-utils`) 호환을 위해 이 배럴을 유지합니다.
 */

export {
  changeSvgColors,
  changeSvgColor,
  changeCiColorSet,
  changeAllSvgColors,
  extractColors,
} from './svg/color'

export { resizeSvg } from './svg/resize'

export { changeSvgStrokeWidth, stripSvgStrokeDash } from './svg/stroke'

export { changeIconSvgProperties } from './svg/properties'
