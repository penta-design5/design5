import { describe, it, expect } from 'vitest'
import { HARDWARE_TYPES, HARDWARE_FILTERS } from '@/lib/hardware-schemas'

describe('hardware-schemas', () => {
  it('제품 타입 목록을 노출한다', () => {
    expect(HARDWARE_TYPES).toEqual(['WAPPLES', 'D.AMO', 'iSIGN'])
  })

  it('필터는 ALL + 모든 제품 타입이다', () => {
    expect(HARDWARE_FILTERS).toEqual(['ALL', 'WAPPLES', 'D.AMO', 'iSIGN'])
  })
})
