import { eq, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth, isValidPondiUniEmail } from '@/lib/auth'
import { db } from '@/lib/db'
import { listings, notifications, user as userTable } from '@/lib/db/schema'

export async function currentUser() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const email = session?.user?.email?.toLowerCase().trim()
    if (!session?.user?.id || !isValidPondiUniEmail(email)) {
      return null
    }
    return session.user
  } catch {
    return null
  }
}

export async function requireUser() {
  const user = await currentUser()
  if (!user) throw new Error('Please sign in')
  return user
}

export function createAnonymousSeller(id: string = '') {
  return {
    id,
    name: 'Verified PU Student',
    image: null,
    email: null,
    department: null,
    course: null,
    year: null,
    bio: null,
    phone: null,
    hostel: null,
    isPrivate: true,
  }
}

export async function getActionUser(): Promise<
  | { success: true; user: NonNullable<Awaited<ReturnType<typeof currentUser>>> }
  | { success: false; error: string }
> {
  const user = await currentUser()
  if (!user) return { success: false, error: 'Please sign in to continue' }
  return { success: true, user }
}

export async function formatSafeListingTitle(title: string | null | undefined): Promise<string> {
  return (title || '').replace(/["""]/g, "'").slice(0, 100)
}

export async function getValidListingOrThrow(listingId: number) {
  if (!Number.isInteger(listingId) || listingId < 1) {
    throw new Error('Invalid listing')
  }
  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)
  if (!listing) {
    throw new Error('Listing does not exist')
  }
  return listing
}

export async function createSafeNotification(params: {
  userId: string
  kind: string
  title: string
  body: string
  link?: string
}) {
  try {
    await db.insert(notifications).values(params)
  } catch (err) {
    console.error('[createSafeNotification error]', err)
  }
}

export async function getTxParticipantRole(tx: { buyerId: string; sellerId: string }, userId: string) {
  const isBuyer = tx.buyerId === userId
  const isSeller = tx.sellerId === userId
  return { isBuyer, isSeller, isParticipant: isBuyer || isSeller }
}

export async function fetchUsersMap(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)].filter(Boolean)
  if (uniqueIds.length === 0) {
    return new Map<string, typeof userTable.$inferSelect>()
  }
  const users = await db.select().from(userTable).where(inArray(userTable.id, uniqueIds))
  return new Map(users.map((u) => [u.id, u]))
}
