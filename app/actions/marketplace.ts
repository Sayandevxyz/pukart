'use server'

import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth, isValidPondiUniEmail, isUserAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  conversations,
  favorites,
  listings,
  messages,
  notifications,
  offers,
  profiles,
  reports,
  reviews,
  transactions,
  user as userTable,
  blockedUsers,
} from '@/lib/db/schema'
import { checkProfileCompletion } from '@/lib/constants/campus'
import { sendPushNotification } from '@/lib/push'

async function currentUser() {
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

function sanitizeText(value: unknown, min: number, max: number): string {
  if (typeof value !== 'string') throw new Error('Invalid text format')
  const clean = value.trim()
  if (clean.length < min || clean.length > max) {
    throw new Error(`Text must be between ${min} and ${max} characters`)
  }
  return clean
}

// ==========================================
// 1. FAVORITES SYSTEM (Priority 6)
// ==========================================

export async function toggleFavorite(listingId: number) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in with your official @pondiuni.ac.in account' }
    if (!Number.isInteger(listingId) || listingId < 1) return { success: false, error: 'Invalid listing ID' }

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

    // Verify listing exists
    const [targetListing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)
    if (!targetListing) return { success: false, error: 'Listing does not exist' }

    await db.insert(favorites).values({ userId: user.id, listingId })

    // Send notification to listing owner if it is someone else
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
  } catch (err: any) {
    console.error('[toggleFavorite error]', err)
    return { success: false, error: err.message || 'Failed to update favorite' }
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

// ==========================================
// 2. CHAT & MESSAGING SYSTEM (Priority 7)
// ==========================================

export async function startConversation(listingId: number, initialMessage?: string) {
  try {
    const user = await currentUser()
    if (!Number.isInteger(listingId) || listingId < 1) {
      return { success: false, error: 'Invalid listing ID' }
    }

    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1)

    if (!listing) {
      return { success: false, error: 'Listing not found' }
    }
    if (listing.userId === user.id) {
      return { success: false, error: 'You are the seller of this listing' }
    }

    // Check if buyer is blocked by seller or vice versa
    const blocked = await db
      .select()
      .from(blockedUsers)
      .where(
        or(
          and(eq(blockedUsers.userId, listing.userId), eq(blockedUsers.blockedUserId, user.id)),
          and(eq(blockedUsers.userId, user.id), eq(blockedUsers.blockedUserId, listing.userId))
        )
      )
      .limit(1)
    if (blocked[0]) {
      return { success: false, error: 'Communication is blocked between these accounts.' }
    }

    // Find existing conversation
    const existing = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, user.id)))
      .limit(1)

    let conversation = existing[0]
    if (!conversation) {
      const [created] = await db
        .insert(conversations)
        .values({
          listingId,
          buyerId: user.id,
          sellerId: listing.userId,
          lastMessage: null,
          lastMessageAt: new Date(),
        })
        .returning()
      conversation = created
    }

    // Only if a non-empty initialMessage was explicitly provided, insert it
    if (initialMessage && initialMessage.trim()) {
      const cleanContent = sanitizeText(initialMessage, 1, 2000)
      await db.insert(messages).values({
        conversationId: conversation.id,
        senderId: user.id,
        content: cleanContent,
      })

      await db
        .update(conversations)
        .set({ lastMessage: cleanContent, lastMessageAt: new Date() })
        .where(eq(conversations.id, conversation.id))

      try {
        const safeTitle = (listing.title || '').replace(/["""]/g, "'").slice(0, 100)
        const safeBody = `${(user.name || 'A student')} asked about ${safeTitle}`.slice(0, 200)
        await db.insert(notifications).values({
          userId: listing.userId,
          kind: 'message',
          title: 'New Campus Inquiry',
          body: safeBody,
          link: `/messages/${conversation.id}`,
        })
      } catch (notifErr) {
        console.error('[startConversation] notification insert failed (non-fatal):', notifErr)
      }
    }

    revalidatePath('/messages')
    return { success: true, id: conversation.id, conversation }
  } catch (err: any) {
    console.error('[startConversation error]', err)
    return { success: false, error: err.message || 'Unable to open conversation' }
  }
}

export async function getMyConversations() {
  try {
    const user = await currentUser()
    if (!user) return []

    const rows = await db
      .select({
        conversation: conversations,
        listing: listings,
        buyer: {
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          image: userTable.image,
        },
      })
      .from(conversations)
      .innerJoin(listings, eq(conversations.listingId, listings.id))
      .innerJoin(userTable, eq(conversations.buyerId, userTable.id))
      .where(or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id)))
      .orderBy(desc(conversations.lastMessageAt))

    // Also fetch seller information
    const sellerIds = [...new Set(rows.map((r) => r.conversation.sellerId))]
    const sellers = sellerIds.length > 0
      ? await db.select().from(userTable).where(inArray(userTable.id, sellerIds))
      : []
    const sellerMap = new Map(sellers.map((s) => [s.id, s]))

    return rows.map((r) => {
      const isBuyer = r.conversation.buyerId === user.id
      const otherUser = isBuyer ? sellerMap.get(r.conversation.sellerId) : r.buyer
      return {
        ...r.conversation,
        listing: r.listing,
        otherUser: otherUser || { name: 'Campus Student', email: '', image: null },
        isBuyer,
      }
    })
  } catch (err) {
    console.error('[getMyConversations error]', err)
    return []
  }
}

export async function getConversationById(conversationId: number) {
  try {
    const user = await currentUser()
    if (!user || !Number.isInteger(conversationId) || conversationId < 1) return null

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id))
        )
      )
      .limit(1)

    if (!conversation) return null

    const [listing] = await db.select().from(listings).where(eq(listings.id, conversation.listingId)).limit(1)

    const otherUserId = conversation.buyerId === user.id ? conversation.sellerId : conversation.buyerId
    const [otherUser] = await db.select().from(userTable).where(eq(userTable.id, otherUserId)).limit(1)

    // Fetch messages
    const msgList = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)

    // Mark unread messages as read
    try {
      await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(and(eq(messages.conversationId, conversationId), sql`${messages.senderId} != ${user.id}`, sql`${messages.readAt} IS NULL`))
    } catch {}

    return {
      conversation,
      listing,
      otherUser: otherUser || { id: otherUserId, name: 'Campus Student', image: null },
      messages: msgList,
    }
  } catch (err) {
    console.error('[getConversationById error]', err)
    return null
  }
}

export async function sendMessage(conversationId: number, content: string, imageUrl?: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in to send messages' }
    if (!Number.isInteger(conversationId) || conversationId < 1) return { success: false, error: 'Invalid conversation' }

    const [conv] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id))
        )
      )
      .limit(1)

    if (!conv) return { success: false, error: 'Conversation not found or unauthorized' }

    const cleanContent = sanitizeText(content, 1, 3000)

    const [message] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: user.id,
        content: cleanContent,
        imageUrl: imageUrl?.trim() || null,
      })
      .returning()

    await db
      .update(conversations)
      .set({ lastMessage: cleanContent, lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId))

    const recipientId = conv.buyerId === user.id ? conv.sellerId : conv.buyerId

    try {
      await db.insert(notifications).values({
        userId: recipientId,
        kind: 'message',
        title: `Message from ${(user.name || 'PU Student').slice(0, 40)}`,
        body: cleanContent.slice(0, 100),
        link: `/messages/${conversationId}`,
      })
    } catch (notifErr) {
      console.error('[sendMessage notification error]', notifErr)
    }

    // Send Lockscreen Web Push Notification
    try {
      sendPushNotification(recipientId, {
        title: `Message from ${(user.name || 'PU Student').slice(0, 40)}`,
        body: cleanContent.slice(0, 100),
        url: `/messages/${conversationId}`,
        tag: `msg-${conversationId}`,
      }).catch((e) => console.error('[sendMessage push async error]', e))
    } catch (pushErr) {
      console.error('[sendMessage push error]', pushErr)
    }

    revalidatePath(`/messages/${conversationId}`)
    revalidatePath('/messages')
    revalidatePath('/notifications')
    return { success: true, message }
  } catch (err: any) {
    console.error('[sendMessage error]', err)
    return { success: false, error: err.message || 'Failed to send message' }
  }
}

export async function blockUser(targetUserId: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }
    if (targetUserId === user.id) return { success: false, error: 'Cannot block yourself' }

    await db
      .insert(blockedUsers)
      .values({ userId: user.id, blockedUserId: targetUserId })
      .onConflictDoNothing()

    return { success: true, blocked: true }
  } catch (err: any) {
    console.error('[blockUser error]', err)
    return { success: false, error: err.message || 'Failed to block user' }
  }
}

// ==========================================
// 3. MAKE OFFER SYSTEM (Priority 9)
// ==========================================

export async function makeOffer(listingId: number, amount: number, message?: string) {
  try {
    const user = await currentUser()
    if (!Number.isInteger(listingId) || listingId < 1) return { success: false, error: 'Invalid listing' }
    if (!Number.isInteger(amount) || amount <= 0 || amount > 10000000) return { success: false, error: 'Invalid offer amount in INR' }

    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)
    if (!listing || listing.status !== 'active') return { success: false, error: 'Listing is no longer active' }
    if (listing.userId === user.id) return { success: false, error: 'You are the seller of this listing' }

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

    // Notify seller (non-blocking)
    try {
      const safeTitle = (listing.title || '').replace(/["""]/g, "'").slice(0, 100)
      await db.insert(notifications).values({
        userId: listing.userId,
        kind: 'offer',
        title: 'New Offer Received!',
        body: `${user.name || 'A student'} offered ₹${amount.toLocaleString('en-IN')} for ${safeTitle}`.slice(0, 200),
        link: `/transactions`,
      })

      // Send Lockscreen Web Push Notification
      sendPushNotification(listing.userId, {
        title: 'New Offer Received!',
        body: `${user.name || 'A student'} offered ₹${amount.toLocaleString('en-IN')} for ${safeTitle}`,
        url: `/transactions`,
        tag: `offer-${listing.id}`,
      }).catch((e) => console.error('[makeOffer push async error]', e))
    } catch (notifErr) {
      console.error('[makeOffer] notification insert failed (non-fatal):', notifErr)
    }

    revalidatePath('/transactions')
    revalidatePath('/notifications')
    return { success: true, offer }
  } catch (err: any) {
    console.error('[makeOffer error]', err)
    return { success: false, error: err.message || 'Failed to submit offer' }
  }
}

export async function respondToOffer(offerId: number, action: 'accept' | 'reject' | 'counter', counterAmount?: number) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }
    if (!Number.isInteger(offerId) || offerId < 1) return { success: false, error: 'Invalid offer ID' }

    const [offer] = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1)
    if (!offer) return { success: false, error: 'Offer not found' }

    if (offer.sellerId !== user.id && offer.buyerId !== user.id) {
      return { success: false, error: 'Forbidden: Unauthorized offer access' }
    }

    if (action === 'accept') {
      if (offer.sellerId !== user.id && offer.status !== 'countered') {
        return { success: false, error: 'Only recipient can accept' }
      }

      const [updatedOffer] = await db
        .update(offers)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(offers.id, offerId))
        .returning()

      // Automatically create transaction in 'accepted' status
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

      // Update listing to reserved
      await db.update(listings).set({ status: 'reserved' }).where(eq(listings.id, offer.listingId))

      // Notify other party
      const targetUserId = offer.sellerId === user.id ? offer.buyerId : offer.sellerId
      try {
        await db.insert(notifications).values({
          userId: targetUserId,
          kind: 'offer_accepted',
          title: 'Offer Accepted!',
          body: `Your offer for ₹${(offer.counterAmount || offer.amount).toLocaleString('en-IN')} was accepted. Ready for campus meetup.`,
          link: `/transactions`,
        })

        // Send Lockscreen Web Push Notification
        sendPushNotification(targetUserId, {
          title: 'Offer Accepted!',
          body: `Your offer for ₹${(offer.counterAmount || offer.amount).toLocaleString('en-IN')} was accepted. Ready for campus meetup.`,
          url: `/transactions`,
          tag: `offer-${offer.id}`,
        }).catch((e) => console.error('[respondToOffer push async error]', e))
      } catch (notifErr) {
        console.error('[respondToOffer notification error]', notifErr)
      }

      revalidatePath('/transactions')
      return { success: true, offer: updatedOffer, transaction: tx }
    }

    if (action === 'reject') {
      const [updatedOffer] = await db
        .update(offers)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(offers.id, offerId))
        .returning()

      const targetUserId = offer.sellerId === user.id ? offer.buyerId : offer.sellerId
      try {
        await db.insert(notifications).values({
          userId: targetUserId,
          kind: 'offer_rejected',
          title: 'Offer Declined',
          body: `Offer was declined. You can message the seller to negotiate.`,
          link: `/transactions`,
        })
      } catch (notifErr) {
        console.error('[respondToOffer notification error]', notifErr)
      }

      revalidatePath('/transactions')
      return { success: true, offer: updatedOffer }
    }

    if (action === 'counter') {
      if (!counterAmount || counterAmount <= 0) return { success: false, error: 'Valid counter amount required' }
      if (offer.sellerId !== user.id) return { success: false, error: 'Only seller can propose counter offer' }

      const [updatedOffer] = await db
        .update(offers)
        .set({
          status: 'countered',
          counterAmount,
          updatedAt: new Date(),
        })
        .where(eq(offers.id, offerId))
        .returning()

      try {
        await db.insert(notifications).values({
          userId: offer.buyerId,
          kind: 'offer',
          title: 'Counter Offer Proposed',
          body: `Seller countered with ₹${counterAmount.toLocaleString('en-IN')}`,
          link: `/transactions`,
        })
      } catch (notifErr) {
        console.error('[respondToOffer notification error]', notifErr)
      }

      revalidatePath('/transactions')
      return { success: true, offer: updatedOffer }
    }

    return { success: false, error: 'Invalid action' }
  } catch (err: any) {
    console.error('[respondToOffer error]', err)
    return { success: false, error: err.message || 'Failed to update offer' }
  }
}

// ==========================================
// 4. TRANSACTIONS STATE MACHINE (Priority 8)
// ==========================================

export async function requestTransaction(listingId: number, paymentMethod = 'meetup_cash', meetupLocation = 'Pondicherry University Campus') {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }

    const [listing] = await db
      .select()
      .from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.status, 'active')))
      .limit(1)

    if (!listing) return { success: false, error: 'Listing is not available' }
    if (listing.userId === user.id) return { success: false, error: 'You are the seller of this listing' }

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

    // Notify seller (non-blocking)
    try {
      const safeTitle = (listing.title || '').replace(/["""]/g, "'").slice(0, 100)
      await db.insert(notifications).values({
        userId: listing.userId,
        kind: 'transaction',
        title: 'Purchase Request Received',
        body: `${user.name || 'A student'} requested to buy ${safeTitle} for ₹${listing.price.toLocaleString('en-IN')}`.slice(0, 200),
        link: `/transactions`,
      })

      // Send Lockscreen Web Push Notification
      sendPushNotification(listing.userId, {
        title: 'Purchase Request Received!',
        body: `${user.name || 'A student'} requested to buy ${safeTitle} for ₹${listing.price.toLocaleString('en-IN')}`,
        url: `/transactions`,
        tag: `tx-${listing.id}`,
      }).catch((e) => console.error('[requestTransaction push async error]', e))
    } catch (notifErr) {
      console.error('[requestTransaction] notification insert failed (non-fatal):', notifErr)
    }

    revalidatePath('/transactions')
    revalidatePath('/notifications')
    return { success: true, transaction }
  } catch (err: any) {
    console.error('[requestTransaction error]', err)
    return { success: false, error: err.message || 'Failed to submit buy request' }
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
    const sellers = sellerIds.length > 0 ? await db.select().from(userTable).where(inArray(userTable.id, sellerIds)) : []
    const sellerMap = new Map(sellers.map((s) => [s.id, s]))

    return rows.map((r) => {
      const isBuyer = r.transaction.buyerId === user.id
      const seller = sellerMap.get(r.transaction.sellerId) || { name: 'Seller', email: '', image: null }
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
    if (!Number.isInteger(id) || id < 1) return { success: false, error: 'Invalid transaction' }

    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1)
    if (!tx) return { success: false, error: 'Transaction not found' }

    const isBuyer = tx.buyerId === user.id
    const isSeller = tx.sellerId === user.id

    if (!isBuyer && !isSeller) return { success: false, error: 'Forbidden: Unauthorized transaction access' }

    // State Machine Validation
    if (newStatus === 'accepted') {
      if (!isSeller) return { success: false, error: 'Only the seller can accept a purchase request' }
      if (!['inquiry', 'requested', 'negotiating'].includes(tx.status)) {
        return { success: false, error: `Cannot transition from ${tx.status} to accepted` }
      }
      // Mark listing as reserved
      await db.update(listings).set({ status: 'reserved' }).where(eq(listings.id, tx.listingId))
    } else if (newStatus === 'completed') {
      if (!['accepted'].includes(tx.status)) {
        return { success: false, error: 'Transaction must be accepted before marking as completed' }
      }
      // Mark listing as sold
      await db.update(listings).set({ status: 'sold' }).where(eq(listings.id, tx.listingId))
    } else if (newStatus === 'rejected') {
      if (!isSeller) return { success: false, error: 'Only the seller can reject a transaction request' }
    } else if (newStatus === 'cancelled') {
      if (['completed', 'rejected'].includes(tx.status)) {
        return { success: false, error: 'Completed or rejected transactions cannot be cancelled' }
      }
      // If listing was reserved, return it to active
      await db.update(listings).set({ status: 'active' }).where(and(eq(listings.id, tx.listingId), eq(listings.status, 'reserved')))
    }

    const [updated] = await db
      .update(transactions)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning()

    // Send status change notification to the other party
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
  } catch (err: any) {
    console.error('[updateTransactionStatus error]', err)
    return { success: false, error: err.message || 'Failed to update transaction status' }
  }
}

// ==========================================
// 5. REVIEWS SYSTEM (Priority 10)
// ==========================================

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

    const [tx] = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1)
    if (!tx) return { success: false, error: 'Transaction not found' }
    if (tx.status !== 'completed') return { success: false, error: 'Reviews can only be submitted for completed transactions' }

    const isBuyer = tx.buyerId === user.id
    const isSeller = tx.sellerId === user.id

    if (!isBuyer && !isSeller) return { success: false, error: 'Only participants of this transaction can leave a review' }

    const recipientId = isBuyer ? tx.sellerId : tx.buyerId

    // Check duplicate review
    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.transactionId, transactionId), eq(reviews.authorId, user.id)))
      .limit(1)

    if (existing[0]) return { success: false, error: 'You have already submitted a review for this transaction' }

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
  } catch (err: any) {
    console.error('[leaveReview error]', err)
    return { success: false, error: err.message || 'Failed to submit review' }
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

// ==========================================
// 6. NOTIFICATIONS SYSTEM (Priority 11)
// ==========================================

export async function getNotifications() {
  try {
    const user = await currentUser()
    if (!user) return []
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(60)
  } catch (err) {
    console.error('[getNotifications error]', err)
    return []
  }
}

export async function markNotificationRead(id: number) {
  try {
    const user = await currentUser()
    if (!user) return { success: false }
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
    revalidatePath('/notifications')
    return { success: true }
  } catch (err) {
    console.error('[markNotificationRead error]', err)
    return { success: false }
  }
}

export async function markAllNotificationsRead() {
  try {
    const user = await currentUser()
    if (!user) return { success: false }
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, user.id), sql`${notifications.readAt} IS NULL`))
    revalidatePath('/notifications')
    return { success: true }
  } catch (err) {
    console.error('[markAllNotificationsRead error]', err)
    return { success: false }
  }
}

// ==========================================
// 7. REPORTS & MODERATION (Priority 13)
// ==========================================

export async function reportListing(listingId: number, reason: string, details?: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }
    if (!Number.isInteger(listingId) || listingId < 1) return { success: false, error: 'Invalid listing' }

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
  } catch (err: any) {
    console.error('[reportListing error]', err)
    return { success: false, error: err.message || 'Failed to submit report' }
  }
}

export async function reportUser(reportedUserId: string, reason: string, details?: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in' }
    if (reportedUserId === user.id) return { success: false, error: 'Cannot report yourself' }

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
  } catch (err: any) {
    console.error('[reportUser error]', err)
    return { success: false, error: err.message || 'Failed to submit report' }
  }
}

// ==========================================
// 8. PROFILE ACTIONS
// ==========================================

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
    const year = input.year && Number.isInteger(input.year) && input.year >= 1 && input.year <= 8 ? input.year : null
    const bio = input.bio ? sanitizeText(input.bio, 0, 500) : null
    const phone = input.phone ? sanitizeText(input.phone, 0, 20) : null
    const hostel = input.hostel ? sanitizeText(input.hostel, 0, 100) : null

    // Update user record
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

    // Update profile record for backwards compatibility
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
  } catch (err: any) {
    console.error('[saveProfile error]', err)
    return { success: false, error: err.message || 'Failed to save profile' }
  }
}

export async function getCurrentUserProfile() {
  try {
    const user = await currentUser()
    if (!user) return null
    const [userRow] = await db.select().from(userTable).where(eq(userTable.id, user.id)).limit(1)
    const [profileRow] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1)

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

export async function getSellerProfile(userId: string) {
  try {
    if (!userId) return null
    const currentUserSession = await currentUser()

    const [userRow] = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1)
    if (!userRow) return null

    const sellerListings = await db
      .select()
      .from(listings)
      .where(and(eq(listings.userId, userId), eq(listings.status, 'active')))
      .orderBy(desc(listings.createdAt))

    const ratingStats = await getUserRatingStats(userId)

    if (!currentUserSession) {
      return {
        user: {
          id: userRow.id,
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
        },
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
