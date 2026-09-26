import { describe, it, expect } from 'vitest'
import { isValidPondiUniEmail, isUserAdmin } from '../lib/auth'

describe('Authentication & Domain Verification (Priority 1)', () => {
  it('should accept valid emails (university and personal)', () => {
    expect(isValidPondiUniEmail('student@pondiuni.ac.in')).toBe(true)
    expect(isValidPondiUniEmail('sayandev@pondiuni.ac.in')).toBe(true)
    expect(isValidPondiUniEmail('scholar.math@pondiuni.ac.in')).toBe(true)
    expect(isValidPondiUniEmail('  FACULTY@PONDIUNI.AC.IN  ')).toBe(true)
    expect(isValidPondiUniEmail('student@gmail.com')).toBe(true)
    expect(isValidPondiUniEmail('user@outlook.com')).toBe(true)
    expect(isValidPondiUniEmail('user@yahoo.co.in')).toBe(true)
    expect(isValidPondiUniEmail('user@hotmail.com')).toBe(true)
    expect(isValidPondiUniEmail('student@annauniv.edu')).toBe(true)
    expect(isValidPondiUniEmail('student@iitm.ac.in')).toBe(true)
    expect(isValidPondiUniEmail('user@harvard.edu')).toBe(true)
  })

  it('should reject invalid or malformed email strings', () => {
    expect(isValidPondiUniEmail('pondiuni.ac.in')).toBe(false)
    expect(isValidPondiUniEmail('user@')).toBe(false)
    expect(isValidPondiUniEmail('@gmail.com')).toBe(false)
    expect(isValidPondiUniEmail('invalid-email')).toBe(false)
    expect(isValidPondiUniEmail('')).toBe(false)
    expect(isValidPondiUniEmail(null)).toBe(false)
    expect(isValidPondiUniEmail(undefined)).toBe(false)
  })

  it('should accurately verify admin privileges', () => {
    expect(isUserAdmin('admin@pondiuni.ac.in', 'user')).toBe(true)
    expect(isUserAdmin('regular@pondiuni.ac.in', 'admin')).toBe(true)
    expect(isUserAdmin('student@pondiuni.ac.in', 'user')).toBe(false)
    expect(isUserAdmin(null, 'user')).toBe(false)
  })
})
