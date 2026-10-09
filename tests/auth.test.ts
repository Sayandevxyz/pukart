import { describe, it, expect } from 'vitest'
import { auth, isValidPondiUniEmail, isUserAdmin } from '../lib/auth'
import {
  checkProfileCompletion,
  ALL_HOSTELS,
  MEETUP_LOCATIONS,
  SCHOOLS_AND_DEPARTMENTS,
  CAMPUS_HOSTELS,
} from '../lib/constants/campus'

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

describe('Student Profile Verification & Campus Readiness', () => {
  it('should recognize a fully completed Pondicherry University student profile', () => {
    const profile = {
      department: 'Computer Science',
      course: 'M.Tech CSE',
      year: 2,
      hostel: 'Madame Curie Hostel',
    }
    const result = checkProfileCompletion(profile)
    expect(result.isComplete).toBe(true)
    expect(result.missingFields).toHaveLength(0)
  })

  it('should flag missing department and course', () => {
    const incompleteProfile = {
      department: '',
      course: '',
      year: 1,
      hostel: 'Cauvery Hostel',
    }
    const result = checkProfileCompletion(incompleteProfile)
    expect(result.isComplete).toBe(false)
    expect(result.missingFields).toContain('Department / School')
    expect(result.missingFields).toContain('Degree / Program')
  })

  it('should flag missing or invalid year of study', () => {
    const zeroYearProfile = {
      department: 'Physics',
      course: 'M.Sc Physics',
      year: 0,
      hostel: 'Bharathi Hostel',
    }
    const nullYearProfile = {
      department: 'Physics',
      course: 'M.Sc Physics',
      year: null,
      hostel: 'Bharathi Hostel',
    }
    expect(checkProfileCompletion(zeroYearProfile).isComplete).toBe(false)
    expect(checkProfileCompletion(zeroYearProfile).missingFields).toContain('Year of Study')
    expect(checkProfileCompletion(nullYearProfile).isComplete).toBe(false)
  })

  it('should flag missing hostel accommodation for on-campus peer handoffs', () => {
    const noHostelProfile = {
      department: 'Management Studies',
      course: 'MBA',
      year: 1,
      hostel: '   ',
    }
    const result = checkProfileCompletion(noHostelProfile)
    expect(result.isComplete).toBe(false)
    expect(result.missingFields).toContain('Campus Hostel')
  })
})

describe('Campus Constants & PU Landmark Integrity', () => {
  it('should contain verified Pondicherry University hostels across campus clusters', () => {
    expect(CAMPUS_HOSTELS.length).toBeGreaterThanOrEqual(2)
    expect(ALL_HOSTELS).toBeInstanceOf(Array)
    expect(ALL_HOSTELS.length).toBeGreaterThanOrEqual(10)
    expect(ALL_HOSTELS).toContain('Madame Curie Hostel')
    expect(ALL_HOSTELS).toContain('Kaveri Hostel')
    expect(ALL_HOSTELS).toContain('Ganga Hostel')
  })

  it('should define safe CCTV-covered campus meetup landmarks', () => {
    expect(MEETUP_LOCATIONS).toBeInstanceOf(Array)
    expect(MEETUP_LOCATIONS.length).toBeGreaterThanOrEqual(10)
    expect(MEETUP_LOCATIONS).toContain('Central Library Entrance')
    expect(MEETUP_LOCATIONS).toContain('Silver Jubilee Campus')
    expect(MEETUP_LOCATIONS).toContain('Gate 1 / Main Gate')
    expect(MEETUP_LOCATIONS).toContain('Hostel Mess Area')
  })

  it('should register Pondicherry University schools and academic departments', () => {
    expect(SCHOOLS_AND_DEPARTMENTS).toBeInstanceOf(Array)
    expect(SCHOOLS_AND_DEPARTMENTS.length).toBeGreaterThanOrEqual(5)
    const schoolNames = SCHOOLS_AND_DEPARTMENTS.map((s) => s.school)
    expect(schoolNames).toContain('School of Management')
    expect(schoolNames).toContain('Ramanujan School of Mathematical Sciences')
    expect(schoolNames).toContain('School of Life Sciences')
  })

  describe('Better Auth Lifecycle Hooks & OAuth Profile Normalization', () => {
    it('should assign student role in user create hook and reject invalid emails', async () => {
      const userHook = auth.options.databaseHooks?.user?.create?.before
      if (userHook) {
        const studentRes = await userHook({ email: 'scholar@pondiuni.ac.in', name: 'Scholar' } as Parameters<typeof userHook>[0])
        expect(studentRes.data.role).toBe('user')
        expect(studentRes.data.email).toBe('scholar@pondiuni.ac.in')

        const adminRes = await userHook({ email: 'admin@pondiuni.ac.in', name: 'Admin User' } as Parameters<typeof userHook>[0])
        expect(adminRes.data.role).toBe('admin')

        await expect(
          userHook({ email: 'invalid-email' } as Parameters<typeof userHook>[0])
        ).rejects.toThrow('Please provide a valid email address.')
      }
    })

    it('should map Google OAuth profile correctly and reject invalid email payloads', async () => {
      const mapProfile = auth.options.socialProviders?.google?.mapProfileToUser
      if (mapProfile) {
        const valid = await mapProfile({ email: 'alice@pondiuni.ac.in', name: 'Alice', picture: 'https://example.com/pic.jpg' })
        expect(valid.email).toBe('alice@pondiuni.ac.in')
        expect(valid.name).toBe('Alice')
        expect(valid.image).toBe('https://example.com/pic.jpg')

        await expect(mapProfile({ email: 'invalid' })).rejects.toThrow('Please sign in with a valid email address.')
      }
    })
  })
})
