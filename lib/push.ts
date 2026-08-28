import webpush from 'web-push'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BCP_Gud_E8qiTXHtlWoyzT5gTY3VOGe0awReEXbCGth5mTm4ynwTbNvCLkvGUkMSm5-ht_i4P_EQ_SvEVMlhPiE'

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'e9Mn13EDnIkKQoSccV603G5ibzveA5t7JzBQ2mLW_XM'

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contactpukart@gmail.com'

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
} catch (err) {
  console.error('[web-push] Failed to set VAPID details:', err)
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
  badge?: string
}

/**
 * Sends a real-time Web Push notification to all registered devices of a given student user.
 * Automatically cleans up expired/unsubscribed endpoints (410 Gone / 404 Not Found).
 */
export async function sendPushNotification(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!userId) return { sent: 0, failed: 0 }

  try {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 }
    }

    const payloadString = JSON.stringify({
      title: payload.title || 'PUKart Notification',
      body: payload.body || 'You have a new alert on PuKart.',
      url: payload.url || '/',
      tag: payload.tag || 'pukart-alert',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/badge.png',
    })

    let sent = 0
    let failed = 0

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        try {
          await webpush.sendNotification(pushConfig, payloadString, {
            TTL: 60 * 60 * 24, // 24 hours
            urgency: 'high',
          })
          sent++
        } catch (err: any) {
          failed++
          // If endpoint is expired or unsubscribed (404 / 410), delete it from database
          if (err.statusCode === 404 || err.statusCode === 410) {
            try {
              await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint))
            } catch (delErr) {
              console.error('[web-push] Failed to delete expired subscription:', delErr)
            }
          } else {
            console.error('[web-push] Error sending push notification:', err)
          }
        }
      })
    )

    return { sent, failed }
  } catch (err) {
    console.error('[sendPushNotification top-level error]', err)
    return { sent: 0, failed: 0 }
  }
}
