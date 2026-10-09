'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  notifications,
  reviews,
  transactions,
} from '@/lib/db/schema'
import { sanitizeText } from '@/lib/utils'
import { currentUser } from './validation'

export async function leaveReview(input: {
  transactionId: number
  rating: number
  body: string
}) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }
    const { transactionId, rating } = input

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be an integer between 1 and 5 stars' }
    }

    const cleanBody = sanitizeText(input.body, 5, 2000)

    const [tx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1)
    if (!tx) return { success: false, error: 'Transaction not found' }
    if (tx.status !== 'completed')
      return {
        success: false,
        error: 'Reviews can only be submitted for completed transactions',
      }

    const isBuyer = tx.buyerId === user.id
    const isSeller = tx.sellerId === user.id

    if (!isBuyer && !isSeller)
      return {
        success: false,
        error: 'Only participants of this transaction can leave a review',
      }

    const recipientId = isBuyer ? tx.sellerId : tx.buyerId

    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.transactionId, transactionId), eq(reviews.authorId, user.id)))
      .limit(1)

    if (existing[0])
      return {
        success: false,
        error: 'You have already submitted a review for this transaction',
      }

    const [review] = await db
      .insert(reviews)
      .values({
        transactionId,
        listingId: tx.listingId,
        authorId: user.id,
        recipientId,
        rating,
        body: cleanBody,
      })
      .returning()

    try {
      await db.insert(notifications).values({
        userId: recipientId,
        kind: 'review',
        title: 'New Campus Review Received!',
        body: `${user.name || 'A student'} rated you ${rating} stars: "${cleanBody.slice(0, 60)}"`,
        link: `/seller/${recipientId}`,
      })
    } catch (notifErr) {
      console.error('[leaveReview notification error]', notifErr)
    }

    revalidatePath(`/seller/${recipientId}`)
    revalidatePath('/transactions')
    return { success: true, review }
  } catch (err) {
    console.error('[leaveReview error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit review',
    }
  }
}

export async function getUserRatingStats(userId: string) {
  try {
    const revs = await db.select().from(reviews).where(eq(reviews.recipientId, userId))
    if (revs.length === 0) {
      return { averageRating: null, reviewCount: 0, reviews: [] }
    }

    const total = revs.reduce((acc, curr) => acc + curr.rating, 0)
    const average = Number((total / revs.length).toFixed(1))

    return {
      averageRating: average,
      reviewCount: revs.length,
      reviews: revs,
    }
  } catch (err) {
    console.error('[getUserRatingStats error]', err)
    return { averageRating: null, reviewCount: 0, reviews: [] }
  }
}
