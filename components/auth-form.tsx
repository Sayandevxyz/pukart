'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function AuthForm({ mode: _mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)

    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    })

    if (result.error) {
      setLoading(false)
      setError(result.error.message ?? 'Google sign-in could not be completed.')
      return
    }

    router.push('/')
    router.refresh()
  }

  const universityRequired = Boolean(error)

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md overflow-hidden border-border/70 bg-card p-8 shadow-xl shadow-primary/5 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 flex items-center gap-3">
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-EScoY3Dr9cDuwfPiUrfIsTl2QOCJT5.png" alt="PUKart logo" className="h-14 w-14 rounded-2xl object-cover shadow-lg shadow-primary/20" />
            <span className="font-mono text-xl font-bold tracking-tight text-foreground">PUKart</span>
          </div>

          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
            {universityRequired ? 'Pondicherry University account required' : 'Welcome to PUKart'}
          </h1>
          <p className="mt-3 max-w-sm text-pretty text-sm leading-6 text-muted-foreground">
            {universityRequired
              ? 'PUKart is exclusively for verified Pondicherry University students. Please sign in with your official @pondiuni.ac.in Google account.'
              : 'Your campus marketplace for Pondicherry University students.'}
          </p>

          {error && (
            <p className="mt-5 w-full rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-left text-sm leading-5 text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-8 h-12 w-full gap-3 rounded-xl bg-foreground text-background shadow-lg shadow-foreground/10 transition-transform hover:-translate-y-0.5 hover:bg-foreground/90"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-background font-sans text-sm font-bold text-foreground" aria-hidden="true">
              G
            </span>
            {loading ? 'Opening Google…' : error ? 'Try another Google account' : 'Continue with Google'}
          </Button>

          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            Sign in using your official <span className="font-medium text-foreground">@pondiuni.ac.in</span> Google account.
          </p>

          <div className="mt-8 flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            <span className="text-primary" aria-hidden="true">✓</span>
            Verified University Students
          </div>
        </div>
      </Card>
    </main>
  )
}
