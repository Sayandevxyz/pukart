'use server'

import { and, desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth, isValidPondiUniEmail, isUserAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { listings, listingImages, user as userTable } from '@/lib/db/schema'
import { checkListingForScam } from '@/lib/ai'
import { checkProfileCompletion } from '@/lib/constants/campus'

export interface ListingInput {
  title: string
  description: string
  price: number
  originalPrice?: number
  category: string
  type?: string
  condition?: string
  imageUrl?: string
  images?: string[]
  location?: string
  phone?: string
  dailyRentPrice?: number
  priceUnit?: string
}

export async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  const email = session?.user?.email?.trim().toLowerCase()
  if (!session?.user?.id || !isValidPondiUniEmail(email)) {
    throw new Error('Unauthorized: Must be signed in to perform this action.')
  }
  return session.user
}

async function requireListingOwnerOrAdmin(id: number, actionName: string) {
  const user = await getAuthenticatedUser()
  if (!Number.isInteger(id) || id < 1) throw new Error('Invalid listing ID')
  const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1)
  if (!existing) throw new Error('Listing not found')
  const isAdmin = isUserAdmin(user.email, (user as { role?: string }).role)
  if (existing.userId !== user.id && !isAdmin) {
    throw new Error(`Forbidden: You can only ${actionName} for your own listings.`)
  }
  return { user, existing }
}

import { sanitizeListingPayload, persistListingImages } from './listings-helpers'
import { createAnonymousSeller } from './marketplace/validation'

export async function getListingById(id: number) {
  try {
    if (!Number.isInteger(id) || id < 1) return null

    let isAuthenticatedStudent = false
    try {
      const user = await getAuthenticatedUser()
      if (user) isAuthenticatedStudent = true
    } catch {
      isAuthenticatedStudent = false
    }

    const rows = await db
      .select({
        listing: listings,
        seller: {
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          image: userTable.image,
          department: userTable.department,
          course: userTable.course,
          year: userTable.year,
          bio: userTable.bio,
          phone: userTable.phone,
        },
      })
      .from(listings)
      .leftJoin(userTable, eq(listings.userId, userTable.id))
      .where(eq(listings.id, id))
      .limit(1)

    if (!rows[0]) return null

    const images = await db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, id))
      .orderBy(listingImages.displayOrder)

    const rawListing = rows[0].listing
    const rawSeller = rows[0].seller

    const sanitizedPhone = isAuthenticatedStudent ? (rawListing.phone || rawSeller?.phone || null) : null
    const sanitizedSeller = isAuthenticatedStudent
      ? rawSeller
      : createAnonymousSeller(rawSeller?.id)

    return {
      ...rawListing,
      sellerName: isAuthenticatedStudent ? rawListing.sellerName : 'Verified PU Student',
      phone: sanitizedPhone,
      seller: sanitizedSeller,
      images: images.length > 0 ? images.map((img) => img.url) : rawListing.imageUrl ? [rawListing.imageUrl] : [],
    }
  } catch (err) {
    console.error('[getListingById error]', err)
    return null
  }
}

export async function getActiveListings() {
  return db
    .select()
    .from(listings)
    .where(eq(listings.status, 'active'))
    .orderBy(desc(listings.createdAt))
}

export async function createListing(input: ListingInput) {
  const user = await getAuthenticatedUser()

  const [userProfile] = await db.select().from(userTable).where(eq(userTable.id, user.id)).limit(1)
  if (userProfile) {
    const profileCheck = checkProfileCompletion({
      department: userProfile.department,
      course: userProfile.course,
      year: userProfile.year,
      hostel: userProfile.hostel,
    })
    if (!profileCheck.isComplete) {
      throw new Error(`Please complete your profile before listing. Missing: ${profileCheck.missingFields.join(', ')}`)
    }
  }

  const { title, description, category, condition, type, allImages, primaryImage, resolvedPriceUnit } =
    sanitizeListingPayload(input)

  const location = input.location?.trim() || 'Pondicherry University'
  const phone = input.phone?.trim().slice(0, 25) || userProfile?.phone || null
  const scamCheck = checkListingForScam(title, description)

  if (input.phone?.trim() && !userProfile?.phone) {
    try {
      await db.update(userTable).set({ phone: input.phone.trim().slice(0, 25) }).where(eq(userTable.id, user.id))
    } catch (profileErr) {
      console.error('[createListing] profile phone sync error:', profileErr)
    }
  }

  const [listing] = await db
    .insert(listings)
    .values({
      userId: user.id,
      sellerName: user.name || 'Pondicherry University Student',
      title,
      description,
      price: input.price,
      originalPrice: input.originalPrice && input.originalPrice > 0 ? input.originalPrice : null,
      priceUnit: resolvedPriceUnit,
      type,
      category,
      condition,
      imageUrl: primaryImage,
      location,
      phone,
      status: 'active',
      aiFlagged: scamCheck.flagged,
      aiFlagReason: scamCheck.reason,
    })
    .returning()

  await persistListingImages(listing.id, allImages, false)

  revalidatePath('/')
  revalidatePath('/my-listings')
  return listing
}

export async function updateListing(id: number, input: ListingInput) {
  const { existing } = await requireListingOwnerOrAdmin(id, 'edit')
  const { title, description, category, condition, type, primaryImage, resolvedPriceUnit } =
    sanitizeListingPayload(input, existing)

  const phone = input.phone !== undefined ? (input.phone?.trim().slice(0, 25) || null) : existing.phone

  const [updated] = await db
    .update(listings)
    .set({
      title,
      description,
      price: input.price,
      originalPrice: input.originalPrice && input.originalPrice > 0 ? input.originalPrice : null,
      priceUnit: resolvedPriceUnit,
      category,
      condition,
      type,
      imageUrl: primaryImage,
      location: input.location?.trim() || existing.location,
      phone,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning()

  if (input.images && input.images.length > 0) {
    await persistListingImages(id, input.images, true)
  }

  revalidatePath('/')
  revalidatePath(`/listing/${id}`)
  revalidatePath('/my-listings')
  return updated
}

export async function setListingDailyRentPrice(listingId: number, dailyPrice: number) {
  if (!Number.isInteger(dailyPrice) || dailyPrice < 20 || dailyPrice > 10000) {
    throw new Error('Daily rental price must be an integer between ₹20 and ₹10,000')
  }

  await requireListingOwnerOrAdmin(listingId, 'customize rental price')

  const encodedUnit = `daily_${dailyPrice}`
  const [updated] = await db
    .update(listings)
    .set({
      priceUnit: encodedUnit,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId))
    .returning()

  revalidatePath(`/listing/${listingId}`)
  revalidatePath('/')
  return { success: true, dailyPrice, priceUnit: encodedUnit, listing: updated }
}

export async function setListingStatus(id: number, status: 'active' | 'reserved' | 'sold' | 'rented' | 'archived') {
  await requireListingOwnerOrAdmin(id, 'change status')

  const [updated] = await db
    .update(listings)
    .set({ status, updatedAt: new Date() })
    .where(eq(listings.id, id))
    .returning()

  revalidatePath('/')
  revalidatePath(`/listing/${id}`)
  revalidatePath('/my-listings')
  return updated
}

export async function archiveListing(id: number) {
  return setListingStatus(id, 'archived')
}

export async function deleteListing(id: number) {
  await requireListingOwnerOrAdmin(id, 'delete')

  await db.delete(listings).where(eq(listings.id, id))

  revalidatePath('/')
  revalidatePath('/my-listings')
  return { success: true }
}

export async function getMyListings(statusFilter?: string) {
  const user = await getAuthenticatedUser()

  let query = db.select().from(listings).where(eq(listings.userId, user.id))
  if (statusFilter && statusFilter !== 'all') {
    query = db.select().from(listings).where(and(eq(listings.userId, user.id), eq(listings.status, statusFilter)))
  }

  return query.orderBy(desc(listings.createdAt))
}

export async function incrementListingViews(id: number) {
  if (!Number.isInteger(id) || id < 1) return
  await db
    .update(listings)
    .set({ viewsCount: sql`${listings.viewsCount} + 1` })
    .where(eq(listings.id, id))
}
