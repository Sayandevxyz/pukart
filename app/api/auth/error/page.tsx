'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ShieldAlert, GraduationCap, ArrowRight } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

function AuthErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  async function handleRetryGoogle() {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      })
    } catch {
      router.push('/sign-in')
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md overflow-hidden border-border/80 bg-card p-8 shadow-2xl shadow-primary/5 sm:p-10 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-6">
          <GraduationCap className="size-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-accent">Pondicherry University</span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          University Email Required
        </h1>

        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-left text-sm leading-6 text-foreground">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Personal email detected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PUKart is exclusively restricted to students, faculty, and research scholars. Please sign in with your official university account:
              </p>
              <div className="mt-2 inline-block rounded-lg bg-background px-3 py-1 text-xs font-mono font-bold text-primary border border-border">
                @pondiuni.ac.in
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            onClick={handleRetryGoogle}
            className="h-12 w-full gap-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90"
          >
            <span>Switch to @pondiuni.ac.in Account</span>
            <ArrowRight className="size-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sign-in')}
            className="h-12 w-full rounded-xl"
          >
            Back to Sign-In
          </Button>
        </div>

        <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
          Need assistance with university credentials?{' '}
          <a href="/help" className="text-primary hover:underline font-semibold">
            Campus Help Center
          </a>
        </div>
      </Card>
    </main>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
