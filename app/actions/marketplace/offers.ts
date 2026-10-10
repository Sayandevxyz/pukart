'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  listings,
  offers,
  transactions,
} from '@/lib/db/schema'
import { sanitizeText } from '@/lib/utils'
import { currentUser, createSafeNotification, formatSafeListingTitle, getValidListingOrThrow } from './validation'

export async function makeOffer(listingId: number, amount: number, message?: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in to make an offer' }
    if (!Number.isInteger(amount) || amount <= 0 || amount > 10000000)
      return { success: false, error: 'Invalid offer amount in INR' }

    const listing = await getValidListingOrThrow(listingId)
    if (listing.status !== 'active')
      return { success: false, error: 'Listing is no longer active' }
    if (listing.userId === user.id)
      return { success: false, error: 'You are the seller of this listing' }

    const [offer] = await db
      .insert(offers)
      .values({
        listingId,
        buyerId: user.id,
        sellerId: listing.userId,
        amount,
        message: message ? sanitizeText(message, 1, 500) : null,
        status: 'pending',
      })
      .returning()

    const safeTitle = await formatSafeListingTitle(listing.title)
    await createSafeNotification({
      userId: listing.userId,
      kind: 'offer',
      title: 'New Offer Received!',
      body: `${user.name || 'A student'} offered ₹${amount.toLocaleString('en-IN')} for ${safeTitle}`.slice(0, 200),
      link: '/transactions',
    })

    revalidatePath('/transactions')
    revalidatePath('/notifications')
    return { success: true, offer }
  } catch (err) {
    console.error('[makeOffer error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit offer',
    }
  }
}

export async function respondToOffer(
  offerId: number,
  action: 'accept' | 'reject' | 'counter',
  counterAmount?: number
) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }
    if (!Number.isInteger(offerId) || offerId < 1)
      return { success: false, error: 'Invalid offer ID' }

    const [offer] = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1)
    if (!offer) return { success: false, error: 'Offer not found' }

    if (offer.sellerId !== user.id && offer.buyerId !== user.id) {
      return { success: false, error: 'Forbidden: Unauthorized offer access' }
    }

    const otherPartyId = offer.sellerId === user.id ? offer.buyerId : offer.sellerId

    if (action === 'accept') {
      if (offer.sellerId !== user.id && offer.status !== 'countered') {
        return { success: false, error: 'Only recipient can accept' }
      }

      const [updatedOffer] = await db
        .update(offers)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(offers.id, offerId))
        .returning()

      const [tx] = await db
        .insert(transactions)
        .values({
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          offerId: offer.id,
          amount: offer.counterAmount || offer.amount,
          status: 'accepted',
        })
        .returning()

      await db.update(listings).set({ status: 'reserved' }).where(eq(listings.id, offer.listingId))

      const acceptedAmt = (offer.counterAmount || offer.amount).toLocaleString('en-IN')
      await createSafeNotification({
        userId: otherPartyId,
        kind: 'offer_accepted',
        title: 'Offer Accepted!',
        body: `Your offer for ₹${acceptedAmt} was accepted. Ready for campus meetup.`,
        link: '/transactions',
      })

      revalidatePath('/transactions')
      return { success: true, offer: updatedOffer, transaction: tx }
    }

    if (action === 'reject') {
      const [updatedOffer] = await db
        .update(offers)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(offers.id, offerId))
        .returning()

      await createSafeNotification({
        userId: otherPartyId,
        kind: 'offer_rejected',
        title: 'Offer Declined',
        body: 'Offer was declined. You can message the seller to negotiate.',
        link: '/transactions',
      })

      revalidatePath('/transactions')
      return { success: true, offer: updatedOffer }
    }

    if (action === 'counter') {
      if (!counterAmount || counterAmount <= 0)
        return { success: false, error: 'Valid counter amount required' }
      if (offer.sellerId !== user.id)
        return { success: false, error: 'Only seller can propose counter offer' }

      const [updatedOffer] = await db
        .update(offers)
        .set({
          status: 'countered',
          counterAmount,
          updatedAt: new Date(),
        })
        .where(eq(offers.id, offerId))
        .returning()

      await createSafeNotification({
        userId: offer.buyerId,
        kind: 'offer',
        title: 'Counter Offer Proposed',
        body: `Seller countered with ₹${counterAmount.toLocaleString('en-IN')}`,
        link: '/transactions',
      })

      revalidatePath('/transactions')
      return { success: true, offer: updatedOffer }
    }

    return { success: false, error: 'Invalid action' }
  } catch (err) {
    console.error('[respondToOffer error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update offer',
    }
  }
}
