import { describe, it, expect } from 'vitest'
import {
  getShapeBounds,
  getBlockArrowPoints,
  getCalloutOvalPathData,
  createShape,
  CALLOUT_OVAL_BASE_WIDTH,
  CALLOUT_OVAL_BASE_HEIGHT,
  type Shape,
} from '@/lib/diagram/shapes'

// Konva 비의존 순수 모듈만 import (jsdom에서 안정적으로 테스트 가능)

describe('diagram/shapes', () => {
  describe('getShapeBounds', () => {
    it('rect는 x/y/width/height를 그대로 반환한다', () => {
      const shape: Shape = { id: 'a', type: 'rect', x: 10, y: 20, width: 30, height: 40 }
      expect(getShapeBounds(shape)).toEqual({ x: 10, y: 20, width: 30, height: 40 })
    })

    it('width/height 미지정 rect는 기본 100x100', () => {
      const shape: Shape = { id: 'a', type: 'rect', x: 0, y: 0 }
      expect(getShapeBounds(shape)).toEqual({ x: 0, y: 0, width: 100, height: 100 })
    })

    it('circle은 radius*2 크기, 좌상단은 x/y', () => {
      const shape: Shape = { id: 'a', type: 'circle', x: 5, y: 5, radius: 25 }
      expect(getShapeBounds(shape)).toEqual({ x: 5, y: 5, width: 50, height: 50 })
    })

    it('다각형(star 등)은 중심 기준으로 radius만큼 좌상단을 당긴다', () => {
      const shape: Shape = { id: 'a', type: 'star', x: 100, y: 100, outerRadius: 40 }
      expect(getShapeBounds(shape)).toEqual({ x: 60, y: 60, width: 80, height: 80 })
    })

    it('calloutOval은 중심 기준 + 꼬리 높이를 포함한다', () => {
      const shape: Shape = { id: 'a', type: 'calloutOval', x: 100, y: 100, width: 160, height: 80, tailSize: 12 }
      expect(getShapeBounds(shape)).toEqual({ x: 20, y: 60, width: 160, height: 92 })
    })

    it('arrow는 두 끝점을 감싸는 bbox를 반환한다', () => {
      const shape: Shape = { id: 'a', type: 'arrow', x: 0, y: 0, points: [10, 10, 50, 30] }
      expect(getShapeBounds(shape)).toEqual({ x: 10, y: 10, width: 40, height: 20 })
    })

    it('text는 줄 수에 따라 높이를 계산한다', () => {
      const shape: Shape = { id: 'a', type: 'text', x: 0, y: 0, text: 'a\nb\nc', fontSize: 10, width: 100 }
      const b = getShapeBounds(shape)
      expect(b.width).toBe(100)
      // 3줄 * 10 * 1.2 + 4 = 40
      expect(b.height).toBe(40)
    })
  })

  describe('getBlockArrowPoints', () => {
    it('blockArrowRight는 12개 좌표(6점)를 반환한다', () => {
      const pts = getBlockArrowPoints('blockArrowRight', 80, 20, 40)
      expect(pts).toHaveLength(12)
      // 시작점은 왼쪽 중앙 (0, h/2)
      expect(pts[0]).toBe(0)
      expect(pts[1]).toBe(20)
    })

    it('blockArrowUp의 폭은 headWidth, 높이는 shaft+head', () => {
      const pts = getBlockArrowPoints('blockArrowUp', 80, 20, 40)
      // 끝점 좌표가 폭(40)/높이(100) 범위를 벗어나지 않는다
      const xs = pts.filter((_, i) => i % 2 === 0)
      const ys = pts.filter((_, i) => i % 2 === 1)
      expect(Math.max(...xs)).toBe(40)
      expect(Math.max(...ys)).toBe(100)
    })
  })

  describe('getCalloutOvalPathData', () => {
    it('pathData가 있으면 그대로 반환한다(템플릿 우선)', () => {
      const shape: Shape = { id: 'a', type: 'calloutOval', x: 0, y: 0, pathData: 'M0 0 Z' }
      expect(getCalloutOvalPathData(shape)).toBe('M0 0 Z')
    })

    it('pathData가 없으면 타원+꼬리 경로를 생성한다', () => {
      const shape: Shape = { id: 'a', type: 'calloutOval', x: 0, y: 0, width: 100, height: 60 }
      const d = getCalloutOvalPathData(shape)
      expect(d.startsWith('M')).toBe(true)
      expect(d).toContain('A') // 타원 호
    })
  })

  describe('createShape', () => {
    it('calloutOval은 템플릿 path와 기준 크기를 사용한다', () => {
      const s = createShape('calloutOval', 0, 0)
      expect(s.width).toBe(CALLOUT_OVAL_BASE_WIDTH)
      expect(s.height).toBe(CALLOUT_OVAL_BASE_HEIGHT)
      expect(s.pathData).toBeTruthy()
    })

    it('알 수 없는 타입은 throw한다', () => {
      // @ts-expect-error 의도적으로 잘못된 타입 전달
      expect(() => createShape('unknown', 0, 0)).toThrow()
    })

    it('생성된 도형은 전달한 좌표를 가진다', () => {
      const s = createShape('rect', 12, 34)
      expect(s.x).toBe(12)
      expect(s.y).toBe(34)
      expect(s.id).toMatch(/^shape_/)
    })
  })
})
