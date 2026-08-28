import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

/**
 * Strict validator for Pondicherry University emails.
 * Only allows exact @pondiuni.ac.in domains.
 * Rejects Gmail, Outlook, other universities, and lookalike domains (e.g., pondiuni.ac.in.evil.com).
 */
export function isValidPondiUniEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false
  const clean = email.trim().toLowerCase()
  const parts = clean.split('@')
  if (parts.length !== 2) return false
  const [localPart, domain] = parts
  if (!localPart || !domain) return false
  // Reject subdomains or lookalikes - only exact pondiuni.ac.in is authorized
  return domain === 'pondiuni.ac.in'
}

/**
 * Helper to check if a user has admin privileges based on DB role or configured admin emails.
 */
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

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET || 'pukart_secure_campus_marketplace_secret_2026_pondicherry_university',
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
          if (!email || !isValidPondiUniEmail(email)) {
            throw new Error('Access restricted: Only verified Pondicherry University (@pondiuni.ac.in) accounts are permitted.')
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
  // Email and password login/signup disabled per PUKart security policy
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
        if (!email || !isValidPondiUniEmail(email)) {
          throw new Error('Access restricted: Only official @pondiuni.ac.in accounts are permitted to join PUKart.')
        }
        return {
          email,
          name: profile.name || 'PU Student',
          image: profile.picture || null,
        }
      },
    },
  },
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
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
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
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
