'use server'

import { and, desc, eq, inArray, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  listings,
  notifications,
  transactions,
  user as userTable,
} from '@/lib/db/schema'
import { sanitizeText } from '@/lib/utils'
import { currentUser } from './validation'

export async function requestTransaction(
  listingId: number,
  paymentMethod = 'meetup_cash',
  meetupLocation = 'Pondicherry University Campus'
) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }

    const [listing] = await db
      .select()
      .from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.status, 'active')))
      .limit(1)

    if (!listing) return { success: false, error: 'Listing is not available' }
    if (listing.userId === user.id)
      return { success: false, error: 'You are the seller of this listing' }

    const [transaction] = await db
      .insert(transactions)
      .values({
        listingId,
        buyerId: user.id,
        sellerId: listing.userId,
        amount: listing.price,
        status: 'requested',
        paymentMethod,
        meetupLocation: sanitizeText(meetupLocation, 2, 200),
      })
      .returning()

    try {
      const safeTitle = (listing.title || '').replace(/["""]/g, "'").slice(0, 100)
      await db.insert(notifications).values({
        userId: listing.userId,
        kind: 'transaction',
        title: 'Purchase Request Received',
        body: `${user.name || 'A student'} requested to buy ${safeTitle} for ₹${listing.price.toLocaleString('en-IN')}`.slice(
          0,
          200
        ),
        link: `/transactions`,
      })
    } catch (notifErr) {
      console.error('[requestTransaction] notification insert failed (non-fatal):', notifErr)
    }

    revalidatePath('/transactions')
    revalidatePath('/notifications')
    return { success: true, transaction }
  } catch (err) {
    console.error('[requestTransaction error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit buy request',
    }
  }
}

export async function getMyTransactions() {
  try {
    const user = await currentUser()
    if (!user) return []

    const rows = await db
      .select({
        transaction: transactions,
        listing: listings,
        buyer: {
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          image: userTable.image,
        },
      })
      .from(transactions)
      .innerJoin(listings, eq(transactions.listingId, listings.id))
      .innerJoin(userTable, eq(transactions.buyerId, userTable.id))
      .where(or(eq(transactions.buyerId, user.id), eq(transactions.sellerId, user.id)))
      .orderBy(desc(transactions.createdAt))

    const sellerIds = [...new Set(rows.map((r) => r.transaction.sellerId))]
    const sellers =
      sellerIds.length > 0
        ? await db.select().from(userTable).where(inArray(userTable.id, sellerIds))
        : []
    const sellerMap = new Map(sellers.map((s) => [s.id, s]))

    return rows.map((r) => {
      const isBuyer = r.transaction.buyerId === user.id
      const seller = sellerMap.get(r.transaction.sellerId) || {
        name: 'Seller',
        email: '',
        image: null,
      }
      return {
        ...r.transaction,
        listing: r.listing,
        buyer: r.buyer,
        seller,
        isBuyer,
      }
    })
  } catch (err) {
    console.error('[getMyTransactions error]', err)
    return []
  }
}

export async function updateTransactionStatus(
  id: number,
  newStatus: 'accepted' | 'completed' | 'rejected' | 'cancelled' | 'disputed'
) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }
    if (!Number.isInteger(id) || id < 1)
      return { success: false, error: 'Invalid transaction' }

    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1)
    if (!tx) return { success: false, error: 'Transaction not found' }

    const isBuyer = tx.buyerId === user.id
    const isSeller = tx.sellerId === user.id

    if (!isBuyer && !isSeller)
      return { success: false, error: 'Forbidden: Unauthorized transaction access' }

    if (newStatus === 'accepted') {
      if (!isSeller)
        return { success: false, error: 'Only the seller can accept a purchase request' }
      if (!['inquiry', 'requested', 'negotiating'].includes(tx.status)) {
        return { success: false, error: `Cannot transition from ${tx.status} to accepted` }
      }
      await db.update(listings).set({ status: 'reserved' }).where(eq(listings.id, tx.listingId))
    } else if (newStatus === 'completed') {
      if (!['accepted'].includes(tx.status)) {
        return {
          success: false,
          error: 'Transaction must be accepted before marking as completed',
        }
      }
      await db.update(listings).set({ status: 'sold' }).where(eq(listings.id, tx.listingId))
    } else if (newStatus === 'rejected') {
      if (!isSeller)
        return { success: false, error: 'Only the seller can reject a transaction request' }
    } else if (newStatus === 'cancelled') {
      if (['completed', 'rejected'].includes(tx.status)) {
        return { success: false, error: 'Completed or rejected transactions cannot be cancelled' }
      }
      await db
        .update(listings)
        .set({ status: 'active' })
        .where(and(eq(listings.id, tx.listingId), eq(listings.status, 'reserved')))
    }

    const [updated] = await db
      .update(transactions)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning()

    const otherPartyId = isBuyer ? tx.sellerId : tx.buyerId
    try {
      await db.insert(notifications).values({
        userId: otherPartyId,
        kind: 'transaction',
        title: `Transaction Update: ${newStatus.toUpperCase()}`,
        body: `The transaction for item #${tx.listingId} status is now ${newStatus}.`,
        link: `/transactions`,
      })
    } catch (notifErr) {
      console.error('[updateTransactionStatus notification error]', notifErr)
    }

    revalidatePath('/transactions')
    return { success: true, transaction: updated }
  } catch (err) {
    console.error('[updateTransactionStatus error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update transaction status',
    }
  }
}
