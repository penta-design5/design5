import { describe, it, expect } from 'vitest'
import {
  isPentaEmail,
  isPrivilegedLoginSettingsEmail,
  canAccessDesignSystem,
  PENTA_EMAIL_DOMAIN,
  PRIVILEGED_LOGIN_SETTINGS_EMAIL,
} from '@/lib/access-control'

describe('access-control', () => {
  describe('isPentaEmail', () => {
    it('펜타시큐리티 도메인을 허용한다 (대소문자 무시)', () => {
      expect(isPentaEmail('user@pentasecurity.com')).toBe(true)
      expect(isPentaEmail('USER@PentaSecurity.COM')).toBe(true)
    })
    it('다른 도메인은 거부한다', () => {
      expect(isPentaEmail('user@gmail.com')).toBe(false)
      expect(isPentaEmail('user@pentasecurity.com.evil.com')).toBe(false)
    })
    it('null/undefined/빈 문자열은 false', () => {
      expect(isPentaEmail(null)).toBe(false)
      expect(isPentaEmail(undefined)).toBe(false)
      expect(isPentaEmail('')).toBe(false)
    })
    it('도메인 상수와 일치한다', () => {
      expect(PENTA_EMAIL_DOMAIN).toBe('@pentasecurity.com')
    })
  })

  describe('isPrivilegedLoginSettingsEmail', () => {
    it('지정 계정만 true (대소문자 무시)', () => {
      expect(isPrivilegedLoginSettingsEmail(PRIVILEGED_LOGIN_SETTINGS_EMAIL)).toBe(
        true
      )
      expect(isPrivilegedLoginSettingsEmail('TIPER@pentasecurity.com')).toBe(true)
    })
    it('다른 계정은 false', () => {
      expect(isPrivilegedLoginSettingsEmail('other@pentasecurity.com')).toBe(
        false
      )
      expect(isPrivilegedLoginSettingsEmail(null)).toBe(false)
    })
  })

  describe('canAccessDesignSystem', () => {
    it('허용 목록 계정은 true (대소문자 무시)', () => {
      expect(canAccessDesignSystem('tiper@pentasecurity.com')).toBe(true)
      expect(canAccessDesignSystem('Tiper@Pentasecurity.com')).toBe(true)
    })
    it('미허용 계정/빈 값은 false', () => {
      expect(canAccessDesignSystem('other@pentasecurity.com')).toBe(false)
      expect(canAccessDesignSystem(null)).toBe(false)
      expect(canAccessDesignSystem(undefined)).toBe(false)
    })
  })
})
