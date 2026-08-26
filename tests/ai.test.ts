import { describe, it, expect } from 'vitest'
import {
  parseNaturalLanguageSearch,
  calculatePriceRecommendation,
  checkListingForScam,
} from '../lib/ai'

describe('AI Features & Natural Language Processing (Priority 14)', () => {
  describe('Natural Language Search Parser', () => {
    it('should parse price thresholds and categories from natural queries', () => {
      const res = parseNaturalLanguageSearch('Find a coding laptop under ₹25,000')
      expect(res.category).toBe('Electronics')
      expect(res.maxPrice).toBe(25000)
    })

    it('should parse rental intent and cycle category', () => {
      const res = parseNaturalLanguageSearch('gear cycle for rent')
      expect(res.category).toBe('Cycles')
      expect(res.type).toBe('rent')
    })

    it('should parse book queries with price range', () => {
      const res = parseNaturalLanguageSearch('engineering mathematics textbook under 500')
      expect(res.category).toBe('Books')
      expect(res.maxPrice).toBe(500)
    })

    it('should parse condition keywords', () => {
      const res = parseNaturalLanguageSearch('brand new badminton racquet below 1200')
      expect(res.category).toBe('Sports')
      expect(res.condition).toBe('brand_new')
      expect(res.maxPrice).toBe(1200)
    })
  })

  describe('Price Recommendation Algorithm', () => {
    it('should suggest appropriate campus student discounts based on condition', () => {
      const newBook = calculatePriceRecommendation({
        category: 'Books',
        condition: 'brand_new',
        originalPrice: 1000,
      })
      expect(newBook.suggestedPrice).toBe(750)
      expect(newBook.minFairPrice).toBeLessThan(newBook.suggestedPrice)

      const usedElectronics = calculatePriceRecommendation({
        category: 'Electronics',
        condition: 'good',
        originalPrice: 10000,
      })
      expect(usedElectronics.suggestedPrice).toBe(5500)
    })
  })

  describe('AI Scam Detection Engine', () => {
    it('should flag listings requesting advance OTP transfers', () => {
      const check = checkListingForScam(
        'iPhone 13 for sale',
        'Urgent sale. Please send OTP and transfer advance before meetup.'
      )
      expect(check.flagged).toBe(true)
      expect(check.riskLevel).toBe('medium')
      expect(check.reason).toContain('OTP')
    })

    it('should flag listings containing shortlinks or suspicious domains', () => {
      const check = checkListingForScam(
        'Hostel fridge available',
        'Check pictures at http://bit.ly/fake-link-hostel'
      )
      expect(check.flagged).toBe(true)
      expect(check.reason).toContain('shortlinks')
    })

    it('should pass legitimate student listings', () => {
      const check = checkListingForScam(
        'Engineering Mechanics by Timoshenko',
        'Used for one semester in Mech dept. Minor pencil notes on first 2 chapters. Meet at Central Library.'
      )
      expect(check.flagged).toBe(false)
      expect(check.riskLevel).toBe('low')
    })
  })
})
