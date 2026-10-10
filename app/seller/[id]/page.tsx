'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import {
  ShieldCheck,
  Star,
  MapPin,
  ShoppingBag,
  Heart,
  GraduationCap,
} from 'lucide-react'
import { getSellerProfile, toggleFavorite } from '@/app/actions/marketplace'
import { useCurrentUserSession } from '@/lib/hooks/useRequireAuth'
import { useToast } from '@/lib/hooks/useToast'
import { PageShell } from '@/components/ui/PageShell'
import { SellerHeaderCard } from '@/components/seller/SellerHeaderCard'
import type { ListingItem, ReviewItem, SellerProfileData } from '@/lib/types'

export default function SellerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const sellerId = String(params?.id)

  const { session } = useCurrentUserSession()
  const [profileData, setProfileData] = useState<SellerProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<number[]>([])
  const { toastMessage, showToast } = useToast()
  const [copiedPhone, setCopiedPhone] = useState(false)

  function handleCopyPhone(phoneStr?: string | null) {
    if (!phoneStr) return
    navigator.clipboard.writeText(phoneStr)
    setCopiedPhone(true)
    showToast('Phone number copied to clipboard!')
    setTimeout(() => setCopiedPhone(false), 2500)
  }

  useEffect(() => {
    if (!sellerId) return

    getSellerProfile(sellerId).then((data) => {
      setProfileData(data)
      setLoading(false)
    }).catch((err) => {
      console.error(err)
      setLoading(false)
    })

    fetch('/api/favorites')
      .then((r) => r.json())
      .then((d) => {
        if (d?.listingIds) setFavorites(d.listingIds)
      })
      .catch(() => { })
  }, [sellerId])

  async function handleToggleFavorite(listingId: number) {
    if (!session?.user) {
      router.push('/sign-in')
      return
    }
    const wasSaved = favorites.includes(listingId)
    setFavorites((prev) => (wasSaved ? prev.filter((id) => id !== listingId) : [...prev, listingId]))
    try {
      const res = await toggleFavorite(listingId)
      showToast(res.saved ? 'Saved to favorites' : 'Removed from favorites')
    } catch (err) {
      setFavorites((prev) => (wasSaved ? [...prev, listingId] : prev.filter((id) => id !== listingId)))
      showToast(err instanceof Error ? err.message : 'Failed to update favorite')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-4xl py-20 text-center animate-pulse">Loading student profile...</div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Student Profile Protected</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            To protect campus safety and privacy, seller profiles, hostel locations, and reviews are only visible to signed-in users.
          </p>
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(`/seller/${sellerId}`)}`}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg hover:opacity-95 transition"
          >
            Sign in
          </Link>
          <div>
            <Link href="/" className="mt-3 inline-block text-xs font-semibold text-muted-foreground hover:text-foreground transition">
              ← Return to Campus Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!profileData || !profileData.user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-xl py-20 text-center">
          <GraduationCap className="mx-auto size-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Seller not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This user account could not be found.</p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const { user, listings, ratingStats } = profileData

  return (
    <PageShell toastMessage={toastMessage}>
      <SellerHeaderCard
          user={user}
          ratingStats={ratingStats}
          copiedPhone={copiedPhone}
          onCopyPhone={handleCopyPhone}
        />

        <div className="mt-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary">Active Listings ({listings.length})</h2>
              <p className="text-xs text-muted-foreground">Items currently offered by {user.name} on campus</p>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <ShoppingBag className="mx-auto size-12 text-muted-foreground" />
              <p className="mt-3 font-semibold text-primary">No active listings currently</p>
              <p className="text-xs text-muted-foreground">This student has no items listed for sale right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {listings.map((item: ListingItem) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <Link href={`/listing/${item.id}`} className="relative block aspect-square bg-muted overflow-hidden">
                    <Image
                      src={item.imageUrl || '/images/campus-marketplace.png'}
                      alt={item.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                      {item.type}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleToggleFavorite(item.id)
                      }}
                      className="absolute right-2 top-2 rounded-full bg-card/90 p-1.5 text-primary shadow hover:text-accent"
                    >
                      <Heart
                        size={15}
                        fill={favorites.includes(item.id) ? 'currentColor' : 'none'}
                        className={favorites.includes(item.id) ? 'text-accent' : ''}
                      />
                    </button>
                  </Link>
                  <div className="p-3">
                    <Link
                      href={`/listing/${item.id}`}
                      className="line-clamp-2 text-xs font-semibold text-primary hover:text-accent"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-2 text-base font-extrabold text-primary">
                      ₹{item.price.toLocaleString('en-IN')}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                      <MapPin size={11} /> {item.location || 'PU Campus'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 space-y-4">
          <h2 className="text-xl font-bold text-primary">Student Reviews ({ratingStats?.reviews?.length || 0})</h2>
          {ratingStats?.reviews && ratingStats.reviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {ratingStats.reviews.map((rev: ReviewItem) => (
                <div key={rev.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < rev.rating ? 'fill-emerald-600 text-emerald-600' : 'text-muted'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">{rev.body || rev.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No student reviews received yet.</p>
          )}
        </div>
    </PageShell>
  )
}
