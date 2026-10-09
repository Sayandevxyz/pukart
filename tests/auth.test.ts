import { describe, it, expect } from 'vitest'
import {
  auth,
  isValidPondiUniEmail,
  isUserAdmin,
  resolveAuthSecret,
  getBaseUrl,
  getTrustedOrigins,
  validateAndPrepareUser,
  mapGoogleProfileToUser,
} from '../lib/auth'
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
        type GoogleProfileType = Parameters<typeof mapProfile>[0]
        const valid = await mapProfile({ email: 'alice@pondiuni.ac.in', name: 'Alice', picture: 'https://example.com/pic.jpg' } as GoogleProfileType)
        expect(valid.email).toBe('alice@pondiuni.ac.in')
        expect(valid.name).toBe('Alice')
        expect(valid.image).toBe('https://example.com/pic.jpg')

        await expect(mapProfile({ email: 'invalid' } as GoogleProfileType)).rejects.toThrow('Please sign in with a valid email address.')
      }
    })
  })

  describe('Production Auth Secret Resolution & Verification', () => {
    const originalEnv = { ...process.env }

    it('should return BETTER_AUTH_SECRET when defined', () => {
      process.env.BETTER_AUTH_SECRET = 'custom_secret_1234567890_test_value'
      expect(resolveAuthSecret()).toBe('custom_secret_1234567890_test_value')
      process.env = { ...originalEnv }
    })

    it('should throw an error in production if secret is missing and not in build phase', () => {
      delete process.env.BETTER_AUTH_SECRET
      delete process.env.NEXT_PHASE
      delete process.env.npm_lifecycle_event
      delete process.env.__NEXT_BUILD
      delete process.env.VITEST
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true, writable: true })

      expect(() => resolveAuthSecret()).toThrow(/Missing required environment variable: BETTER_AUTH_SECRET/)
      process.env = { ...originalEnv }
    })

    it('should provide safe build placeholder during static production build phase', () => {
      delete process.env.BETTER_AUTH_SECRET
      delete process.env.VITEST
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true, writable: true })
      process.env.NEXT_PHASE = 'phase-production-build'

      expect(resolveAuthSecret()).toBe('build_time_static_analysis_secret_placeholder')
      process.env = { ...originalEnv }
    })

    it('should test all resolveAuthSecret branches with custom env objects', () => {
      // 1. Secret provided
      expect(resolveAuthSecret({ BETTER_AUTH_SECRET: 'my_secret' })).toBe('my_secret')

      // 2. Test environment / VITEST
      expect(resolveAuthSecret({ NODE_ENV: 'test' })).toBe('test_only_better_auth_secret_for_vitest_runner')
      expect(resolveAuthSecret({ VITEST: 'true' })).toBe('test_only_better_auth_secret_for_vitest_runner')

      // 3. Build phases
      expect(resolveAuthSecret({ NEXT_PHASE: 'phase-production-build' })).toBe(
        'build_time_static_analysis_secret_placeholder'
      )
      expect(resolveAuthSecret({ npm_lifecycle_event: 'build' })).toBe(
        'build_time_static_analysis_secret_placeholder'
      )
      expect(resolveAuthSecret({ __NEXT_BUILD: '1' })).toBe(
        'build_time_static_analysis_secret_placeholder'
      )

      // 4. Production missing secret
      expect(() => resolveAuthSecret({ NODE_ENV: 'production' })).toThrow(/Missing required environment variable/)

      // 5. Development fallback
      expect(resolveAuthSecret({ NODE_ENV: 'development' })).toBe('dev_insecure_secret_pukart_local_only')
      expect(resolveAuthSecret({})).toBe('dev_insecure_secret_pukart_local_only')
    })

    it('should test all getBaseUrl branches with custom env objects', () => {
      expect(getBaseUrl({ BETTER_AUTH_URL: 'https://auth.pukart.shop' })).toBe('https://auth.pukart.shop')
      expect(getBaseUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'pukart.vercel.app' })).toBe('https://pukart.vercel.app')
      expect(getBaseUrl({ VERCEL_URL: 'pukart-preview.vercel.app' })).toBe('https://pukart-preview.vercel.app')
      expect(getBaseUrl({ NEXT_PUBLIC_APP_URL: 'https://app.pukart.shop' })).toBe('https://app.pukart.shop')
      expect(getBaseUrl({ NODE_ENV: 'production' })).toBe('https://terminus-ruddy.vercel.app')
      expect(getBaseUrl({ NODE_ENV: 'development' })).toBe('http://localhost:3000')
      expect(getBaseUrl({})).toBe('http://localhost:3000')
    })

    it('should test getTrustedOrigins with custom env objects', () => {
      const origins = getTrustedOrigins({
        BETTER_AUTH_URL: 'https://auth.pukart.shop',
        NEXT_PUBLIC_APP_URL: 'https://app.pukart.shop',
        VERCEL_URL: 'preview.vercel.app',
        VERCEL_PROJECT_PRODUCTION_URL: 'prod.vercel.app',
        V0_RUNTIME_URL: 'https://v0.runtime',
        V0_DEV_APP_URL: 'https://v0.dev',
        V0_BUILD_URL: 'https://v0.build',
        V0_SANDBOX_URL: 'https://v0.sandbox',
      })
      expect(origins).toContain('https://auth.pukart.shop')
      expect(origins).toContain('https://app.pukart.shop')
      expect(origins).toContain('https://preview.vercel.app')
      expect(origins).toContain('https://prod.vercel.app')
      expect(origins).toContain('https://v0.runtime')
      expect(origins).toContain('https://v0.dev')
      expect(origins).toContain('https://v0.build')
      expect(origins).toContain('https://v0.sandbox')
    })

    it('should test validateAndPrepareUser and mapGoogleProfileToUser edge cases', () => {
      expect(() => validateAndPrepareUser({ email: '' })).toThrow('Please provide a valid email address.')
      expect(() => validateAndPrepareUser({ email: 'not-an-email' })).toThrow('Please provide a valid email address.')

      const validUser = validateAndPrepareUser({ email: 'student@pondiuni.ac.in', name: 'Test' })
      expect(validUser.data.role).toBe('user')

      const validAdmin = validateAndPrepareUser({ email: 'admin@pondiuni.ac.in', role: 'admin' })
      expect(validAdmin.data.role).toBe('admin')

      expect(() => mapGoogleProfileToUser({ email: '' })).toThrow('Please sign in with a valid email address.')
      const mapped = mapGoogleProfileToUser({ email: 'user@pondiuni.ac.in' })
      expect(mapped.name).toBe('Campus User')
      expect(mapped.image).toBeUndefined()
    })

    it('should test isUserAdmin with custom ADMIN_EMAILS environment variable', () => {
      process.env.ADMIN_EMAILS = 'superadmin@pondiuni.ac.in, hod@pondiuni.ac.in'
      expect(isUserAdmin('superadmin@pondiuni.ac.in', 'user')).toBe(true)
      expect(isUserAdmin('hod@pondiuni.ac.in', 'user')).toBe(true)
      expect(isUserAdmin('other@pondiuni.ac.in', 'user')).toBe(false)
      process.env = { ...originalEnv }
    })
  })
})

