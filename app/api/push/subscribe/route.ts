import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { auth, isValidPondiUniEmail } from '@/lib/auth'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const email = session?.user?.email?.toLowerCase().trim()
    if (!session?.user?.id || !isValidPondiUniEmail(email)) {
      return NextResponse.json({ error: 'Unauthorized: Sign in with @pondiuni.ac.in' }, { status: 401 })
    }

    const body = await req.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 })
    }

    // Upsert subscription into DB
    await db
      .insert(pushSubscriptions)
      .values({
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: session.user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      })

    return NextResponse.json({ success: true, message: 'Subscribed to lockscreen notifications' })
  } catch (err: any) {
    console.error('[/api/push/subscribe POST error]', err)
    return NextResponse.json({ error: err.message || 'Failed to save subscription' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { endpoint } = body

    if (endpoint) {
      await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.userId, session.user.id), eq(pushSubscriptions.endpoint, endpoint)))
    }

    return NextResponse.json({ success: true, message: 'Unsubscribed' })
  } catch (err: any) {
    console.error('[/api/push/subscribe DELETE error]', err)
    return NextResponse.json({ error: err.message || 'Failed to delete subscription' }, { status: 500 })
  }
}
