'use server'

import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  blockedUsers,
  conversations,
  listings,
  messages,
  notifications,
  user as userTable,
} from '@/lib/db/schema'
import { sanitizeText } from '@/lib/utils'
import { currentUser } from './validation'

export async function startConversation(listingId: number, initialMessage?: string) {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: 'Please sign in to start a conversation' }
    if (!Number.isInteger(listingId) || listingId < 1)
      return { success: false, error: 'Invalid listing ID' }

    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1)
    if (!listing) return { success: false, error: 'Listing not found' }
    if (listing.userId === user.id) return { success: false, error: 'You are the seller of this listing' }

    const blocked = await db.select().from(blockedUsers).where(
      or(
        and(eq(blockedUsers.userId, listing.userId), eq(blockedUsers.blockedUserId, user.id)),
        and(eq(blockedUsers.userId, user.id), eq(blockedUsers.blockedUserId, listing.userId))
      )
    ).limit(1)
    if (blocked[0]) {
      return { success: false, error: 'Communication is blocked between these accounts.' }
    }

    const existing = await db.select().from(conversations)
      .where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, user.id)))
      .limit(1)

    let conversation = existing[0]
    if (!conversation) {
      const [created] = await db.insert(conversations).values({
        listingId,
        buyerId: user.id,
        sellerId: listing.userId,
        lastMessage: null,
        lastMessageAt: new Date(),
      }).returning()
      conversation = created
    }

    if (initialMessage && initialMessage.trim()) {
      const cleanContent = sanitizeText(initialMessage, 1, 2000)
      await db.insert(messages).values({
        conversationId: conversation.id,
        senderId: user.id,
        content: cleanContent,
      })
      await db.update(conversations)
        .set({ lastMessage: cleanContent, lastMessageAt: new Date() })
        .where(eq(conversations.id, conversation.id))

      try {
        const safeTitle = (listing.title || '').replace(/["""]/g, "'").slice(0, 100)
        const safeBody = `${user.name || 'A student'} asked about ${safeTitle}`.slice(0, 200)
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
  } catch (err) {
    console.error('[startConversation error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to open conversation',
    }
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

    const msgList = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)

    try {
      await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            sql`${messages.senderId} != ${user.id}`,
            sql`${messages.readAt} IS NULL`
          )
        )
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
    if (!Number.isInteger(conversationId) || conversationId < 1)
      return { success: false, error: 'Invalid conversation' }

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

    revalidatePath(`/messages/${conversationId}`)
    revalidatePath('/messages')
    revalidatePath('/notifications')
    return { success: true, message }
  } catch (err) {
    console.error('[sendMessage error]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send message',
    }
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
  } catch (err) {
    console.error('[blockUser error]', err)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to block user' }
  }
}
