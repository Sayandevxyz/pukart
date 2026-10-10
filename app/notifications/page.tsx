'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Check,
  CheckCheck,
  MessageCircle,
  Heart,
  Tag,
  Layers,
  Star,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/app/actions/marketplace'

import { useToast } from '@/lib/hooks/useToast'
import { useRequireAuth } from '@/lib/hooks/useRequireAuth'
import { PageShell } from '@/components/ui/PageShell'

type NotificationItem = Awaited<ReturnType<typeof getNotifications>>[number]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const { toastMessage, showToast } = useToast()

  const { loading } = useRequireAuth(() => {
    loadNotifications()
  })

  async function loadNotifications() {
    try {
      const data = await getNotifications()
      if (Array.isArray(data)) {
        setNotifications(data)
      } else {
        setNotifications([])
      }
    } catch {
      setNotifications([])
    }
  }

  async function handleMarkRead(id: number) {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
    )
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead()
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date() }))
    )
    showToast('All notifications marked as read')
  }

  function getIcon(kind: string) {
    switch (kind) {
      case 'message':
        return <MessageCircle className="size-5 text-blue-600" />
      case 'favorite':
        return <Heart className="size-5 text-pink-600" />
      case 'offer':
      case 'offer_accepted':
      case 'offer_rejected':
        return <Tag className="size-5 text-amber-600" />
      case 'transaction':
        return <Layers className="size-5 text-emerald-600" />
      case 'review':
        return <Star className="size-5 text-amber-500 fill-amber-500" />
      case 'moderation':
        return <ShieldAlert className="size-5 text-rose-600" />
      default:
        return <Bell className="size-5 text-primary" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <PageShell toastMessage={toastMessage} maxWidthClass="max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Campus marketplace alerts, messages, and offer updates.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-primary hover:bg-muted transition"
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <Bell className="mx-auto size-14 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-bold text-primary">No notifications yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">You will be notified when someone messages you, likes your items, or makes an offer.</p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {notifications.map((notif) => {
              const isUnread = !notif.readAt
              const link = notif.link || '/'

              return (
                <div
                  key={notif.id}
                  className={`flex items-center justify-between gap-4 p-4 transition ${
                    isUnread ? 'bg-accent/5 font-medium' : 'hover:bg-muted/40'
                  }`}
                >
                  <Link
                    href={link}
                    onClick={() => {
                      if (isUnread) handleMarkRead(notif.id)
                    }}
                    className="flex items-start gap-3.5 flex-1 min-w-0"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      {getIcon(notif.kind)}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-bold text-primary truncate">{notif.title}</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{notif.body}</p>
                      <p className="text-[10px] text-muted-foreground pt-0.5">
                        {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    {isUnread && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary transition"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <Link
                      href={link}
                      onClick={() => {
                        if (isUnread) handleMarkRead(notif.id)
                      }}
                      className="rounded-lg p-2 text-muted-foreground hover:text-primary"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </PageShell>
  )
}
