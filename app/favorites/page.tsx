'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import {
  Heart,
  MapPin,
  ShoppingBag,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { getMyFavorites, toggleFavorite } from '@/app/actions/marketplace'
import { authClient } from '@/lib/auth-client'

export default function FavoritesPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')

  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(''), 3000)
  }

  async function loadFavorites() {
    setLoading(true)
    try {
      const items = await getMyFavorites()
      setFavorites(items)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res?.data?.user) {
        setSession(res.data)
        loadFavorites()
      } else {
        router.push('/sign-in')
      }
    }).catch(() => router.push('/sign-in'))
  }, [router])

  async function handleRemove(id: number) {
    setFavorites((prev) => prev.filter((item) => item.id !== id))
    try {
      await toggleFavorite(id)
      showToast('Removed from favorites')
    } catch (err: any) {
      showToast(err.message || 'Failed to remove')
      loadFavorites()
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-2xl"
        >
          {toastMessage}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">Saved Favorites</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Products you saved for campus purchase or future reference.
            </p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            {favorites.length} saved item{favorites.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">Loading saved items...</div>
        ) : favorites.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <Heart className="mx-auto size-14 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-bold text-primary">No saved favorites yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">Tap the heart icon on any listing card to save it here.</p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {favorites.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={item.imageUrl || '/images/campus-marketplace.png'}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute right-2 top-2 rounded-full bg-card/90 p-1.5 text-accent shadow hover:bg-card hover:text-destructive transition"
                    title="Remove from favorites"
                  >
                    <Heart size={16} fill="currentColor" />
                  </button>
                  <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                    {item.type}
                  </span>
                </div>
                <div className="p-3">
                  <Link
                    href={`/listing/${item.id}`}
                    className="line-clamp-2 text-xs font-semibold text-primary hover:text-accent"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-2 text-base font-extrabold text-primary">₹{item.price.toLocaleString('en-IN')}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                    <MapPin size={11} /> {item.location || 'PU Campus'}
                  </p>
                  <Link
                    href={`/listing/${item.id}`}
                    className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition"
                  >
                    <ExternalLink size={12} /> View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
