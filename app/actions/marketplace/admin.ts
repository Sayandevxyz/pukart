'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  listings,
  reports,
} from '@/lib/db/schema'
import { sanitizeText } from '@/lib/utils'
import { currentUser } from './validation'

export async function reportListing(listingId: number, reason: string, details?: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }
    if (!Number.isInteger(listingId) || listingId < 1)
      return { success: false, error: 'Invalid listing' }

    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)
    if (!listing) return { success: false, error: 'Listing does not exist' }

    const cleanReason = sanitizeText(reason, 3, 150)
    const cleanDetails = details ? sanitizeText(details, 0, 1000) : null

    const [report] = await db
      .insert(reports)
      .values({
        reporterId: user.id,
        listingId,
        reportedUserId: listing.userId,
        reason: cleanReason,
        details: cleanDetails,
        status: 'open',
      })
      .returning()

    return { success: true, reported: true, reportId: report.id }
  } catch (err) {
    console.error('[reportListing error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit report',
    }
  }
}

export async function reportUser(reportedUserId: string, reason: string, details?: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }
    if (reportedUserId === user.id)
      return { success: false, error: 'Cannot report yourself' }

    const cleanReason = sanitizeText(reason, 3, 150)
    const cleanDetails = details ? sanitizeText(details, 0, 1000) : null

    const [report] = await db
      .insert(reports)
      .values({
        reporterId: user.id,
        reportedUserId,
        reason: cleanReason,
        details: cleanDetails,
        status: 'open',
      })
      .returning()

    return { success: true, reported: true, reportId: report.id }
  } catch (err) {
    console.error('[reportUser error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit report',
    }
  }
}
