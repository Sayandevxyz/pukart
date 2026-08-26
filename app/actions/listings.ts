'use server'

import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { listings } from '@/lib/db/schema'

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  const email = session?.user?.email?.trim().toLowerCase()
  if (!session?.user?.id || !email?.endsWith('@pondiuni.ac.in')) throw new Error('Unauthorized')
  return session.user
}

async function getUserId() {
  const user = await getUser()
  return user.id
}

export async function getActiveListings() {
  return db.select().from(listings).where(eq(listings.status, 'active')).orderBy(desc(listings.createdAt))
}

export async function createListing(input: {
  title: string
  description: string
  price: number
  category: string
  type?: string
  imageUrl?: string
  location?: string
}) {
  const user = await getUser()
  const title = input.title.trim()
  const description = input.description.trim()
  if (title.length < 3 || title.length > 120) throw new Error('Invalid title')
  if (description.length < 10 || description.length > 3000) throw new Error('Invalid description')
  if (!Number.isInteger(input.price) || input.price <= 0 || input.price > 10000000) throw new Error('Invalid price')
  if (!input.category.trim()) throw new Error('Category is required')

  const [listing] = await db.insert(listings).values({
    userId: user.id,
    sellerName: user.name,
    title,
    description,
    price: input.price,
    type: input.type ?? 'sell',
    category: input.category.trim(),
    imageUrl: input.imageUrl?.trim() || null,
    location: input.location?.trim() || null,
  }).returning()
  revalidatePath('/')
  return listing
}

export async function archiveListing(id: number) {
  const userId = await getUserId()
  await db.update(listings).set({ status: 'archived' }).where(and(eq(listings.id, id), eq(listings.userId, userId)))
  revalidatePath('/')
}
