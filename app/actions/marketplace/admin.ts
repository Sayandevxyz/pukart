'use server'

import { db } from '@/lib/db'
import { reports } from '@/lib/db/schema'
import { sanitizeText } from '@/lib/utils'
import { requireUser, getValidListingOrThrow } from './validation'

async function persistReport(reporterId: string, reportedUserId: string, reason: string, details?: string, listingId?: number) {
  const [created] = await db
    .insert(reports)
    .values({
      reporterId,
      listingId,
      reportedUserId,
      reason: sanitizeText(reason, 3, 150),
      details: details ? sanitizeText(details, 0, 1000) : null,
      status: 'open',
    })
    .returning()
  return created
}

export async function reportListing(listingId: number, reason: string, details?: string) {
  try {
    const user = await requireUser()
    const listing = await getValidListingOrThrow(listingId)

    const report = await persistReport(user.id, listing.userId, reason, details, listingId)
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
    const user = await requireUser()
    if (reportedUserId === user.id)
      return { success: false, error: 'Cannot report yourself' }

    const report = await persistReport(user.id, reportedUserId, reason, details)
    return { success: true, reported: true, reportId: report.id }
  } catch (err) {
    console.error('[reportUser error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit report',
    }
  }
}
