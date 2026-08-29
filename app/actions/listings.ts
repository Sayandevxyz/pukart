'use server'

import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth, isValidPondiUniEmail, isUserAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { listings, listingImages, user as userTable, notifications } from '@/lib/db/schema'
import { checkListingForScam } from '@/lib/ai'
import { checkProfileCompletion } from '@/lib/constants/campus'

export async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  const email = session?.user?.email?.trim().toLowerCase()
  if (!session?.user?.id || !isValidPondiUniEmail(email)) {
    throw new Error('Unauthorized: Must be signed in with a verified @pondiuni.ac.in account.')
  }
  return session.user
}

export async function getListingById(id: number) {
  try {
    if (!Number.isInteger(id) || id < 1) return null

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

    return {
      ...rows[0].listing,
      phone: rows[0].listing.phone || rows[0].seller?.phone || null,
      seller: rows[0].seller,
      images: images.length > 0 ? images.map((img) => img.url) : rows[0].listing.imageUrl ? [rows[0].listing.imageUrl] : [],
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

export async function createListing(input: {
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
}) {
  const user = await getAuthenticatedUser()

  // Backend profile completion check
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

  const title = input.title.trim()
  const description = input.description.trim()
  const category = input.category.trim()
  const condition = (input.condition || 'good').toLowerCase().trim()
  const type = (input.type || 'sell').toLowerCase().trim()
  const location = input.location?.trim() || 'Pondicherry University'
  const phone = input.phone?.trim().slice(0, 25) || userProfile?.phone || null

  if (title.length < 3 || title.length > 120) throw new Error('Title must be between 3 and 120 characters')
  if (description.length < 10 || description.length > 5000) throw new Error('Description must be between 10 and 5000 characters')
  if (!Number.isInteger(input.price) || input.price <= 0 || input.price > 10000000) throw new Error('Price must be a positive integer in INR (max ₹10,000,000)')
  if (!category) throw new Error('Category is required')

  const scamCheck = checkListingForScam(title, description)

  const allImages = (input.images && input.images.length > 0 ? input.images : input.imageUrl ? [input.imageUrl] : []).filter(Boolean)
  const primaryImage = allImages[0] || input.imageUrl || null

  // If user provided a phone number and their profile didn't have one, update user profile as well
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

  if (allImages.length > 0) {
    await db.insert(listingImages).values(
      allImages.map((url, idx) => ({
        listingId: listing.id,
        url,
        displayOrder: idx,
        isPrimary: idx === 0,
      }))
    )
  }

  revalidatePath('/')
  revalidatePath('/my-listings')
  return listing
}

export async function updateListing(
  id: number,
  input: {
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
  }
) {
  const user = await getAuthenticatedUser()
  if (!Number.isInteger(id) || id < 1) throw new Error('Invalid listing ID')

  // Check ownership or admin
  const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1)
  if (!existing) throw new Error('Listing not found')

  const isAdmin = isUserAdmin(user.email, (user as { role?: string }).role)
  if (existing.userId !== user.id && !isAdmin) {
    throw new Error('Forbidden: You can only edit your own listings.')
  }

  const title = input.title.trim()
  const description = input.description.trim()
  const category = input.category.trim()
  const condition = (input.condition || existing.condition).toLowerCase().trim()
  const type = (input.type || existing.type).toLowerCase().trim()
  const phone = input.phone !== undefined ? (input.phone?.trim().slice(0, 25) || null) : existing.phone

  if (title.length < 3 || title.length > 120) throw new Error('Title must be between 3 and 120 characters')
  if (description.length < 10 || description.length > 5000) throw new Error('Description must be between 10 and 5000 characters')
  if (!Number.isInteger(input.price) || input.price <= 0 || input.price > 10000000) throw new Error('Invalid price')
  if (!category) throw new Error('Category is required')

  const allImages = (input.images && input.images.length > 0 ? input.images : input.imageUrl ? [input.imageUrl] : []).filter(Boolean)
  const primaryImage = allImages[0] || input.imageUrl || existing.imageUrl

  const [updated] = await db
    .update(listings)
    .set({
      title,
      description,
      price: input.price,
      originalPrice: input.originalPrice && input.originalPrice > 0 ? input.originalPrice : null,
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
    await db.delete(listingImages).where(eq(listingImages.listingId, id))
    await db.insert(listingImages).values(
      input.images.map((url, idx) => ({
        listingId: id,
        url,
        displayOrder: idx,
        isPrimary: idx === 0,
      }))
    )
  }

  revalidatePath('/')
  revalidatePath(`/listing/${id}`)
  revalidatePath('/my-listings')
  return updated
}

export async function setListingStatus(id: number, status: 'active' | 'reserved' | 'sold' | 'rented' | 'archived') {
  const user = await getAuthenticatedUser()
  if (!Number.isInteger(id) || id < 1) throw new Error('Invalid listing ID')

  const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1)
  if (!existing) throw new Error('Listing not found')

  const isAdmin = isUserAdmin(user.email, (user as { role?: string }).role)
  if (existing.userId !== user.id && !isAdmin) {
    throw new Error('Forbidden: You can only change status for your own listings.')
  }

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
  const user = await getAuthenticatedUser()
  if (!Number.isInteger(id) || id < 1) throw new Error('Invalid listing ID')

  const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1)
  if (!existing) throw new Error('Listing not found')

  const isAdmin = isUserAdmin(user.email, (user as { role?: string }).role)
  if (existing.userId !== user.id && !isAdmin) {
    throw new Error('Forbidden: You can only delete your own listings.')
  }

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
