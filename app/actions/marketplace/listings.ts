'use server'

import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  favorites,
  listings,
  notifications,
  profiles,
  user as userTable,
} from '@/lib/db/schema'
import { checkProfileCompletion } from '@/lib/constants/campus'
import { sanitizeText } from '@/lib/utils'
import type { SellerProfileData } from '@/lib/types'
import { currentUser, createAnonymousSeller } from './validation'
import { getUserRatingStats } from './reviews'

export async function toggleFavorite(listingId: number) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in to continue' }
    if (!Number.isInteger(listingId) || listingId < 1)
      return { success: false, error: 'Invalid listing ID' }

    const existing = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(and(eq(favorites.userId, user.id), eq(favorites.listingId, listingId)))
      .limit(1)

    if (existing[0]) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id))
      revalidatePath('/favorites')
      revalidatePath('/')
      return { success: true, saved: false }
    }

    const [targetListing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1)
    if (!targetListing) return { success: false, error: 'Listing does not exist' }

    await db.insert(favorites).values({ userId: user.id, listingId })

    if (targetListing.userId !== user.id) {
      try {
        const safeTitle = (targetListing.title || '').replace(/["""]/g, "'").slice(0, 100)
        await db.insert(notifications).values({
          userId: targetListing.userId,
          kind: 'favorite',
          title: 'New Favorite on Your Listing',
          body: `Someone saved your listing: ${safeTitle}`.slice(0, 200),
          link: `/listing/${targetListing.id}`,
        })
      } catch (notifErr) {
        console.error('[toggleFavorite notification error]', notifErr)
      }
    }

    revalidatePath('/favorites')
    revalidatePath('/')
    return { success: true, saved: true }
  } catch (err) {
    console.error('[toggleFavorite error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update favorite',
    }
  }
}

export async function getMyFavorites() {
  try {
    const user = await currentUser()
    if (!user) return []
    const rows = await db
      .select({
        listing: listings,
      })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .where(eq(favorites.userId, user.id))
      .orderBy(desc(favorites.createdAt))

    return rows.map((row) => row.listing)
  } catch (err) {
    console.error('[getMyFavorites error]', err)
    return []
  }
}

export async function saveProfile(input: {
  department?: string
  course?: string
  year?: number
  bio?: string
  phone?: string
  hostel?: string
}) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }

    const department = input.department ? sanitizeText(input.department, 1, 120) : null
    const course = input.course ? sanitizeText(input.course, 1, 120) : null
    const year =
      input.year && Number.isInteger(input.year) && input.year >= 1 && input.year <= 8
        ? input.year
        : null
    const bio = input.bio ? sanitizeText(input.bio, 0, 500) : null
    const phone = input.phone ? sanitizeText(input.phone, 0, 20) : null
    const hostel = input.hostel ? sanitizeText(input.hostel, 0, 100) : null

    await db
      .update(userTable)
      .set({
        department,
        course,
        year,
        bio,
        phone,
        hostel,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, user.id))

    const values = {
      userId: user.id,
      department,
      course,
      year,
      bio,
      phone,
      hostel,
      updatedAt: new Date(),
    }

    await db
      .insert(profiles)
      .values(values)
      .onConflictDoUpdate({
        target: profiles.userId,
        set: values,
      })

    revalidatePath('/profile')
    revalidatePath('/listing/new')
    return { success: true, profile: values }
  } catch (err) {
    console.error('[saveProfile error]', err)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save profile' }
  }
}

export async function getCurrentUserProfile() {
  try {
    const user = await currentUser()
    if (!user) return null
    const [userRow] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1)
    const [profileRow] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1)

    const merged = {
      id: user.id,
      name: userRow?.name || user.name || 'PU Student',
      email: userRow?.email || user.email,
      image: userRow?.image || user.image,
      department: userRow?.department || profileRow?.department || '',
      course: userRow?.course || profileRow?.course || '',
      year: userRow?.year || profileRow?.year || 1,
      bio: userRow?.bio || profileRow?.bio || '',
      phone: userRow?.phone || profileRow?.phone || '',
      hostel: userRow?.hostel || profileRow?.hostel || '',
    }

    const completion = checkProfileCompletion(merged)

    return {
      profile: merged,
      completion,
    }
  } catch (err) {
    console.error('[getCurrentUserProfile error]', err)
    return null
  }
}

export async function getSellerProfile(userId: string): Promise<SellerProfileData | null> {
  try {
    if (!userId) return null
    const currentUserSession = await currentUser()

    const [userRow] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1)
    if (!userRow) return null

    const sellerListings = await db
      .select()
      .from(listings)
      .where(and(eq(listings.userId, userId), eq(listings.status, 'active')))
      .orderBy(desc(listings.createdAt))

    const ratingStats = await getUserRatingStats(userId)

    if (!currentUserSession) {
      return {
        user: createAnonymousSeller(userRow.id),
        listings: sellerListings,
        ratingStats,
        isPrivate: true,
      }
    }

    return {
      user: userRow,
      listings: sellerListings,
      ratingStats,
    }
  } catch (err) {
    console.error('[getSellerProfile error]', err)
    return null
  }
}
