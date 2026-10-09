'use server'

import { headers } from 'next/headers'
import { auth, isValidPondiUniEmail } from '@/lib/auth'

export async function currentUser() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const email = session?.user?.email?.toLowerCase().trim()
    if (!session?.user?.id || !isValidPondiUniEmail(email)) {
      return null
    }
    return session.user
  } catch {
    return null
  }
}
