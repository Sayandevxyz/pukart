import { describe, it, expect, vi } from 'vitest'
import {
  parseNaturalLanguageSearch,
  calculatePriceRecommendation,
  checkListingForScam,
  generateProductDescription,
  moderateImageContent,
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

    it('should parse min price and range boundaries', () => {
      const above = parseNaturalLanguageSearch('cycles above ₹1000')
      expect(above.minPrice).toBe(1000)

      const range = parseNaturalLanguageSearch('table fan between ₹300 and ₹800')
      expect(range.minPrice).toBe(300)
      expect(range.maxPrice).toBe(800)

      const empty = parseNaturalLanguageSearch('   ')
      expect(empty.query).toBe('')
    })

    it('should parse all campus item categories and condition variations', () => {
      expect(parseNaturalLanguageSearch('pulsar bike to buy').category).toBe('Bikes')
      expect(parseNaturalLanguageSearch('pulsar bike to buy').type).toBe('sell')
      expect(parseNaturalLanguageSearch('activa scooty rental').category).toBe('Scooty')
      expect(parseNaturalLanguageSearch('activa scooty rental').type).toBe('rent')
      expect(parseNaturalLanguageSearch('hostel mattress').category).toBe('Hostel')
      expect(parseNaturalLanguageSearch('chemistry lab coat mint condition').category).toBe('Fashion')
      expect(parseNaturalLanguageSearch('chemistry lab coat mint condition').condition).toBe('like_new')
      expect(parseNaturalLanguageSearch('assignment photography service').category).toBe('Services')
      expect(parseNaturalLanguageSearch('calculator used good condition').condition).toBe('good')
      expect(parseNaturalLanguageSearch('calculator fair condition scratched').condition).toBe('fair')
    })

    it('should retain raw query when cleaned keywords string is empty', () => {
      const res = parseNaturalLanguageSearch('find cheap buy rent')
      expect(res.query).toBe('find cheap buy rent')
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

    it('should derive original price from currentPrice or default fallback when missing', () => {
      const fromCurrent = calculatePriceRecommendation({
        category: 'Cycles',
        condition: 'fair',
        currentPrice: 3000,
      })
      expect(fromCurrent.suggestedPrice).toBeGreaterThan(0)

      const fallbackDefaults = calculatePriceRecommendation({
        category: 'UnknownCategory',
        condition: 'unknown_condition',
      })
      expect(fallbackDefaults.suggestedPrice).toBe(1000)
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

    it('should assign high risk level and 0.95 confidence when multiple scam indicators match', () => {
      const check = checkListingForScam(
        'iPhone 15 free lottery winner',
        'Send OTP code and pay advance via gift card. Check http://bit.ly/claim'
      )
      expect(check.flagged).toBe(true)
      expect(check.riskLevel).toBe('high')
      expect(check.confidence).toBe(0.95)
    })

    it('should flag prohibited campus contraband and non-standard payment schemes', () => {
      const contraband = checkListingForScam('Whiskey bottle sale', 'Hostel room party drinks leftover')
      expect(contraband.flagged).toBe(true)
      expect(contraband.reason).toContain('contraband')

      const paymentScam = checkListingForScam('iPhone urgent sale', 'whatsapp at 9876543210 gift card only')
      expect(paymentScam.flagged).toBe(true)
      expect(paymentScam.reason).toContain('payment schemes')
    })
  })

  describe('Automated Product Description Generator', () => {
    it('should generate well-structured descriptions with campus handover readiness', async () => {
      const desc = await generateProductDescription({
        title: 'Casio fx-991EX Scientific Calculator',
        category: 'Electronics',
        condition: 'like_new',
        originalPrice: 1500,
        highlights: 'Original slipcase and battery included',
      })
      expect(desc).toContain('Casio fx-991EX Scientific Calculator')
      expect(desc).toContain('like new')
      expect(desc).toContain('Original slipcase and battery included')
      expect(desc).toContain('PU campus')
    })

    it('should fallback gracefully when optional highlights are omitted', async () => {
      const desc = await generateProductDescription({
        title: 'Microeconomics Principles 8th Edition',
        category: 'Books',
        condition: 'good',
      })
      expect(desc).toContain('Microeconomics Principles 8th Edition')
      expect(desc).toContain('good')
      expect(desc).toContain('Pondicherry University')
    })

    it('should generate description using remote AI Gateway / LLM when API key is configured', async () => {
      const origKey = process.env.GEMINI_API_KEY
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: 'AI generated premium campus listing description from LLM endpoint.',
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      try {
        process.env.GEMINI_API_KEY = 'test-gemini-key'

        const desc = await generateProductDescription({
          title: 'Dell Inspiron 15',
          category: 'Electronics',
          condition: 'like_new',
          originalPrice: 45000,
          highlights: '16GB RAM, SSD upgraded',
        })

        expect(desc).toBe('AI generated premium campus listing description from LLM endpoint.')
      } finally {
        process.env.GEMINI_API_KEY = origKey
        fetchSpy.mockRestore()
      }
    })

    it('should fallback to rule-based template if remote AI API call fails or returns non-200', async () => {
      const origKey = process.env.GEMINI_API_KEY
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
      try {
        process.env.GEMINI_API_KEY = 'test-gemini-key'

        const desc = await generateProductDescription({
          title: 'Dell Inspiron 15',
          category: 'Electronics',
          condition: 'like_new',
        })

        expect(desc).toContain('Dell Inspiron 15')
        expect(desc).toContain('like new')
      } finally {
        process.env.GEMINI_API_KEY = origKey
        fetchSpy.mockRestore()
      }
    })

    it('should cover all condition note variations and highlights branches', async () => {
      const brandNew = await generateProductDescription({
        title: 'Notebook',
        category: 'Books',
        condition: 'brand_new',
      })
      expect(brandNew).toContain('completely brand new')

      const fair = await generateProductDescription({
        title: 'Study Table',
        category: 'Hostel',
        condition: 'fair',
        highlights: 'Sturdy wood',
      })
      expect(fair).toContain('Well-utilized')
      expect(fair).toContain('Sturdy wood')

      const poor = await generateProductDescription({
        title: 'Cycle for spares',
        category: 'Cycles',
        condition: 'poor',
      })
      expect(poor).toContain('Usable condition')

      const unknown = await generateProductDescription({
        title: 'Custom gadget',
        category: 'Electronics',
        condition: 'vintage',
      })
      expect(unknown).toContain('Maintained well in hostel rooms')
    })

    it('should fallback when remote response returns empty choices', async () => {
      const origKey = process.env.GEMINI_API_KEY
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ choices: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      )
      try {
        process.env.GEMINI_API_KEY = 'test-gemini-key'
        const desc = await generateProductDescription({
          title: 'Chemistry Book',
          category: 'Books',
          condition: 'good',
        })
        expect(desc).toContain('Chemistry Book')
      } finally {
        process.env.GEMINI_API_KEY = origKey
        fetchSpy.mockRestore()
      }
    })
  })

  describe('AI Image Moderation Engine', () => {
    it('should reject filenames containing prohibited explicit terms', () => {
      const fakeBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
      const res = moderateImageContent('sample-nude-photo.jpg', fakeBuffer)
      expect(res.rejected).toBe(true)
      expect(res.reason).toContain('prohibited content keywords')
    })

    it('should assign rejected warning level when multiple issues are flagged', () => {
      const encoder = new TextEncoder()
      const text = '<x:xmpmeta><dc:subject>adult</dc:subject></x:xmpmeta>'
      const fakeBuffer = encoder.encode(text)
      const res = moderateImageContent('sample-nude.jpg', fakeBuffer)
      expect(res.rejected).toBe(true)
      expect(res.warningLevel).toBe('rejected')
      expect(res.details.length).toBeGreaterThanOrEqual(2)
    })

    it('should safely handle small buffers under 300 bytes', () => {
      const smallBuffer = new Uint8Array(100)
      const res = moderateImageContent('valid_thumb.jpg', smallBuffer)
      expect(res.rejected).toBe(false)
      expect(res.warningLevel).toBe('safe')
    })

    it('should reject images containing explicit XMP metadata tags', () => {
      const encoder = new TextEncoder()
      const text = '<x:xmpmeta><dc:subject>adult</dc:subject></x:xmpmeta>'
      const fakeBuffer = encoder.encode(text)
      const res = moderateImageContent('campus_photo.jpg', fakeBuffer)
      expect(res.rejected).toBe(true)
      expect(res.details.some((d) => d.includes('adult'))).toBe(true)
    })

    it('should reject images containing NSFW EXIF signatures', () => {
      const encoder = new TextEncoder()
      const text = 'Camera Model EXIF: stable diffusion nsfw generator output'
      const fakeBuffer = encoder.encode(text)
      const res = moderateImageContent('test.png', fakeBuffer)
      expect(res.rejected).toBe(true)
      expect(res.details.some((d) => d.includes('stable diffusion nsfw'))).toBe(true)
    })

    it('should detect unusually high skin-tone pixel ratio with low color diversity', () => {
      // Create a buffer of 3000 bytes (startOffset 600 is divisible by 3)
      const skinBuffer = new Uint8Array(3000)
      for (let i = 0; i < skinBuffer.length; i++) {
        skinBuffer[i] = (i % 3 === 0) ? 200 : (i % 3 === 1) ? 130 : 100
      }
      const res = moderateImageContent('portrait.jpg', skinBuffer)
      expect(res.rejected).toBe(true)
      expect(res.details.some((d) => d.includes('skin-tone coverage'))).toBe(true)
    })

    it('should approve legitimate campus listing photos', () => {
      const safeBuffer = new Uint8Array(1024)
      for (let i = 0; i < safeBuffer.length; i++) {
        safeBuffer[i] = (i * 37) % 256
      }
      const res = moderateImageContent('scientific_calculator_fx991ex.jpg', safeBuffer)
      expect(res.rejected).toBe(false)
      expect(res.warningLevel).toBe('safe')
      expect(res.details).toHaveLength(0)
    })
  })
})

