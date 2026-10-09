import { describe, it, expect, vi } from 'vitest'
import { isUserAdmin } from '../lib/auth'
import { checkProfileCompletion } from '../lib/constants/campus'
import { sanitizeText } from '../lib/utils'
import { checkRateLimit, resetRateLimit } from '../lib/rate-limit'

describe('Security & Authorization Boundary Tests', () => {
  describe('Input Sanitization & Length Boundaries', () => {

    it('should prevent empty or whitespace-only inputs', () => {
      expect(() => sanitizeText('   ', 1, 100)).toThrow()
      expect(() => sanitizeText('', 1, 100)).toThrow()
    })

    it('should enforce strict max character limits to prevent DB payload bloating', () => {
      const longInput = 'a'.repeat(5001)
      expect(() => sanitizeText(longInput, 1, 5000)).toThrow('Text must be between 1 and 5000 characters')
    })

    it('should reject non-string inputs', () => {
      expect(() => sanitizeText(12345, 1, 50)).toThrow('Invalid text format')
      expect(() => sanitizeText(null, 1, 50)).toThrow('Invalid text format')
      expect(() => sanitizeText(undefined, 1, 50)).toThrow('Invalid text format')
      expect(() => sanitizeText({}, 1, 50)).toThrow('Invalid text format')
    })

    it('should properly clean safe valid text with trimming', () => {
      expect(sanitizeText('  Calculus Textbook 9th Edition  ', 3, 100)).toBe('Calculus Textbook 9th Edition')
    })

    it('should strip dangerous HTML tags and scripts to prevent stored XSS attacks', () => {
      expect(sanitizeText('<script>alert("xss")</script>Calculus Book', 3, 100)).toBe('Calculus Book')
      expect(sanitizeText('<b>Bold</b> <img src=x onerror=alert(1)> description', 3, 100)).toBe('Bold  description')
    })
  })

  describe('Price Boundaries & Integer Defenses', () => {
    function validateListingPrice(price: unknown): boolean {
      return typeof price === 'number' && Number.isInteger(price) && price > 0 && price <= 10000000
    }

    it('should reject negative, zero, or floating-point price values', () => {
      expect(validateListingPrice(-100)).toBe(false)
      expect(validateListingPrice(0)).toBe(false)
      expect(validateListingPrice(49.99)).toBe(false)
      expect(validateListingPrice(NaN)).toBe(false)
      expect(validateListingPrice(Infinity)).toBe(false)
    })

    it('should reject non-numeric price representations', () => {
      expect(validateListingPrice('500')).toBe(false)
      expect(validateListingPrice(null)).toBe(false)
      expect(validateListingPrice(undefined)).toBe(false)
    })

    it('should enforce reasonable campus ceiling of ₹10,000,000', () => {
      expect(validateListingPrice(10000000)).toBe(true)
      expect(validateListingPrice(10000001)).toBe(false)
    })
  })

  describe('IDOR & Transaction Role Authorization', () => {
    interface TransactionRecord {
      id: number
      listingId: number
      buyerId: string
      sellerId: string
      status: string
    }

    function canModifyTransaction(tx: TransactionRecord, userId: string, action: 'accept' | 'complete' | 'cancel'): boolean {
      if (action === 'accept') {
        
        return tx.sellerId === userId && ['requested', 'inquiry', 'negotiating'].includes(tx.status)
      }
      if (action === 'complete') {
        
        return (tx.sellerId === userId || tx.buyerId === userId) && tx.status === 'accepted'
      }
      if (action === 'cancel') {
        
        return (tx.sellerId === userId || tx.buyerId === userId) && !['completed', 'rejected', 'cancelled'].includes(tx.status)
      }
      return false
    }

    const sampleTx: TransactionRecord = {
      id: 10,
      listingId: 5,
      buyerId: 'student_buyer_1',
      sellerId: 'student_seller_2',
      status: 'requested',
    }

    it('should prevent buyer from accepting their own purchase request', () => {
      expect(canModifyTransaction(sampleTx, 'student_buyer_1', 'accept')).toBe(false)
    })

    it('should allow seller to accept the request', () => {
      expect(canModifyTransaction(sampleTx, 'student_seller_2', 'accept')).toBe(true)
    })

    it('should prevent third-party users from modifying the transaction', () => {
      expect(canModifyTransaction(sampleTx, 'random_intruder', 'accept')).toBe(false)
      expect(canModifyTransaction(sampleTx, 'random_intruder', 'cancel')).toBe(false)
      expect(canModifyTransaction(sampleTx, 'random_intruder', 'complete')).toBe(false)
    })

    it('should prevent completing transactions that were not accepted first', () => {
      expect(canModifyTransaction(sampleTx, 'student_seller_2', 'complete')).toBe(false)
    })

    it('should allow completing transactions once accepted', () => {
      const acceptedTx: TransactionRecord = { ...sampleTx, status: 'accepted' }
      expect(canModifyTransaction(acceptedTx, 'student_seller_2', 'complete')).toBe(true)
      expect(canModifyTransaction(acceptedTx, 'student_buyer_1', 'complete')).toBe(true)
    })
  })

  describe('Self-Dealing Prevention', () => {
    function canInitiateBuyOrOffer(listingOwnerId: string, currentUserId: string): boolean {
      return listingOwnerId !== currentUserId
    }

    it('should prevent user from buying or making an offer on their own listing', () => {
      expect(canInitiateBuyOrOffer('user_abc', 'user_abc')).toBe(false)
    })

    it('should allow another user to buy or offer', () => {
      expect(canInitiateBuyOrOffer('user_abc', 'user_xyz')).toBe(true)
    })
  })

  describe('Admin Privilege Guard', () => {
    it('should grant admin rights if role is explicitly admin', () => {
      expect(isUserAdmin('someone@pondiuni.ac.in', 'admin')).toBe(true)
    })

    it('should deny admin rights to normal users unless configured in admin emails', () => {
      expect(isUserAdmin('student@pondiuni.ac.in', 'user')).toBe(false)
      expect(isUserAdmin('admin@pondiuni.ac.in', 'user')).toBe(true) 
    })

    it('should deny admin rights when email is null or missing', () => {
      expect(isUserAdmin(null, 'user')).toBe(false)
      expect(isUserAdmin(undefined, undefined)).toBe(false)
    })
  })

  describe('Profile Gate for Campus Marketplace', () => {
    it('should block listing creation if hostel or department is missing', () => {
      const check = checkProfileCompletion({
        department: '',
        course: 'M.Sc Physics',
        year: 1,
        hostel: '',
      })
      expect(check.isComplete).toBe(false)
      expect(check.missingFields).toContain('Department / School')
      expect(check.missingFields).toContain('Campus Hostel')
    })
  })

  describe('Rate Limiting Defenses', () => {
    it('should allow requests within threshold and block burst requests exceeding limit', () => {
      const testKey = 'test-ip-rate-limit-1'
      resetRateLimit(testKey)
      for (let i = 0; i < 5; i++) {
        const res = checkRateLimit(testKey, 5, 60000)
        expect(res.success).toBe(true)
      }
      const blocked = checkRateLimit(testKey, 5, 60000)
      expect(blocked.success).toBe(false)
      expect(blocked.remaining).toBe(0)
      expect(blocked.retryAfter).toBeGreaterThan(0)
    })

    it('should track exact boundary conditions (quota decrement and retryAfter)', () => {
      const testKey = 'test-ip-rate-boundary'
      resetRateLimit(testKey)

      const first = checkRateLimit(testKey, 3, 60000)
      expect(first.success).toBe(true)
      expect(first.remaining).toBe(2)
      expect(first.retryAfter).toBe(0)

      const second = checkRateLimit(testKey, 3, 60000)
      expect(second.success).toBe(true)
      expect(second.remaining).toBe(1)

      const third = checkRateLimit(testKey, 3, 60000)
      expect(third.success).toBe(true)
      expect(third.remaining).toBe(0)

      const fourth = checkRateLimit(testKey, 3, 60000)
      expect(fourth.success).toBe(false)
      expect(fourth.remaining).toBe(0)
      expect(fourth.retryAfter).toBeGreaterThanOrEqual(1)
      expect(fourth.retryAfter).toBeLessThanOrEqual(60)
    })

    it('should reset limit after window expiry', async () => {
      const testKey = 'test-ip-rate-expiry'
      resetRateLimit(testKey)

      // 100ms window
      const res1 = checkRateLimit(testKey, 1, 100)
      expect(res1.success).toBe(true)

      const resBlocked = checkRateLimit(testKey, 1, 100)
      expect(resBlocked.success).toBe(false)

      // Wait for window to expire
      await new Promise((r) => setTimeout(r, 120))

      const resAfterExpiry = checkRateLimit(testKey, 1, 100)
      expect(resAfterExpiry.success).toBe(true)
      expect(resAfterExpiry.remaining).toBe(0)
    })

    it('should allow immediate manual reset of identifier', () => {
      const testKey = 'test-ip-manual-reset'
      resetRateLimit(testKey)

      checkRateLimit(testKey, 1, 60000)
      expect(checkRateLimit(testKey, 1, 60000).success).toBe(false)

      resetRateLimit(testKey)
      expect(checkRateLimit(testKey, 1, 60000).success).toBe(true)
    })

    it('should support UpstashRateLimiterStore with REST API and fallback', async () => {
      const { UpstashRateLimiterStore } = await import('../lib/rate-limit')

      // Without credentials, falls back gracefully to in-memory
      const emptyStore = new UpstashRateLimiterStore('', '')
      const resFallback = await emptyStore.check('upstash-fallback-key', 2, 60000)
      expect(resFallback.success).toBe(true)

      // Mock Upstash REST responses
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ result: 1 }, { result: 50000 }],
      })
      const originalFetch = globalThis.fetch
      globalThis.fetch = mockFetch

      try {
        const upstashStore = new UpstashRateLimiterStore('https://mock.upstash.io', 'token_123')
        const upstashRes = await upstashStore.check('upstash-key-1', 5, 60000)
        expect(upstashRes.success).toBe(true)
        expect(upstashRes.remaining).toBe(4)

        // Blocked test
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [{ result: 10 }, { result: 45000 }],
        })
        const blockedRes = await upstashStore.check('upstash-key-1', 5, 60000)
        expect(blockedRes.success).toBe(false)
        expect(blockedRes.remaining).toBe(0)
        expect(blockedRes.retryAfter).toBe(45)
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('should correctly select stores in getActiveStore', async () => {
      const { getActiveStore, UpstashRateLimiterStore, DatabaseRateLimiterStore, MemoryRateLimiterStore } =
        await import('../lib/rate-limit')

      const origEnv = { ...process.env }
      try {
        // In test, defaults to MemoryRateLimiterStore
        Reflect.set(process.env, 'NODE_ENV', 'test')
        expect(getActiveStore()).toBeInstanceOf(MemoryRateLimiterStore)

        // In production with Upstash credentials
        Reflect.set(process.env, 'NODE_ENV', 'production')
        process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io'
        process.env.UPSTASH_REDIS_REST_TOKEN = 'secret'
        expect(getActiveStore()).toBeInstanceOf(UpstashRateLimiterStore)

        // In production without Upstash but with DATABASE_URL
        delete process.env.UPSTASH_REDIS_REST_URL
        delete process.env.UPSTASH_REDIS_REST_TOKEN
        process.env.DATABASE_URL = 'postgres://localhost/test'
        expect(getActiveStore()).toBeInstanceOf(DatabaseRateLimiterStore)
      } finally {
        process.env = origEnv
      }
    })
  })
})
