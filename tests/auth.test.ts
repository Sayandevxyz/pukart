import { describe, it, expect } from 'vitest'
import { isValidPondiUniEmail, isUserAdmin } from '../lib/auth'

describe('Authentication & Domain Verification (Priority 1)', () => {
  it('should accept valid official Pondicherry University emails', () => {
    expect(isValidPondiUniEmail('student@pondiuni.ac.in')).toBe(true)
    expect(isValidPondiUniEmail('sayandev@pondiuni.ac.in')).toBe(true)
    expect(isValidPondiUniEmail('scholar.math@pondiuni.ac.in')).toBe(true)
    expect(isValidPondiUniEmail('  FACULTY@PONDIUNI.AC.IN  ')).toBe(true)
  })

  it('should strictly reject commercial email providers (Gmail, Outlook, Yahoo)', () => {
    expect(isValidPondiUniEmail('student@gmail.com')).toBe(false)
    expect(isValidPondiUniEmail('user@outlook.com')).toBe(false)
    expect(isValidPondiUniEmail('user@yahoo.co.in')).toBe(false)
    expect(isValidPondiUniEmail('user@hotmail.com')).toBe(false)
  })

  it('should reject other universities and institutional domains', () => {
    expect(isValidPondiUniEmail('student@annauniv.edu')).toBe(false)
    expect(isValidPondiUniEmail('student@iitm.ac.in')).toBe(false)
    expect(isValidPondiUniEmail('user@harvard.edu')).toBe(false)
  })

  it('should strictly reject subdomain and lookalike domain bypass attempts', () => {
    expect(isValidPondiUniEmail('user@pondiuni.ac.in.attacker.com')).toBe(false)
    expect(isValidPondiUniEmail('user@evil-pondiuni.ac.in')).toBe(false)
    expect(isValidPondiUniEmail('user@pondiuni.ac.in@evil.com')).toBe(false)
    expect(isValidPondiUniEmail('user@sub.pondiuni.ac.in')).toBe(false)
    expect(isValidPondiUniEmail('pondiuni.ac.in')).toBe(false)
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
