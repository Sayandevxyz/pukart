import { NextResponse } from 'next/server'
import { getNotifications } from '@/app/actions/marketplace'

export async function GET() {
  try {
    const list = await getNotifications()
    const unreadCount = Array.isArray(list) ? list.filter((n: any) => !n.readAt).length : 0
    return NextResponse.json({ unreadCount, notifications: list || [] })
  } catch {
    return NextResponse.json({ unreadCount: 0, notifications: [] })
  }
}
