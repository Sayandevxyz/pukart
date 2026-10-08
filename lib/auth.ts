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

const rawBaseUrl =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://terminus-ruddy.vercel.app'
          : 'http://localhost:3000'))

const authSecret =
  process.env.BETTER_AUTH_SECRET || 'pukart_secure_campus_marketplace_secret_2026_pondicherry_university'
if (process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET) {
  console.warn(
    '[SECURITY WARNING] BETTER_AUTH_SECRET environment variable is missing in production. Generate a strong secret via `openssl rand -base64 32`.'
  )
}

export const auth = betterAuth({
  database: pool,
  secret: authSecret,
  baseURL: rawBaseUrl,
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
        before: async (user) => {
          const email = user.email?.trim().toLowerCase()
          if (!email || !isValidEmail(email)) {
            throw new Error('Please provide a valid email address.')
          }
          const role = isUserAdmin(email, (user as { role?: string }).role) ? 'admin' : 'user'
          return {
            data: {
              ...user,
              email,
              role,
            },
          }
        },
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
      mapProfileToUser: async (profile) => {
        const email = profile.email?.trim().toLowerCase()
        if (!email || !isValidEmail(email)) {
          throw new Error('Please sign in with a valid email address.')
        }
        return {
          email,
          name: profile.name || 'Campus User',
          image: profile.picture || undefined,
        }
      },
    },
  },
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://pukart.shop',
    'https://www.pukart.shop',
    'https://terminus-ruddy.vercel.app',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
    ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
    ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
  ],
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
