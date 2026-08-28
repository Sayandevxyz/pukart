import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { NextRequest, NextResponse } from 'next/server'

const handler = toNextJsHandler(auth)

export async function GET(request: NextRequest) {
  try {
    const res = await handler.GET(request)

    // Intercept error redirects during OAuth callback to show personal email warning
    const location = res.headers.get('location')
    if (
      location &&
      (location.includes('/api/auth/error') ||
        location.includes('error=') ||
        location.includes('access_denied') ||
        location.includes('Access%20restricted'))
    ) {
      return NextResponse.redirect(new URL('/sign-in?error=personal_email_not_allowed', request.url))
    }

    return res
  } catch (error) {
    console.warn('[Auth OAuth GET Catch]', error)
    return NextResponse.redirect(new URL('/sign-in?error=personal_email_not_allowed', request.url))
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handler.POST(request)
  } catch (error) {
    console.error('[Auth POST Catch]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication request failed' },
      { status: 500 }
    )
  }
}

