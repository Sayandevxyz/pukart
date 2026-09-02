'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import {
  ShieldCheck,
  Star,
  MessageCircle,
  MapPin,
  Calendar,
  Layers,
  ShoppingBag,
  Heart,
  GraduationCap,
  Phone,
  PhoneCall,
  Copy,
  Check,
} from 'lucide-react'
import { getSellerProfile } from '@/app/actions/marketplace'
import { startConversation, toggleFavorite } from '@/app/actions/marketplace'
import { authClient } from '@/lib/auth-client'

export default function SellerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const sellerId = String(params?.id)

  const [session, setSession] = useState<{ user?: { id: string; name?: string; email?: string } } | null>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<number[]>([])
  const [toastMessage, setToastMessage] = useState('')
  const [copiedPhone, setCopiedPhone] = useState(false)

  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(''), 3000)
  }

  function handleCopyPhone(phoneStr: string) {
    navigator.clipboard.writeText(phoneStr)
    setCopiedPhone(true)
    showToast('Phone number copied to clipboard!')
    setTimeout(() => setCopiedPhone(false), 2500)
  }

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res?.data?.user) setSession(res.data as any)
    }).catch(() => {})

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
      .catch(() => {})
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
    } catch (err: any) {
      setFavorites((prev) => (wasSaved ? [...prev, listingId] : prev.filter((id) => id !== listingId)))
      showToast(err.message || 'Failed to update favorite')
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
            To protect campus safety and privacy, seller profiles, hostel locations, and reviews are only visible to verified Pondicherry University students.
          </p>
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(`/seller/${sellerId}`)}`}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg hover:opacity-95 transition"
          >
            Sign in with @pondiuni.ac.in
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
  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '2026'

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
        {/* Profile Header Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex size-20 sm:size-24 shrink-0 items-center justify-center rounded-3xl bg-primary text-3xl font-bold text-primary-foreground shadow-lg">
              {user.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">{user.name}</h1>
                <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                  <ShieldCheck size={14} /> Verified PU Account
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
              {(user.department || user.course) && (
                <p className="text-xs sm:text-sm text-foreground/80 font-semibold">
                  {user.course || 'Student'} {user.department ? `· Dept of ${user.department}` : ''} {user.year ? `· Year ${user.year}` : ''}
                </p>
              )}
              {user.bio && <p className="text-xs text-muted-foreground mt-2 max-w-2xl">{user.bio}</p>}

              {user.phone && (
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                    <Phone size={13} className="text-accent" />
                    <span>{user.phone.startsWith('+') ? user.phone : `+91 ${user.phone}`}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopyPhone(user.phone)}
                    className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition"
                  >
                    {copiedPhone ? (
                      <>
                        <Check size={13} className="text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`tel:${user.phone.replace(/\D/g, '').length === 10 ? `+91${user.phone.replace(/\D/g, '')}` : `+${user.phone.replace(/\D/g, '')}`}`}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition"
                  >
                    <PhoneCall size={12} /> Call
                  </a>

                  <a
                    href={`https://wa.me/${user.phone.replace(/\D/g, '').length === 10 ? `91${user.phone.replace(/\D/g, '')}` : user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hi ${user.name || 'there'}, I found your profile on PUKart and would like to inquire about your campus listings.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Rating Summary */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center min-w-[140px]">
              <div className="flex items-center justify-center gap-1 text-2xl font-black text-primary">
                <span>{ratingStats?.averageRating ?? 'New'}</span>
                {ratingStats?.averageRating && <Star className="size-5 fill-emerald-600 text-emerald-600" />}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                {ratingStats?.reviewCount || 0} Campus Review{ratingStats?.reviewCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>

        {/* Section: Active Listings */}
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
              {listings.map((item: any) => (
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

        {/* Section: Reviews List */}
        <div className="mt-12 space-y-4">
          <h2 className="text-xl font-bold text-primary">Student Reviews ({ratingStats?.reviews?.length || 0})</h2>
          {ratingStats?.reviews && ratingStats.reviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {ratingStats.reviews.map((rev: any) => (
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
                  <p className="text-xs leading-relaxed text-foreground">{rev.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No student reviews received yet.</p>
          )}
        </div>
      </main>
    </div>
  )
}
