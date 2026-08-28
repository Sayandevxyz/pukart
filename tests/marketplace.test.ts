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
      expect(canTransition('requested', 'accepted', false)).toBe(false) // buyer cannot accept their own request
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
})


