'use server'

import { and, desc, eq, inArray, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { conversations, favorites, listings, messages, notifications, profiles, reports, transactions, reviews } from '@/lib/db/schema'

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id || !session.user.email.toLowerCase().endsWith('@pondiuni.ac.in')) throw new Error('Only verified Pondicherry University accounts can use this feature')
  return session.user
}

function text(value: unknown, max: number) {
  if (typeof value !== 'string') throw new Error('Invalid input')
  const clean = value.trim()
  if (!clean || clean.length > max) throw new Error('Invalid input')
  return clean
}

export async function toggleFavorite(listingId: number) {
  const user = await currentUser()
  if (!Number.isInteger(listingId) || listingId < 1) throw new Error('Invalid listing')
  const existing = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.listingId, listingId))).limit(1)
  if (existing[0]) await db.delete(favorites).where(eq(favorites.id, existing[0].id))
  else await db.insert(favorites).values({ userId: user.id, listingId })
  revalidatePath('/')
  return { saved: !existing[0] }
}

export async function getMyFavorites() {
  const user = await currentUser()
  const rows = await db.select({ listing: listings }).from(favorites).innerJoin(listings, eq(favorites.listingId, listings.id)).where(eq(favorites.userId, user.id)).orderBy(desc(favorites.createdAt))
  return rows.map((row) => row.listing)
}

export async function startConversation(listingId: number, content = 'Hi, is this still available?') {
  const user = await currentUser()
  const listing = await db.select().from(listings).where(and(eq(listings.id, listingId), eq(listings.status, 'active'))).limit(1)
  if (!listing[0]) throw new Error('Listing not found')
  if (listing[0].userId === user.id) throw new Error('You cannot message yourself')
  const safeContent = text(content, 1000)
  const existing = await db.select().from(conversations).where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, user.id))).limit(1)
  const conversation = existing[0] ?? (await db.insert(conversations).values({ listingId, buyerId: user.id, sellerId: listing[0].userId }).returning())[0]
  await db.insert(messages).values({ conversationId: conversation.id, senderId: user.id, content: safeContent })
  await db.insert(notifications).values({ userId: listing[0].userId, kind: 'message', title: 'New marketplace message', body: `${user.name} asked about ${listing[0].title}` })
  revalidatePath('/')
  return conversation
}

export async function getMyConversations() {
  const user = await currentUser()
  return db.select().from(conversations).where(or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id))).orderBy(desc(conversations.createdAt))
}

export async function getConversationMessages(conversationId: number) {
  const user = await currentUser()
  if (!Number.isInteger(conversationId) || conversationId < 1) throw new Error('Invalid conversation')
  const allowed = await db.select({ id: conversations.id }).from(conversations).where(and(eq(conversations.id, conversationId), or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id)))).limit(1)
  if (!allowed[0]) throw new Error('Conversation not found')
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt)
}

export async function sendMessage(conversationId: number, content: string) {
  const user = await currentUser()
  const safeContent = text(content, 2000)
  const conversation = await db.select().from(conversations).where(and(eq(conversations.id, conversationId), or(eq(conversations.buyerId, user.id), eq(conversations.sellerId, user.id)))).limit(1)
  if (!conversation[0]) throw new Error('Conversation not found')
  const [message] = await db.insert(messages).values({ conversationId, senderId: user.id, content: safeContent }).returning()
  const recipientId = conversation[0].buyerId === user.id ? conversation[0].sellerId : conversation[0].buyerId
  await db.insert(notifications).values({ userId: recipientId, kind: 'message', title: 'New marketplace message', body: `${user.name} sent you a message` })
  return message
}

async function updateTransactionStatus(id: number, status: string) {
  const user = await currentUser()
  const tx = await db.select().from(transactions).where(and(eq(transactions.id, id), or(eq(transactions.buyerId, user.id), eq(transactions.sellerId, user.id)))).limit(1)
  if (!tx[0]) throw new Error('Transaction not found')
  const allowed = status === 'accepted' ? tx[0].sellerId === user.id && tx[0].status === 'inquiry' : status === 'rejected' ? tx[0].sellerId === user.id && tx[0].status === 'inquiry' : status === 'completed' ? tx[0].status === 'accepted' : status === 'cancelled' ? ['inquiry', 'accepted'].includes(tx[0].status) : false
  if (!allowed) throw new Error('Invalid transaction transition')
  const [updated] = await db.update(transactions).set({ status }).where(eq(transactions.id, id)).returning()
  return updated
}

export async function acceptTransaction(id: number) {
  return await updateTransactionStatus(id, 'accepted')
}

export async function rejectTransaction(id: number) {
  return await updateTransactionStatus(id, 'rejected')
}

export async function completeTransaction(id: number) {
  return await updateTransactionStatus(id, 'completed')
}

export async function cancelTransaction(id: number) {
  return await updateTransactionStatus(id, 'cancelled')
}

export async function reportListing(listingId: number, reason: string) {
  const user = await currentUser()
  await db.insert(reports).values({ reporterId: user.id, listingId, reason: text(reason, 500) })
  return { reported: true }
}

export async function requestTransaction(listingId: number) {
  const user = await currentUser()
  const listing = await db.select().from(listings).where(and(eq(listings.id, listingId), eq(listings.status, 'active'))).limit(1)
  if (!listing[0] || listing[0].userId === user.id) throw new Error('Listing unavailable')
  const [transaction] = await db.insert(transactions).values({ listingId, buyerId: user.id, sellerId: listing[0].userId, amount: listing[0].price, status: 'inquiry' }).returning()
  await db.insert(notifications).values({ userId: listing[0].userId, kind: 'transaction', title: 'New buyer inquiry', body: `${user.name} is interested in ${listing[0].title}` })
  return transaction
}

export async function saveProfile(input: { department?: string; course?: string; year?: number; bio?: string }) {
  const user = await currentUser()
  const values = { userId: user.id, department: input.department ? text(input.department, 120) : null, course: input.course ? text(input.course, 120) : null, year: input.year && Number.isInteger(input.year) && input.year >= 1 && input.year <= 8 ? input.year : null, bio: input.bio ? text(input.bio, 500) : null, updatedAt: new Date() }
  await db.insert(profiles).values(values).onConflictDoUpdate({ target: profiles.userId, set: values })
  revalidatePath('/')
  return values
}

export async function getNotifications() {
  const user = await currentUser()
  return db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(50)
}

export async function markNotificationRead(id: number) {
  const user = await currentUser()
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
}

export async function leaveReview(input: { transactionId: number; recipientId: string; rating: number; body: string }) {
  const user = await currentUser()
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new Error('Rating must be between 1 and 5')
  const tx = await db.select().from(transactions).where(and(eq(transactions.id, input.transactionId), inArray(transactions.buyerId, [user.id]))).limit(1)
  if (!tx[0] || tx[0].status !== 'completed') throw new Error('Only completed transactions can be reviewed')
  await db.insert(reviews).values({ transactionId: input.transactionId, authorId: user.id, recipientId: input.recipientId, rating: input.rating, body: text(input.body, 1000) })
  return { created: true }
}
