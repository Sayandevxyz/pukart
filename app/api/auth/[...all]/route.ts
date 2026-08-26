import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { NextRequest, NextResponse } from 'next/server'

const handler = toNextJsHandler(auth)

export async function GET(request: NextRequest) {
  try {
    const res = await handler.GET(request)

    // Intercept error redirects or 500s during OAuth callback
    if (
      (request.nextUrl.pathname.includes('/callback/google') || request.nextUrl.pathname.includes('/api/auth/error')) &&
      res.status >= 400
    ) {
      return NextResponse.redirect(new URL('/sign-in?error=personal_email_not_allowed', request.url))
    }

    // If Better Auth tries to redirect to /api/auth/error
    const location = res.headers.get('location')
    if (location && (location.includes('/api/auth/error') || location.includes('error='))) {
      return NextResponse.redirect(new URL('/sign-in?error=personal_email_not_allowed', request.url))
    }

    return res
  } catch (error) {
    console.warn('[Auth OAuth Interceptor Catch]', error)
    return NextResponse.redirect(new URL('/sign-in?error=personal_email_not_allowed', request.url))
  }
}

export async function POST(request: NextRequest) {
  try {
    const res = await handler.POST(request)
    if (res.status >= 500) {
      return NextResponse.redirect(new URL('/sign-in?error=personal_email_not_allowed', request.url))
    }
    return res
  } catch (error) {
    console.warn('[Auth POST Interceptor Catch]', error)
    return NextResponse.redirect(new URL('/sign-in?error=personal_email_not_allowed', request.url))
  }
}
