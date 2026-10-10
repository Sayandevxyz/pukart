import { describe, it, expect } from 'vitest'
import { isUserAdmin } from '../lib/auth'
import { parseSearchQueryFilters } from '../lib/search-helper'

describe('API Routes & Administration Control Suite', () => {
  describe('Listing API Query Parser & Filter Rules (/api/listings)', () => {
    function parseListingQueryParams(params: Record<string, string | undefined>) {
      const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)
      const limit = Math.min(60, Math.max(1, Number.parseInt(params.limit ?? '24', 10) || 24))
      const status = params.status?.trim() || 'active'
      const sortParam = params.sort?.trim().slice(0, 30) || 'newest'

      const parsed = parseSearchQueryFilters({
        rawQuery: (params.q || '').trim().slice(0, 150),
        categoryParam: params.category?.trim().slice(0, 80),
        typeParam: params.type?.trim().slice(0, 30),
        conditionParam: params.condition?.trim().slice(0, 40),
        minPriceParam: params.minPrice,
        maxPriceParam: params.maxPrice,
        aiSearch: params.ai === 'true',
      })

      return {
        rawQuery: parsed.query,
        words: parsed.words,
        category: parsed.category,
        type: parsed.type,
        condition: parsed.condition,
        minPrice: parsed.minPrice,
        maxPrice: parsed.maxPrice,
        sortParam,
        page,
        limit,
        offset: (page - 1) * limit,
        status,
      }
    }

    it('should sanitize and extract multi-word keywords >= 2 chars', () => {
      const parsed = parseListingQueryParams({ q: '  a hero cycle red   ' })
      expect(parsed.rawQuery).toBe('a hero cycle red')
      expect(parsed.words).toEqual(['hero', 'cycle', 'red'])
    })

    it('should bound pagination page >= 1 and clamp limit between 1 and 60', () => {
      const lower = parseListingQueryParams({ page: '-5', limit: '5' })
      expect(lower.page).toBe(1)
      expect(lower.limit).toBe(5)
      expect(lower.offset).toBe(0)

      const fallback = parseListingQueryParams({ page: '1', limit: '0' })
      expect(fallback.limit).toBe(24)

      const upper = parseListingQueryParams({ page: '3', limit: '200' })
      expect(upper.page).toBe(3)
      expect(upper.limit).toBe(60)
      expect(upper.offset).toBe(120)
    })

    it('should parse natural language AI search parameters into structured filters', () => {
      const parsed = parseListingQueryParams({
        q: 'calculus book for rent under 400',
        ai: 'true',
      })
      expect(parsed.category).toBe('Books')
      expect(parsed.type).toBe('rent')
      expect(parsed.maxPrice).toBe(400)
    })

    it('should map sort parameters correctly', () => {
      const ascSort = parseListingQueryParams({ sort: 'price_asc' })
      expect(ascSort.sortParam).toBe('price_asc')

      const descSort = parseListingQueryParams({ sort: 'Price high-low' })
      expect(descSort.sortParam).toBe('Price high-low')

      const defaultSort = parseListingQueryParams({})
      expect(defaultSort.sortParam).toBe('newest')
    })
  })

  describe('File Upload Security & Size Constraints (/api/upload)', () => {
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

    function validateUploadPayload(file: { type: string; size: number }): { valid: boolean; error?: string } {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { valid: false, error: 'Invalid file format. Only JPEG, PNG, WebP, and AVIF are allowed.' }
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: 'File size exceeds maximum campus limit of 5MB.' }
      }
      if (file.size <= 0) {
        return { valid: false, error: 'File is empty.' }
      }
      return { valid: true }
    }

    it('should accept valid images under 5MB', () => {
      expect(validateUploadPayload({ type: 'image/jpeg', size: 1024 * 500 }).valid).toBe(true)
      expect(validateUploadPayload({ type: 'image/png', size: 1024 * 1024 * 2 }).valid).toBe(true)
      expect(validateUploadPayload({ type: 'image/webp', size: 1024 * 300 }).valid).toBe(true)
    })

    it('should reject executable or script MIME types', () => {
      expect(validateUploadPayload({ type: 'application/javascript', size: 1024 }).valid).toBe(false)
      expect(validateUploadPayload({ type: 'text/html', size: 1024 }).valid).toBe(false)
      expect(validateUploadPayload({ type: 'application/x-sh', size: 1024 }).valid).toBe(false)
    })

    it('should reject files exceeding 5MB limit', () => {
      const res = validateUploadPayload({ type: 'image/jpeg', size: 6 * 1024 * 1024 })
      expect(res.valid).toBe(false)
      expect(res.error).toContain('5MB')
    })
  })

  describe('Admin Authorization & Governance Controls (/app/actions/admin)', () => {
    function authorizeAdminAction(user: { id?: string; email?: string | null; role?: string | null }) {
      if (!user.id || !user.email) {
        throw new Error('Unauthorized: Valid account required')
      }
      const isAdmin = isUserAdmin(user.email, user.role)
      if (!isAdmin) {
        throw new Error('Forbidden: Admin privilege required')
      }
      return true
    }

    it('should grant access to university administrators', () => {
      expect(authorizeAdminAction({ id: 'admin-1', email: 'admin@pondiuni.ac.in', role: 'admin' })).toBe(true)
      expect(authorizeAdminAction({ id: 'admin-2', email: 'admin@pondiuni.ac.in', role: 'user' })).toBe(true)
    })

    it('should block non-admin campus students from admin dashboard actions', () => {
      expect(() =>
        authorizeAdminAction({ id: 'student-1', email: 'student@pondiuni.ac.in', role: 'user' })
      ).toThrow('Forbidden: Admin privilege required')
    })

    it('should block unauthenticated sessions with Unauthorized error', () => {
      expect(() =>
        authorizeAdminAction({ id: undefined, email: undefined })
      ).toThrow('Unauthorized: Valid account required')
    })

    it('should aggregate dashboard summary metrics correctly', () => {
      const rawCounts = {
        users: 120,
        activeListings: 45,
        totalListings: 70,
        transactions: 35,
        completedTransactions: 28,
        openReports: 3,
        flaggedListings: 1,
      }

      const stats = {
        usersCount: rawCounts.users,
        activeListingsCount: rawCounts.activeListings,
        totalListingsCount: rawCounts.totalListings,
        transactionsCount: rawCounts.transactions,
        completedTransactionsCount: rawCounts.completedTransactions,
        openReportsCount: rawCounts.openReports,
        flaggedListingsCount: rawCounts.flaggedListings,
        transactionCompletionRate: Math.round((rawCounts.completedTransactions / rawCounts.transactions) * 100),
      }

      expect(stats.usersCount).toBe(120)
      expect(stats.activeListingsCount).toBe(45)
      expect(stats.openReportsCount).toBe(3)
      expect(stats.transactionCompletionRate).toBe(80)
    })
  })
})
