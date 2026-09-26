'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ShieldCheck, AlertCircle, Sparkles, GraduationCap, X, ArrowRight } from 'lucide-react'

function AuthFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const err = searchParams?.get('error')
    if (err) {
      setError(err === 'access_denied' ? 'Sign in was cancelled.' : 'Authentication error. Please try again.')
    }
  }, [searchParams])

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    try {
      const redirectUrl = searchParams?.get('redirect') || '/'
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectUrl,
      })
      if (result?.error) {
        setLoading(false)
        const msg = result.error.message || ''
        if (msg.includes('missing') || msg.includes('provider') || msg.includes('secret') || msg.includes('database')) {
          setError('Google OAuth / Database setup required: Please verify GOOGLE_CLIENT_ID and DATABASE_URL in .env.local.')
        } else {
          setError(msg || 'Google sign-in could not be completed. Please try again.')
        }
        return
      }
    } catch (err: any) {
      setLoading(false)
      setError('Could not complete Google sign-in. Please try again.')
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8 relative">

      <Card className="w-full max-w-md overflow-hidden border-border/80 bg-card p-8 shadow-2xl shadow-primary/5 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-EScoY3Dr9cDuwfPiUrfIsTl2QOCJT5.png"
              alt="PUKart logo"
              className="h-16 w-16 rounded-2xl object-cover shadow-lg shadow-primary/20"
            />
            <div className="text-left">
              <span className="font-serif text-2xl font-bold tracking-tight text-primary">
                PU<span className="text-accent">K</span>art
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Campus Marketplace
              </p>
            </div>
          </div>

          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            PuKart Sign-In
          </h1>
          <p className="mt-2.5 max-w-sm text-pretty text-sm leading-6 text-muted-foreground">
            Buy, sell, and connect with students across Pondicherry University.
          </p>

          {error && (
            <div
              className="mt-5 flex w-full items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-left text-sm leading-5 text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="my-6 w-full space-y-3">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="h-13 w-full gap-3 rounded-xl bg-foreground text-background font-semibold shadow-md transition hover:bg-foreground/90 active:scale-[0.99]"
            >
              <span
                className="flex size-6 items-center justify-center rounded-full bg-background text-sm font-bold text-foreground"
                aria-hidden="true"
              >
                G
              </span>
              {loading ? 'Opening Google Sign-In…' : 'Continue with Google'}
            </Button>
          </div>

          <div className="w-full rounded-2xl border border-border/70 bg-muted/40 p-4 text-left">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
              <ShieldCheck className="size-4" />
              <span>Campus Security Guarantee</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Sign in securely with your Google account to buy, sell, and connect.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <a href="/safety" className="hover:text-primary underline">
              Safety Guidelines
            </a>
            <span>•</span>
            <a href="/help" className="hover:text-primary underline">
              Campus Help
            </a>
            <span>•</span>
            <a href="/" className="hover:text-primary underline">
              Browse Guest
            </a>
          </div>
        </div>
      </Card>
    </main>
  )
}

export function AuthForm({ mode }: { mode?: 'sign-in' | 'sign-up' }) {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center">Loading authentication...</div>}>
      <AuthFormContent />
    </Suspense>
  )
}
