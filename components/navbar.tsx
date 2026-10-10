'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Bell,
  Heart,
  MessageCircle,
  Plus,
  Search,
  UserRound,
  Package,
  Layers,
  LogOut,
  Menu,
  X,
  Lock,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'

interface NavbarSession {
  user?: { id: string; name?: string; email?: string; role?: string; image?: string }
}

function NavbarSearchInput({
  query,
  setQuery,
  onSubmit,
  isMobile = false,
}: {
  query: string
  setQuery: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  isMobile?: boolean
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={`relative flex items-center ${isMobile ? '' : 'hidden max-w-2xl flex-1 md:flex'}`}
    >
      <Search className="absolute left-3.5 text-muted-foreground" size={isMobile ? 16 : 17} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={isMobile ? 'Mobile search marketplace' : 'Search marketplace'}
        placeholder={isMobile ? 'Search campus marketplace...' : 'Search books, laptops, cycles, hostel gear...'}
        className={`${isMobile ? 'h-10' : 'h-11'} w-full rounded-xl border border-border bg-muted/40 pl-10 pr-10 text-sm outline-none transition focus:border-accent ${
          isMobile ? '' : 'focus:bg-background focus:ring-4 focus:ring-accent/15'
        }`}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="absolute right-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Clear search input"
        >
          <X size={15} />
        </button>
      )}
    </form>
  )
}

export function Navbar({
  initialQuery = '',
  onSearch,
}: {
  initialQuery?: string
  onSearch?: (query: string, aiMode?: boolean) => void
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [session, setSession] = useState<{ user?: { id: string; name?: string; email?: string; role?: string; image?: string } } | null>(null)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    authClient
      .getSession()
      .then((res) => {
        if (
          res?.data &&
          typeof res.data === 'object' &&
          'user' in res.data &&
          res.data.user &&
          typeof res.data.user === 'object'
        ) {
          const rawUser = res.data.user as {
            id?: unknown
            name?: unknown
            email?: unknown
            role?: unknown
            image?: unknown
          }
          if (typeof rawUser.id === 'string') {
            const userSession: NavbarSession = {
              user: {
                id: rawUser.id,
                name: typeof rawUser.name === 'string' ? rawUser.name : undefined,
                email: typeof rawUser.email === 'string' ? rawUser.email : undefined,
                role: typeof rawUser.role === 'string' ? rawUser.role : undefined,
                image: typeof rawUser.image === 'string' ? rawUser.image : undefined,
              },
            }
            setSession(userSession)

            if (userSession.user) {
            function loadCounts() {
              if (typeof document !== 'undefined' && document.hidden) return

              fetch('/api/favorites')
                .then((r) => r.json())
                .then((d) => {
                  if (d?.listingIds) setFavoriteCount(d.listingIds.length)
                })
                .catch(() => {})

              fetch('/api/notifications')
                .then((r) => r.json())
                .then((d) => {
                  if (typeof d?.unreadCount === 'number') setUnreadNotificationCount(d.unreadCount)
                })
                .catch(() => {})
            }

            loadCounts()
            interval = setInterval(loadCounts, 30000)
          }
        }
      }
    })
      .catch(() => {})

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  function handleSearchSubmit(e: React.FormEvent, isAi = false) {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery, isAi)
    } else {
      router.push(`/?q=${encodeURIComponent(searchQuery)}${isAi ? '&ai=true' : ''}`)
    }
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const isAdmin = session?.user?.role === 'admin' || session?.user?.email === 'admin@pondiuni.ac.in'

  return (
    <header role="banner" className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-xl transition">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        
        <Link href="/" className="flex shrink-0 items-center gap-2.5 group" aria-label="PUKart Home">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-EScoY3Dr9cDuwfPiUrfIsTl2QOCJT5.png"
            alt="PUKart logo"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-xl object-cover shadow-sm transition group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-tight text-primary leading-tight">
              PU<span className="text-accent">K</span>art
            </span>
            <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest text-muted-foreground -mt-1">
              Pondicherry University
            </span>
          </div>
        </Link>

        <NavbarSearchInput
          query={searchQuery}
          setQuery={setSearchQuery}
          onSubmit={(e) => handleSearchSubmit(e, false)}
        />

        <nav aria-label="Main Navigation" className="ml-auto hidden items-center gap-1.5 lg:flex">
          {session?.user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-bold text-accent hover:bg-accent/20 transition"
                >
                  <Lock size={14} /> Admin
                </Link>
              )}

              <Link
                href="/my-listings"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-foreground/85 hover:bg-muted hover:text-foreground transition"
              >
                <Package size={17} /> My Listings
              </Link>

              <Link
                href="/transactions"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-foreground/85 hover:bg-muted hover:text-foreground transition"
              >
                <Layers size={17} /> Deals
              </Link>

              <Link
                href="/favorites"
                aria-label="Favorites"
                className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <Heart size={19} />
                {favoriteCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                    {favoriteCount}
                  </span>
                )}
              </Link>

              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <Bell size={19} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadNotificationCount}
                  </span>
                )}
              </Link>

              <Link
                href="/messages"
                aria-label="Messages"
                className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <MessageCircle size={19} />
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-foreground/85 hover:bg-muted hover:text-foreground transition"
              >
                <UserRound size={17} />
                <span>{session.user.name?.split(' ')[0] || 'Profile'}</span>
              </Link>

              <Link
                href="/listing/new"
                className="ml-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/25 transition hover:brightness-110 active:scale-98"
              >
                <Plus size={16} /> Sell
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/safety"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                Campus Safety
              </Link>
              <Link
                href="/sign-in"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/25 transition hover:brightness-110"
              >
                Sign In
              </Link>
            </>
          )}
        </nav>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="ml-auto rounded-xl p-2 text-foreground lg:hidden hover:bg-muted"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <NavbarSearchInput
          query={searchQuery}
          setQuery={setSearchQuery}
          onSubmit={(e) => handleSearchSubmit(e, false)}
          isMobile
        />
      </div>

      {mobileMenuOpen && (
        <nav aria-label="Mobile Navigation" className="border-t border-border bg-card px-5 py-6 lg:hidden space-y-4 animate-in slide-in-from-top duration-200">
          {session?.user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {session.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
                <Link
                  href="/listing/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-accent p-3 text-accent-foreground font-bold"
                >
                  <Plus size={16} /> Sell Item
                </Link>
                <Link
                  href="/my-listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-border p-3 hover:bg-muted"
                >
                  <Package size={16} /> My Listings
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-border p-3 hover:bg-muted"
                >
                  <MessageCircle size={16} /> Messages
                </Link>
                <Link
                  href="/transactions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-border p-3 hover:bg-muted"
                >
                  <Layers size={16} /> Transactions
                </Link>
                <Link
                  href="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-border p-3 hover:bg-muted"
                >
                  <Heart size={16} /> Favorites ({favoriteCount})
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-border p-3 hover:bg-muted"
                >
                  <Bell size={16} /> Alerts {unreadNotificationCount > 0 ? `(${unreadNotificationCount})` : ''}
                </Link>
              </div>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-accent/20 p-3 text-sm font-bold text-accent"
                >
                  <Lock size={16} /> Admin Control Center
                </Link>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-border">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-sm font-semibold text-destructive"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
              >
                Sign In
              </Link>
              <div className="flex justify-around text-xs text-muted-foreground pt-2">
                <Link href="/safety" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
                  Campus Safety
                </Link>
                <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
                  Help Center
                </Link>
              </div>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}
