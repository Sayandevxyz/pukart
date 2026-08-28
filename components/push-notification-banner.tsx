'use client'

import { useState, useEffect } from 'react'
import { Bell, BellRing, X, CheckCircle2, Smartphone } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationBanner() {
  const [session, setSession] = useState<any>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [successToast, setSuccessToast] = useState(false)

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('pukart_push_banner_dismissed')
    if (isDismissed) setDismissed(true)

    // Check service worker & push support
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)

      // Register Service Worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          return registration.pushManager.getSubscription()
        })
        .then((sub) => {
          if (sub) {
            setIsSubscribed(true)
          }
        })
        .catch((err) => {
          console.error('[ServiceWorker registration error]', err)
        })
    }

    authClient.getSession().then((res) => {
      if (res?.data?.user) {
        setSession(res.data.user)
      }
    }).catch(() => {})
  }, [])

  async function handleEnablePush() {
    if (!isSupported) return
    setLoading(true)

    try {
      // 1. Request Browser Permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setLoading(false)
        return
      }

      // 2. Subscribe with VAPID Public Key
      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        'BCP_Gud_E8qiTXHtlWoyzT5gTY3VOGe0awReEXbCGth5mTm4ynwTbNvCLkvGUkMSm5-ht_i4P_EQ_SvEVMlhPiE'

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      })

      // 3. Send subscription to server
      const rawSub = subscription.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: rawSub.endpoint,
          keys: rawSub.keys,
        }),
      })

      if (res.ok) {
        setIsSubscribed(true)
        setSuccessToast(true)
        setTimeout(() => {
          setSuccessToast(false)
          setDismissed(true)
        }, 4000)
      }
    } catch (err) {
      console.error('[handleEnablePush error]', err)
    } finally {
      setLoading(false)
    }
  }

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem('pukart_push_banner_dismissed', 'true')
  }

  if (!isSupported || !session || dismissed || permission === 'denied' || isSubscribed) {
    if (successToast) {
      return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={20} className="text-emerald-200" />
          <span>Lockscreen notifications enabled for PuKart!</span>
        </div>
      )
    }
    return null
  }

  return (
    <aside
      aria-label="Push notifications banner"
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg rounded-2xl border border-accent/40 bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 sm:bottom-6 sm:right-6 sm:left-auto sm:w-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
            <BellRing size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>Get Phone Lockscreen Alerts</span>
              <Smartphone size={14} className="text-muted-foreground" />
            </h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Never miss a buyer inquiry, message, or purchase request when you are outside the app.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close notification banner"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={handleEnablePush}
          disabled={loading}
          className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow hover:opacity-90 active:scale-98 transition disabled:opacity-50"
        >
          {loading ? 'Enabling...' : 'Enable Phone Notifications'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-xl border border-border px-3.5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          Not Now
        </button>
      </div>
    </aside>
  )
}
