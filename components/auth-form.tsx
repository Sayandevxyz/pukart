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
  const [showDomainModal, setShowDomainModal] = useState(false)

  useEffect(() => {
    const err = searchParams?.get('error')
    if (err) {
      setShowDomainModal(true)
      setError('Personal email accounts are not permitted. Please use your official @pondiuni.ac.in account.')
    }
  }, [searchParams])

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      })
      if (result?.error) {
        setLoading(false)
        const msg = result.error.message || ''
        if (msg.includes('pondiuni') || msg.includes('Access restricted')) {
          setShowDomainModal(true)
          setError('Access restricted: Only verified @pondiuni.ac.in accounts are permitted.')
        } else if (msg.includes('missing') || msg.includes('provider') || msg.includes('secret') || msg.includes('database')) {
          setError('Google OAuth / Database setup required: Please verify GOOGLE_CLIENT_ID and DATABASE_URL in .env.local.')
        } else {
          setError(msg || 'Google sign-in could not be completed. Use your official @pondiuni.ac.in account.')
        }
        return
      }
    } catch (err: any) {
      setLoading(false)
      setShowDomainModal(true)
      setError('Please use your official Pondicherry University Google account (@pondiuni.ac.in).')
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8 relative">
      {/* Modal Pop-up for Personal Email Warning */}
      {showDomainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <GraduationCap className="size-7" />
              </div>
              <button
                type="button"
                onClick={() => setShowDomainModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="mt-4 text-xl font-bold text-foreground">Use University Email</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              PUKart is a secure campus marketplace exclusively for Pondicherry University members. Personal emails (Gmail, Outlook, Yahoo) are not allowed.
            </p>

            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-foreground">
              <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1">
                Required Email Format:
              </span>
              <span className="font-mono font-bold text-sm text-primary">
                your_Reg.no.@pondiuni.ac.in
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                type="button"
                onClick={() => {
                  setShowDomainModal(false)
                  handleGoogleSignIn()
                }}
                className="h-12 w-full gap-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90"
              >
                <span>Try with @pondiuni.ac.in</span>
                <ArrowRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDomainModal(false)}
                className="h-10 text-xs text-muted-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

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
            Pondicherry University Sign-In
          </h1>
          <p className="mt-2.5 max-w-sm text-pretty text-sm leading-6 text-muted-foreground">
            Connect directly with verified students, research scholars, and faculty on campus.
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
              PUKart exclusively admits <span className="font-semibold text-foreground">@pondiuni.ac.in</span> Google credentials.
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
