import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { listings, listingImages } from '@/lib/db/schema'
import type { ListingInput } from './listings'

export function sanitizeListingPayload(
  input: ListingInput,
  existing?: typeof listings.$inferSelect
) {
  const title = input.title.trim()
  const description = input.description.trim()
  const category = input.category.trim()
  const condition = (input.condition || existing?.condition || 'good').toLowerCase().trim()
  const type = (input.type || existing?.type || 'sell').toLowerCase().trim()

  if (title.length < 3 || title.length > 120) throw new Error('Title must be between 3 and 120 characters')
  if (description.length < 10 || description.length > 5000) throw new Error('Description must be between 10 and 5000 characters')
  if (!Number.isInteger(input.price) || input.price <= 0 || input.price > 10000000) {
    throw new Error('Price must be a positive integer in INR (max ₹10,000,000)')
  }
  if (!category) throw new Error('Category is required')

  const allImages = (input.images && input.images.length > 0 ? input.images : input.imageUrl ? [input.imageUrl] : []).filter(Boolean)
  const primaryImage = allImages[0] || input.imageUrl || existing?.imageUrl || null

  const resolvedPriceUnit = input.dailyRentPrice && input.dailyRentPrice > 0
    ? `daily_${input.dailyRentPrice}`
    : (input.priceUnit !== undefined ? input.priceUnit : (existing?.priceUnit || 'item'))

  return { title, description, category, condition, type, allImages, primaryImage, resolvedPriceUnit }
}

export async function persistListingImages(listingId: number, images: string[], isUpdate = false) {
  if (isUpdate) {
    await db.delete(listingImages).where(eq(listingImages.listingId, listingId))
  }
  if (images.length > 0) {
    await db.insert(listingImages).values(
      images.map((url, idx) => ({
        listingId,
        url,
        displayOrder: idx,
        isPrimary: idx === 0,
      }))
    )
  }
}
