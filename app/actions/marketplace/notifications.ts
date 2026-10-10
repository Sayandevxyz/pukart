'use server'

import { and, desc, eq, sql, type SQL } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { currentUser } from './validation'

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

async function markNotificationsWithFilter(filterSql: SQL) {
  try {
    const user = await currentUser()
    if (!user) return { success: false }
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, user.id), filterSql))
    revalidatePath('/notifications')
    return { success: true }
  } catch (err) {
    console.error('[markNotificationsWithFilter error]', err)
    return { success: false }
  }
}

export async function markNotificationRead(id: number) {
  return markNotificationsWithFilter(eq(notifications.id, id))
}

export async function markAllNotificationsRead() {
  return markNotificationsWithFilter(sql`${notifications.readAt} IS NULL`)
}
