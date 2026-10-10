'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export interface UserSessionData {
  user?: {
    id: string
    name?: string
    email?: string
    role?: string
  }
}

export function useRequireAuth(onAuthenticated?: (sess: UserSessionData) => void | Promise<void>) {
  const router = useRouter()
  const [session, setSession] = useState<UserSessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    authClient
      .getSession()
      .then(async (res) => {
        if (!mounted) return
        if (res.data?.user) {
          const sess = res.data as UserSessionData
          setSession(sess)
          if (onAuthenticated) {
            await onAuthenticated(sess)
          }
        } else {
          router.push('/sign-in')
        }
      })
      .catch(() => {
        if (mounted) router.push('/sign-in')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [router])

  return { session, setSession, loading, setLoading, router }
}

export function useCurrentUserSession() {
  const [session, setSession] = useState<UserSessionData | null>(null)
  useEffect(() => {
    let mounted = true
    authClient
      .getSession()
      .then((res) => {
        if (mounted && res?.data?.user) setSession(res.data)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])
  return { session, setSession }
}
