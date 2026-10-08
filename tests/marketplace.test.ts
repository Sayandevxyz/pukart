import { describe, it, expect } from 'vitest'
import {
  checkProfileCompletion,
  SCHOOLS_AND_DEPARTMENTS,
  CAMPUS_HOSTELS,
  ALL_DEPARTMENTS,
} from '../lib/constants/campus'
import {
  getTypesForCategory,
  getConditionsForCategory,
  getFormOptionsForCategory,
} from '../lib/constants/categories'

describe('Marketplace Business Logic & Authorization (Priorities 3, 8, 10, 16)', () => {
  describe('Listing Constraints & Validation', () => {
    it('should validate title length between 3 and 120 chars', () => {
      const isValidTitle = (t: string) => t.trim().length >= 3 && t.trim().length <= 120
      expect(isValidTitle('ab')).toBe(false)
      expect(isValidTitle('Engineering Physics')).toBe(true)
      expect(isValidTitle('a'.repeat(121))).toBe(false)
    })

    it('should validate positive integer prices in INR', () => {
      const isValidPrice = (p: number) => Number.isInteger(p) && p > 0 && p <= 10000000
      expect(isValidPrice(0)).toBe(false)
      expect(isValidPrice(-50)).toBe(false)
      expect(isValidPrice(12.5)).toBe(false)
      expect(isValidPrice(1500)).toBe(true)
    })
  })

  describe('Transaction State Machine Transitions', () => {
    type TxStatus = 'inquiry' | 'requested' | 'negotiating' | 'accepted' | 'completed' | 'rejected' | 'cancelled' | 'disputed'

    function canTransition(current: TxStatus, target: TxStatus, isSeller: boolean): boolean {
      if (target === 'accepted') {
        return isSeller && ['inquiry', 'requested', 'negotiating'].includes(current)
      }
      if (target === 'completed') {
        return current === 'accepted'
      }
      if (target === 'rejected') {
        return isSeller && ['inquiry', 'requested', 'negotiating'].includes(current)
      }
      if (target === 'cancelled') {
        return ['inquiry', 'requested', 'negotiating', 'accepted'].includes(current)
      }
      return false
    }

    it('should allow seller to accept requested transaction', () => {
      expect(canTransition('requested', 'accepted', true)).toBe(true)
      expect(canTransition('requested', 'accepted', false)).toBe(false) 
    })

    it('should allow completed status only after accepted meetup', () => {
      expect(canTransition('accepted', 'completed', true)).toBe(true)
      expect(canTransition('requested', 'completed', true)).toBe(false)
      expect(canTransition('inquiry', 'completed', true)).toBe(false)
    })

    it('should prevent cancelling completed or rejected transactions', () => {
      expect(canTransition('completed', 'cancelled', true)).toBe(false)
      expect(canTransition('rejected', 'cancelled', true)).toBe(false)
    })
  })

  describe('Review Submission Rules', () => {
    it('should enforce 1 to 5 star boundaries', () => {
      const isValidRating = (r: number) => Number.isInteger(r) && r >= 1 && r <= 5
      expect(isValidRating(0)).toBe(false)
      expect(isValidRating(6)).toBe(false)
      expect(isValidRating(4)).toBe(true)
    })

    it('should require completed status before reviewing', () => {
      const canReview = (status: string) => status === 'completed'
      expect(canReview('accepted')).toBe(false)
      expect(canReview('requested')).toBe(false)
      expect(canReview('completed')).toBe(true)
    })
  })

  describe('Main Campus Profile & Listing Gate', () => {
    it('should identify incomplete profile missing required fields', () => {
      const incomplete = checkProfileCompletion({
        department: '',
        course: '',
        year: null,
        hostel: '',
      })
      expect(incomplete.isComplete).toBe(false)
      expect(incomplete.missingFields).toContain('Department / School')
      expect(incomplete.missingFields).toContain('Degree / Program')
      expect(incomplete.missingFields).toContain('Year of Study')
      expect(incomplete.missingFields).toContain('Campus Hostel')
    })

    it('should identify complete profile when all required fields are set', () => {
      const complete = checkProfileCompletion({
        department: 'Computer Science',
        course: 'M.Tech (CSE)',
        year: 2,
        hostel: 'C.V. Raman Hostel',
      })
      expect(complete.isComplete).toBe(true)
      expect(complete.missingFields.length).toBe(0)
    })

    it('should only include Main Campus departments and hostels (no Karaikal / Port Blair)', () => {
      const deptString = JSON.stringify(SCHOOLS_AND_DEPARTMENTS).toLowerCase()
      const hostelString = JSON.stringify(CAMPUS_HOSTELS).toLowerCase()
      
      expect(deptString).not.toContain('karaikal')
      expect(deptString).not.toContain('port blair')
      expect(hostelString).not.toContain('karaikal')
      expect(ALL_DEPARTMENTS).toContain('Computer Science & Engineering')
      expect(ALL_DEPARTMENTS).toContain('Management Studies')
      expect(ALL_DEPARTMENTS).toContain('Biotechnology')
      expect(hostelString).toContain('sri aurobindo hostel')
      expect(hostelString).toContain('birsa munda hostel')
    })
  })

  describe('Category-Tailored Types & Conditions Filter Rules', () => {
    it('should provide food-tailored options for Food category', () => {
      const foodTypes = getTypesForCategory('Food')
      const foodConditions = getConditionsForCategory('Food')
      const foodLabels = foodTypes.map((t: any) => t.label).join(' ')
      const foodCondLabels = foodConditions.map((c: any) => c.label).join(' ')

      expect(foodLabels).toContain('Daily Meal / Home Tiffin')
      expect(foodLabels).toContain('Hostel Mess Coupon / Share')
      expect(foodCondLabels).toContain('Freshly Cooked (Made Today)')
      expect(foodCondLabels).toContain('Packed & Sealed (Unopened)')
    })

    it('should provide service-tailored options for Services category', () => {
      const serviceTypes = getTypesForCategory('Services')
      const serviceConditions = getConditionsForCategory('Services')
      const serviceLabels = serviceTypes.map((t: any) => t.label).join(' ')
      const serviceCondLabels = serviceConditions.map((c: any) => c.label).join(' ')

      expect(serviceLabels).toContain('Tutoring / Exam Prep / Assignment Help')
      expect(serviceLabels).toContain('Printing / Xerox / Thesis Binding')
      expect(serviceCondLabels).toContain('Hourly Rate')
      expect(serviceCondLabels).toContain('Fixed Task / Project Rate')
    })

    it('should fallback to default options when category is All or null', () => {
      const allTypes = getTypesForCategory('All')
      const nullTypes = getTypesForCategory(null)
      expect(allTypes[0].label).toBe('All Types')
      expect(nullTypes[0].label).toBe('All Types')
    })

    it('should return category-tailored title and description placeholders', () => {
      const bikeOptions = getFormOptionsForCategory('Bikes')
      const bookOptions = getFormOptionsForCategory('Books')
      const cycleOptions = getFormOptionsForCategory('Cycles')
      const scootyOptions = getFormOptionsForCategory('Scooty')

      expect(bikeOptions.titlePlaceholder.toLowerCase()).toContain('royal enfield')
      expect(bikeOptions.descriptionPlaceholder.toLowerCase()).toContain('rc transfer')

      expect(bookOptions.titlePlaceholder.toLowerCase()).toContain('engineering mathematics')
      expect(bookOptions.descriptionPlaceholder.toLowerCase()).toContain('edition')

      expect(cycleOptions.titlePlaceholder.toLowerCase()).toContain('bicycle')
      expect(scootyOptions.titlePlaceholder.toLowerCase()).toContain('activa')
    })
  })

  describe('Seller & Buyer Messaging Visibility Rules (Priority 7)', () => {
    interface MockConv {
      id: number
      listingId: number
      buyerId: string
      sellerId: string
      lastMessage: string | null
      lastMessageAt: Date
    }

    interface MockMsg {
      id: number
      conversationId: number
      senderId: string
      content: string
      readAt: Date | null
      createdAt: Date
    }

    const sellerUser = { id: 'seller_123', name: 'Pujari Vyshnav', email: 'pujari@pondiuni.ac.in' }
    const buyerUser = { id: 'buyer_456', name: 'Sayan Mondal', email: 'sayan@pondiuni.ac.in' }

    const mockConversations: MockConv[] = [
      {
        id: 1,
        listingId: 2,
        buyerId: buyerUser.id,
        sellerId: sellerUser.id,
        lastMessage: 'Is this calculator still available?',
        lastMessageAt: new Date(),
      },
    ]

    const mockMessages: MockMsg[] = [
      {
        id: 101,
        conversationId: 1,
        senderId: buyerUser.id,
        content: 'Is this calculator still available?',
        readAt: null,
        createdAt: new Date(),
      },
    ]

    it('should allow seller to find conversations where sellerId === seller.id', () => {
      const sellerInboxes = mockConversations.filter(
        (c) => c.sellerId === sellerUser.id || c.buyerId === sellerUser.id
      )
      expect(sellerInboxes.length).toBe(1)
      expect(sellerInboxes[0].buyerId).toBe(buyerUser.id)
    })

    it('should identify buyer as the counterparty when viewed by seller', () => {
      const conv = mockConversations[0]
      const isBuyer = conv.buyerId === sellerUser.id
      const counterpartyId = isBuyer ? conv.sellerId : conv.buyerId
      expect(isBuyer).toBe(false)
      expect(counterpartyId).toBe(buyerUser.id)
    })

    it('should allow seller to view all messages sent by the buyer in the conversation', () => {
      const convMessages = mockMessages.filter((m) => m.conversationId === 1)
      expect(convMessages.length).toBe(1)
      expect(convMessages[0].senderId).toBe(buyerUser.id)
      expect(convMessages[0].content).toBe('Is this calculator still available?')
    })

    it('should mark unread buyer messages as read when seller accesses conversation', () => {
      const unreadForSeller = mockMessages.filter(
        (m) => m.conversationId === 1 && m.senderId !== sellerUser.id && m.readAt === null
      )
      expect(unreadForSeller.length).toBe(1)

      unreadForSeller.forEach((m) => {
        m.readAt = new Date()
      })

      expect(mockMessages[0].readAt).not.toBeNull()
    })

    it('should allow seller to send reply and update conversation state', () => {
      const replyText = 'Yes, available! We can meet at Library gate.'
      mockMessages.push({
        id: 102,
        conversationId: 1,
        senderId: sellerUser.id,
        content: replyText,
        readAt: null,
        createdAt: new Date(),
      })
      mockConversations[0].lastMessage = replyText

      const latestMessages = mockMessages.filter((m) => m.conversationId === 1)
      expect(latestMessages.length).toBe(2)
      expect(latestMessages[1].senderId).toBe(sellerUser.id)
      expect(latestMessages[1].content).toBe(replyText)
      expect(mockConversations[0].lastMessage).toBe(replyText)
    })
  })

  describe('Campus Transit Mobility Calculator (Feature 4)', () => {
    const rentalOptions = {
      '1_day': { label: 'Daily Pass (1 Day)', multiplier: 1, days: 1, depositRate: 0.5 },
      '3_days': { label: 'Weekend Explorer (3 Days)', multiplier: 2.4, days: 3, depositRate: 0.8 },
      '1_week': { label: 'Weekly Transit (7 Days)', multiplier: 4.8, days: 7, depositRate: 1.5 },
      '1_month': { label: 'Semester Month (30 Days)', multiplier: 14, days: 30, depositRate: 2.0 },
    }

    function calculateRental(basePrice: number, duration: keyof typeof rentalOptions) {
      const config = rentalOptions[duration]
      const rentalAmount = Math.max(20, Math.round(basePrice * config.multiplier))
      const depositAmount = Math.max(100, Math.round(basePrice * config.depositRate))
      return { rentalAmount, depositAmount, days: config.days }
    }

    function isMobilityItem(title: string, category: string, subcategory?: string): boolean {
      const mobilityKeywords = ['cycle', 'bicycle', 'bike', 'scooter', 'scooty', 'helmet', 'transit', 'mobility', 'ride']
      const content = `${title} ${category} ${subcategory || ''}`.toLowerCase()
      return mobilityKeywords.some((k) => content.includes(k))
    }

    it('should correctly identify mobility and cycle items', () => {
      expect(isMobilityItem('Hero Sprint Pro Cycle', 'Vehicles', 'Bicycles')).toBe(true)
      expect(isMobilityItem('Honda Activa Scooty for Rent', 'Other')).toBe(true)
      expect(isMobilityItem('Campus Bicycle Helmet', 'Sports')).toBe(true)
      expect(isMobilityItem('Engineering Physics Textbook', 'Books')).toBe(false)
    })

    it('should compute appropriate rental rates and deposits across all durations', () => {
      const baseDailyRate = 50
      const daily = calculateRental(baseDailyRate, '1_day')
      expect(daily.rentalAmount).toBe(50)
      expect(daily.depositAmount).toBe(100)

      const weekend = calculateRental(baseDailyRate, '3_days')
      expect(weekend.rentalAmount).toBe(120)
      expect(weekend.depositAmount).toBe(100)

      const weekly = calculateRental(baseDailyRate, '1_week')
      expect(weekly.rentalAmount).toBe(240)
      expect(weekly.depositAmount).toBe(100)

      const monthly = calculateRental(baseDailyRate, '1_month')
      expect(monthly.rentalAmount).toBe(700)
      expect(monthly.depositAmount).toBe(100)
    })

    it('should enforce safety minimum floors on micro-rates', () => {
      const micro = calculateRental(10, '1_day')
      expect(micro.rentalAmount).toBe(20)
      expect(micro.depositAmount).toBe(100)
    })

    it('should only show mobility rental to signed-in users when seller explicitly configured rental price', () => {
      function resolveRentalDailyRate(listing: { type: string; price: number; rentPrice?: number | null }): number {
        if (listing.rentPrice && listing.rentPrice > 0) return listing.rentPrice
        if (listing.type === 'rent' || listing.type === 'monthly_rent') return listing.price
        return 0
      }

      function shouldShowMobilityRental(
        user: { id: string } | null,
        listing: { type: string; price: number; rentPrice?: number | null }
      ): boolean {
        if (!user) return false
        return resolveRentalDailyRate(listing) > 0
      }

      // Unauthenticated visitor (guest) -> NEVER shown
      expect(shouldShowMobilityRental(null, { type: 'sell', price: 37000 })).toBe(false)
      expect(shouldShowMobilityRental(null, { type: 'rent', price: 400 })).toBe(false)

      // Signed-in user, but listing is SELL-only (e.g., Gixxer bike for ₹37,000) -> NEVER treat ₹37,000 as rent
      expect(shouldShowMobilityRental({ id: 'user_1' }, { type: 'sell', price: 37000 })).toBe(false)
      expect(resolveRentalDailyRate({ type: 'sell', price: 37000 })).toBe(0)

      // Signed-in user, listing is SELL for ₹37,000 but seller set daily rentPrice of ₹400
      expect(shouldShowMobilityRental({ id: 'user_1' }, { type: 'sell', price: 37000, rentPrice: 400 })).toBe(true)
      expect(resolveRentalDailyRate({ type: 'sell', price: 37000, rentPrice: 400 })).toBe(400)

      // Signed-in user, listing is RENTAL for ₹500/day
      expect(shouldShowMobilityRental({ id: 'user_1' }, { type: 'rent', price: 500 })).toBe(true)
      expect(resolveRentalDailyRate({ type: 'rent', price: 500 })).toBe(500)
    })
  })

  describe('Campus Senior Trust Badges Logic (Feature 5)', () => {
    function getSeniorTrustBadges(user: { department?: string | null; hostel?: string | null }, stats: { averageRating?: number; reviewCount?: number }) {
      const badges: string[] = []
      if (user.department) badges.push(`Verified Scholar (${user.department})`)
      else badges.push('Verified Scholar PU')

      if (user.hostel) badges.push(`Hosteller (${user.hostel})`)

      const avgRating = stats.averageRating ?? 5.0
      if (avgRating >= 4.5) badges.push(`Top Senior Peer (${avgRating} / 5)`)

      badges.push('Same-Day Handoff')

      if ((stats.reviewCount || 0) > 0) badges.push(`${stats.reviewCount} Meetups Completed`)
      else badges.push('Campus Verified')

      return badges
    }

    it('should award Top Senior Peer badge when rating is 4.5 or higher', () => {
      const senior = getSeniorTrustBadges({ department: 'Computer Science', hostel: 'C.V. Raman' }, { averageRating: 4.8, reviewCount: 12 })
      expect(senior).toContain('Top Senior Peer (4.8 / 5)')
      expect(senior).toContain('Hosteller (C.V. Raman)')
      expect(senior).toContain('Verified Scholar (Computer Science)')
      expect(senior).toContain('12 Meetups Completed')
    })

    it('should not award Top Senior Peer badge when rating is below 4.5', () => {
      const peer = getSeniorTrustBadges({ department: 'Management', hostel: 'Madame Curie' }, { averageRating: 4.0, reviewCount: 3 })
      expect(peer.some((b) => b.startsWith('Top Senior Peer'))).toBe(false)
      expect(peer).toContain('Hosteller (Madame Curie)')
      expect(peer).toContain('3 Meetups Completed')
    })
  })

  describe('Campus Safe Zones & Concurrency Controls (Extended Suite)', () => {
    it('should prevent concurrent transactions from double-selling an item', () => {
      interface ListingState {
        id: number
        status: 'active' | 'reserved' | 'sold'
        acceptedTxId: number | null
      }

      const listing: ListingState = { id: 42, status: 'active', acceptedTxId: null }

      function acceptTransaction(txId: number): boolean {
        if (listing.status !== 'active') return false
        listing.status = 'reserved'
        listing.acceptedTxId = txId
        return true
      }

      const buyer1Accept = acceptTransaction(101)
      const buyer2ConcurrentAccept = acceptTransaction(102)

      expect(buyer1Accept).toBe(true)
      expect(buyer2ConcurrentAccept).toBe(false)
      expect(listing.acceptedTxId).toBe(101)
    })

    it('should validate designated CCTV-covered campus safe meetup zones', () => {
      const APPROVED_CAMPUS_LANDMARKS = [
        'Central Library Gate',
        'Silver Jubilee Campus Quad',
        'Main Gate 1 Security Checkpost',
        'Science Complex Entrance',
        'Hostel Quadrangle Mess',
      ]

      function isApprovedSafeZone(location: string): boolean {
        return APPROVED_CAMPUS_LANDMARKS.some((landmark) =>
          location.toLowerCase().includes(landmark.toLowerCase())
        )
      }

      expect(isApprovedSafeZone('Central Library Gate Cycle Stand')).toBe(true)
      expect(isApprovedSafeZone('Near Silver Jubilee Campus Quad')).toBe(true)
      expect(isApprovedSafeZone('Off-campus dark alleyway')).toBe(false)
    })

    it('should flag extreme price deviation outliers for peer review', () => {
      function evaluateFairnessScore(price: number, marketAvg: number): 'fair' | 'bargain' | 'outlier_high' {
        if (price > marketAvg * 2.5) return 'outlier_high'
        if (price < marketAvg * 0.4) return 'bargain'
        return 'fair'
      }

      expect(evaluateFairnessScore(500, 450)).toBe('fair')
      expect(evaluateFairnessScore(150, 450)).toBe('bargain')
      expect(evaluateFairnessScore(2500, 450)).toBe('outlier_high')
    })
  })
})

