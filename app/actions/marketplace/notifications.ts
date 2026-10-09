'use server'

import { and, desc, eq, sql } from 'drizzle-orm'
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
