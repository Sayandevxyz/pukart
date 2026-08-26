'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (event.nativeEvent.isComposing || (event as unknown as KeyboardEvent).keyCode === 229) return
    setError(null)
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail.endsWith('@pondiuni.ac.in')) {
      setError('Use your official @pondiuni.ac.in email address.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (isSignUp && name.trim().length < 2) {
      setError('Enter your full name.')
      return
    }
    setLoading(true)
    const result = isSignUp
      ? await authClient.signUp.email({ name: name.trim(), email: normalizedEmail, password, callbackURL: '/' })
      : await authClient.signIn.email({ email: normalizedEmail, password, callbackURL: '/' })
    if (result.error) {
      setLoading(false)
      setError('Authentication could not be completed. Check your details and try again.')
      return
    }
    router.push('/')
    router.refresh()
  }

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)
    const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/' })
    if (result.error) {
      setLoading(false)
      setError('Google sign-in could not be completed. Use your official university account.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md overflow-hidden border-border/70 bg-card p-8 shadow-xl shadow-primary/5 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 flex items-center gap-3">
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-EScoY3Dr9cDuwfPiUrfIsTl2QOCJT5.png" alt="PUKart logo" className="h-14 w-14 rounded-2xl object-cover shadow-lg shadow-primary/20" />
            <span className="font-mono text-xl font-bold tracking-tight text-foreground">PUKart</span>
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">{isSignUp ? 'Join PUKart' : 'Welcome to PUKart'}</h1>
          <p className="mt-3 max-w-sm text-pretty text-sm leading-6 text-muted-foreground">Buy, sell and rent with verified Pondicherry University students.</p>
          {error && <p className="mt-5 w-full rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-left text-sm leading-5 text-destructive" role="alert">{error}</p>}
          <form onSubmit={handleSubmit} className="mt-6 w-full space-y-3 text-left">
            {isSignUp && <label className="block text-sm font-medium text-foreground">Full name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/15" /></label>}
            <label className="block text-sm font-medium text-foreground">University email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@pondiuni.ac.in" required className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/15" /></label>
            <label className="block text-sm font-medium text-foreground">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} required className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/15" /></label>
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-primary text-primary-foreground">{loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}</Button>
          </form>
          <div className="my-5 flex w-full items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          <Button type="button" onClick={handleGoogleSignIn} disabled={loading} className="h-12 w-full gap-3 rounded-xl bg-foreground text-background hover:bg-foreground/90"><span className="flex size-6 items-center justify-center rounded-full bg-background text-sm font-bold text-foreground" aria-hidden="true">G</span>{loading ? 'Opening Google…' : 'Continue with Google'}</Button>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">Only official <span className="font-medium text-foreground">@pondiuni.ac.in</span> accounts are accepted.</p>
        </div>
      </Card>
    </main>
  )
}
