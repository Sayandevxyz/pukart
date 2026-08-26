'use server'

import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth, isValidPondiUniEmail, isUserAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  categories,
  listings,
  reports,
  transactions,
  user as userTable,
  reviews,
} from '@/lib/db/schema'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  const email = session?.user?.email?.trim().toLowerCase()
  if (!session?.user?.id || !isValidPondiUniEmail(email)) {
    throw new Error('Unauthorized: Valid Pondicherry University account required')
  }
  const isAdmin = isUserAdmin(email, (session.user as { role?: string }).role)
  if (!isAdmin) {
    throw new Error('Forbidden: Admin privilege required')
  }
  return session.user
}

// 1. Dashboard Metrics
export async function getAdminDashboardStats() {
  await requireAdmin()

  const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(userTable)
  const [activeListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listings).where(eq(listings.status, 'active'))
  const [totalListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listings)
  const [totalTransactions] = await db.select({ count: sql<number>`count(*)::int` }).from(transactions)
  const [completedTransactions] = await db.select({ count: sql<number>`count(*)::int` }).from(transactions).where(eq(transactions.status, 'completed'))
  const [openReports] = await db.select({ count: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, 'open'))
  const [flaggedListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listings).where(eq(listings.aiFlagged, true))

  const recentTransactions = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(8)

  const recentReports = await db
    .select()
    .from(reports)
    .orderBy(desc(reports.createdAt))
    .limit(8)

  return {
    usersCount: totalUsers?.count || 0,
    activeListingsCount: activeListings?.count || 0,
    totalListingsCount: totalListings?.count || 0,
    transactionsCount: totalTransactions?.count || 0,
    completedTransactionsCount: completedTransactions?.count || 0,
    openReportsCount: openReports?.count || 0,
    flaggedListingsCount: flaggedListings?.count || 0,
    recentTransactions,
    recentReports,
  }
}

// 2. Users Management
export async function getAdminUsers(query?: string) {
  await requireAdmin()

  let q = db.select().from(userTable)
  if (query && query.trim()) {
    const clean = `%${query.trim()}%`
    q = db.select().from(userTable).where(or(ilike(userTable.name, clean), ilike(userTable.email, clean)))
  }

  return q.orderBy(desc(userTable.createdAt)).limit(100)
}

export async function setUserSuspension(userId: string, isSuspended: boolean) {
  const admin = await requireAdmin()
  if (userId === admin.id) throw new Error('Cannot suspend your own account')

  const [updated] = await db
    .update(userTable)
    .set({ isSuspended, updatedAt: new Date() })
    .where(eq(userTable.id, userId))
    .returning()

  revalidatePath('/admin')
  return updated
}

export async function setUserRole(userId: string, role: 'user' | 'admin') {
  await requireAdmin()

  const [updated] = await db
    .update(userTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(userTable.id, userId))
    .returning()

  revalidatePath('/admin')
  return updated
}

// 3. Listings Moderation
export async function getAdminListings(statusFilter?: string) {
  await requireAdmin()

  let q = db.select().from(listings)
  if (statusFilter && statusFilter !== 'all') {
    q = db.select().from(listings).where(eq(listings.status, statusFilter))
  }

  return q.orderBy(desc(listings.createdAt)).limit(150)
}

export async function adminModerateListing(
  id: number,
  action: 'hide' | 'delete' | 'feature' | 'unfeature' | 'unflag' | 'activate'
) {
  await requireAdmin()

  if (action === 'hide') {
    await db.update(listings).set({ status: 'archived', updatedAt: new Date() }).where(eq(listings.id, id))
  } else if (action === 'activate') {
    await db.update(listings).set({ status: 'active', updatedAt: new Date() }).where(eq(listings.id, id))
  } else if (action === 'delete') {
    await db.delete(listings).where(eq(listings.id, id))
  } else if (action === 'feature') {
    await db.update(listings).set({ featured: true, updatedAt: new Date() }).where(eq(listings.id, id))
  } else if (action === 'unfeature') {
    await db.update(listings).set({ featured: false, updatedAt: new Date() }).where(eq(listings.id, id))
  } else if (action === 'unflag') {
    await db.update(listings).set({ aiFlagged: false, aiFlagReason: null }).where(eq(listings.id, id))
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

// 4. Reports Moderation
export async function getAdminReports(statusFilter?: string) {
  await requireAdmin()

  let q = db.select().from(reports)
  if (statusFilter && statusFilter !== 'all') {
    q = db.select().from(reports).where(eq(reports.status, statusFilter))
  }

  return q.orderBy(desc(reports.createdAt)).limit(100)
}

export async function updateReportStatus(
  reportId: number,
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed',
  adminNotes?: string
) {
  await requireAdmin()

  const [updated] = await db
    .update(reports)
    .set({
      status,
      adminNotes: adminNotes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, reportId))
    .returning()

  revalidatePath('/admin')
  return updated
}

// 5. Categories Management
export async function getAdminCategories() {
  await requireAdmin()
  return db.select().from(categories).orderBy(categories.order)
}

export async function createCategory(input: {
  name: string
  slug: string
  icon?: string
  description?: string
  order?: number
}) {
  await requireAdmin()
  const name = input.name.trim()
  const slug = input.slug.trim().toLowerCase()

  if (!name || !slug) throw new Error('Category name and slug are required')

  const [created] = await db
    .insert(categories)
    .values({
      name,
      slug,
      icon: input.icon || 'ShoppingBag',
      description: input.description || null,
      order: input.order || 0,
      active: true,
    })
    .returning()

  revalidatePath('/')
  revalidatePath('/admin')
  return created
}

export async function deleteCategory(id: number) {
  await requireAdmin()
  await db.delete(categories).where(eq(categories.id, id))
  revalidatePath('/')
  revalidatePath('/admin')
  return { success: true }
}
