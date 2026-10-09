import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

export function isValidEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false
  const clean = email.trim().toLowerCase()
  const parts = clean.split('@')
  if (parts.length !== 2) return false
  const [localPart, domain] = parts
  if (!localPart || !domain) return false
  return domain.includes('.') && domain.length >= 3 && !domain.startsWith('.') && !domain.endsWith('.')
}

export const isValidPondiUniEmail = isValidEmail

export function isUserAdmin(email?: string | null, role?: string | null): boolean {
  if (role === 'admin') return true
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  const adminEmails = (process.env.ADMIN_EMAILS || 'admin@pondiuni.ac.in')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  return adminEmails.includes(normalized)
}

export function getBaseUrl(env: Record<string, string | undefined> = process.env): string {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL
  if (env.NODE_ENV === 'production') return 'https://terminus-ruddy.vercel.app'
  return 'http://localhost:3000'
}

export function resolveAuthSecret(env: Record<string, string | undefined> = process.env): string {
  if (env.BETTER_AUTH_SECRET) {
    return env.BETTER_AUTH_SECRET
  }

  if (env.NODE_ENV === 'test' || env.VITEST) {
    return 'test_only_better_auth_secret_for_vitest_runner'
  }

  if (
    env.NEXT_PHASE === 'phase-production-build' ||
    env.npm_lifecycle_event === 'build' ||
    env.__NEXT_BUILD === '1'
  ) {
    return 'build_time_static_analysis_secret_placeholder'
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'Missing required environment variable: BETTER_AUTH_SECRET. Generate a strong secret via `openssl rand -base64 32`.'
    )
  }

  return 'dev_insecure_secret_pukart_local_only'
}

export function getTrustedOrigins(env: Record<string, string | undefined> = process.env): string[] {
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://pukart.shop',
    'https://www.pukart.shop',
    'https://terminus-ruddy.vercel.app',
    ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : []),
    ...(env.NEXT_PUBLIC_APP_URL ? [env.NEXT_PUBLIC_APP_URL] : []),
    ...(env.VERCEL_URL ? [`https://${env.VERCEL_URL}`] : []),
    ...(env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
    ...(env.V0_RUNTIME_URL ? [env.V0_RUNTIME_URL] : []),
    ...(env.V0_DEV_APP_URL ? [env.V0_DEV_APP_URL] : []),
    ...(env.V0_BUILD_URL ? [env.V0_BUILD_URL] : []),
    ...(env.V0_SANDBOX_URL ? [env.V0_SANDBOX_URL] : []),
  ]
}

export function validateAndPrepareUser(user: { email?: string; role?: string; [key: string]: unknown }) {
  const email = user.email?.trim().toLowerCase()
  if (!email || !isValidEmail(email)) {
    throw new Error('Please provide a valid email address.')
  }
  const role = isUserAdmin(email, user.role) ? 'admin' : 'user'
  return {
    data: {
      ...user,
      email,
      role,
    },
  }
}

export function mapGoogleProfileToUser(profile: { email?: string; name?: string; picture?: string }) {
  const email = profile.email?.trim().toLowerCase()
  if (!email || !isValidEmail(email)) {
    throw new Error('Please sign in with a valid email address.')
  }
  return {
    email,
    name: profile.name || 'Campus User',
    image: profile.picture || undefined,
  }
}

export const auth = betterAuth({
  database: pool,
  secret: resolveAuthSecret(),
  baseURL: getBaseUrl(),
  user: {
    additionalFields: {
      department: { type: 'string', required: false },
      course: { type: 'string', required: false },
      year: { type: 'number', required: false },
      bio: { type: 'string', required: false },
      phone: { type: 'string', required: false },
      hostel: { type: 'string', required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => validateAndPrepareUser(user),
      },
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      prompt: 'select_account',
      accessType: 'offline',
      mapProfileToUser: async (profile) => mapGoogleProfileToUser(profile),
    },
  },
  trustedOrigins: getTrustedOrigins(),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
