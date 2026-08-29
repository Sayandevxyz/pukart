'use client'

import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, use } from 'react'
import useSWR from 'swr'
import { Navbar } from '@/components/navbar'
import {
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Star,
  Sparkles,
  Tag,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  Edit,
  CheckCircle,
  ShoppingBag,
  Flag,
  UserCheck,
  Phone,
  PhoneCall,
  Copy,
  Check,
  Lock,
} from 'lucide-react'
import {
  getListingById,
  setListingStatus,
  incrementListingViews,
} from '@/app/actions/listings'
import {
  toggleFavorite,
  startConversation,
  requestTransaction,
  makeOffer,
  reportListing,
  getUserRatingStats,
} from '@/app/actions/marketplace'
import { authClient } from '@/lib/auth-client'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = Number(params?.id)

  const [session, setSession] = useState<{ user?: { id: string; name?: string; email?: string } } | null>(null)
  const [listing, setListing] = useState<any>(null)
  const [sellerStats, setSellerStats] = useState<{ averageRating: number | null; reviewCount: number } | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')

  // Modals
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerNote, setOfferNote] = useState('')
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [meetupLocation, setMeetupLocation] = useState('Central Library Entrance')
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('Suspicious pricing or advance payment requested')
  const [actionLoading, setActionLoading] = useState(false)

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
      if (res?.data) setSession(res.data as any)
    }).catch(() => {})

    if (!listingId || isNaN(listingId)) return

    incrementListingViews(listingId).catch(() => {})

    getListingById(listingId)
      .then(async (data) => {
        if (data) {
          setListing(data)
          if (data.userId) {
            const stats = await getUserRatingStats(data.userId)
            setSellerStats(stats)
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })

    // Check if saved in favorites
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((d) => {
        if (d?.listingIds && d.listingIds.includes(listingId)) {
          setIsSaved(true)
        }
      })
      .catch(() => {})
  }, [listingId])

  async function handleToggleFavorite() {
    if (!session?.user) {
      showToast('Please sign in to add to favorites')
      router.push(`/sign-in?redirect=${encodeURIComponent(`/listing/${listingId}`)}`)
      return
    }
    const nextState = !isSaved
    setIsSaved(nextState)
    try {
      const res = await toggleFavorite(listingId)
      showToast(res.saved ? 'Saved to your favorites' : 'Removed from favorites')
    } catch (err: any) {
      setIsSaved(!nextState)
      showToast(err.message || 'Failed to update favorite')
    }
  }

  async function handleContactSeller() {
    if (!session?.user) {
      showToast('Please sign in to contact the seller')
      router.push(`/sign-in?redirect=${encodeURIComponent(`/listing/${listingId}`)}`)
      return
    }
    if (listing?.userId === session?.user?.id) {
      showToast('You are the seller of this listing')
      return
    }
    setActionLoading(true)
    try {
      const res = await startConversation(listingId)
      if (res && res.success === false) {
        setActionLoading(false)
        showToast(res.error || 'Unable to open conversation')
        return
      }
      const convId = res?.id || res?.conversation?.id
      if (convId) {
        router.push(`/messages/${convId}`)
      } else {
        setActionLoading(false)
        showToast('Unable to open conversation')
      }
    } catch (err: any) {
      setActionLoading(false)
      showToast(err.message || 'Unable to open conversation')
    }
  }

  function handleOpenOfferModal() {
    if (!session?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/listing/${listingId}`)}`)
      return
    }
    setOfferModalOpen(true)
  }

  function handleOpenBuyModal() {
    if (!session?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/listing/${listingId}`)}`)
      return
    }
    setBuyModalOpen(true)
  }

  function handleOpenReportModal() {
    if (!session?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/listing/${listingId}`)}`)
      return
    }
    setReportModalOpen(true)
  }

  function handleViewSellerProfile(e: React.MouseEvent) {
    e.preventDefault()
    if (!session?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/seller/${listing.userId}`)}`)
      return
    }
    router.push(`/seller/${listing.userId}`)
  }

  async function handleMakeOfferSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.user) {
      router.push('/sign-in')
      return
    }
    const val = Number(offerAmount)
    if (!val || val <= 0) {
      showToast('Enter a valid amount in INR')
      return
    }
    setActionLoading(true)
    try {
      const res = await makeOffer(listingId, val, offerNote)
      if (res && res.success === false) {
        showToast(res.error || 'Failed to submit offer')
      } else {
        setOfferModalOpen(false)
        showToast(`Offer of ₹${val.toLocaleString('en-IN')} submitted successfully!`)
        router.push('/transactions')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit offer')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleBuyRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.user) {
      router.push('/sign-in')
      return
    }
    setActionLoading(true)
    try {
      const res = await requestTransaction(listingId, 'meetup_cash', meetupLocation)
      if (res && res.success === false) {
        showToast(res.error || 'Failed to send buy request')
      } else {
        setBuyModalOpen(false)
        showToast('Purchase request sent! Check your transactions page.')
        router.push('/transactions')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send buy request')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.user) {
      router.push('/sign-in')
      return
    }
    setActionLoading(true)
    try {
      await reportListing(listingId, reportReason)
      setReportModalOpen(false)
      showToast('Listing reported. Our campus moderation team will review it.')
    } catch (err: any) {
      showToast(err.message || 'Report failed')
    } finally {
      setActionLoading(false)
    }
  }

  function handleShare() {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href)
      showToast('Listing link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
              <div className="h-6 w-1/3 animate-pulse rounded-lg bg-muted" />
              <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <ShoppingBag className="mx-auto size-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Listing not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This product may have been sold, archived, or removed by the student seller.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = session?.user?.id === listing.userId
  const images = listing.images && listing.images.length > 0 ? listing.images : [listing.imageUrl || '/images/campus-marketplace.png']
  const formattedDate = listing.createdAt ? new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'
  const hasDiscount = listing.originalPrice && listing.originalPrice > listing.price
  const discountPercent = hasDiscount ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100) : 0

  const sellerPhone = listing.phone || listing.seller?.phone || null
  const cleanPhoneDigits = sellerPhone ? sellerPhone.replace(/\D/g, '') : ''
  const formattedPhoneForWa = cleanPhoneDigits.length === 10 ? `91${cleanPhoneDigits}` : cleanPhoneDigits

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-2xl animate-in fade-in slide-in-from-bottom duration-200"
        >
          {toastMessage}
        </div>
      )}

      {/* Breadcrumb navigation */}
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-primary">
            Marketplace
          </Link>
          <span>/</span>
          <Link href={`/?category=${encodeURIComponent(listing.category)}`} className="hover:text-primary">
            {listing.category}
          </Link>
          <span>/</span>
          <span className="truncate text-foreground max-w-[200px] sm:max-w-none">{listing.title}</span>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* LEFT: Image Gallery (7 cols on lg) */}
          <div className="space-y-4 lg:col-span-7">
            {/* Main Active Image */}
            <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted">
              <Image
                src={images[activeImageIndex] || '/images/campus-marketplace.png'}
                alt={listing.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />

              {/* Status Badge */}
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-lg bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground shadow">
                  {listing.type}
                </span>
                {listing.status !== 'active' && (
                  <span className="rounded-lg bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow">
                    {listing.status}
                  </span>
                )}
              </div>

              {/* Floating Favorite & Share */}
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  onClick={handleShare}
                  aria-label="Share"
                  className="rounded-full bg-card/90 p-2.5 text-primary shadow-md backdrop-blur hover:bg-card transition"
                >
                  <Share2 size={18} />
                </button>
                <button
                  onClick={handleToggleFavorite}
                  aria-label={isSaved ? 'Remove from favorites' : 'Save to favorites'}
                  className="rounded-full bg-card/90 p-2.5 text-primary shadow-md backdrop-blur hover:text-accent transition"
                >
                  <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} className={isSaved ? 'text-accent' : ''} />
                </button>
              </div>

              {/* Navigation Arrows for Multiple Images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 text-primary shadow hover:bg-card"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 text-primary shadow hover:bg-card"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeImageIndex === idx ? 'border-accent shadow-md ring-2 ring-accent/20' : 'border-border/70 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Campus Safe Meetup Banner */}
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <div className="flex items-center gap-2.5 text-sm font-bold text-primary">
                <ShieldCheck className="size-5 text-accent shrink-0" />
                <span>Pondicherry University Safety Protocol</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Meet the seller in well-lit public campus locations (Library, Gate 1/2, Science Complex, Shopping Complex). Never transfer payments before physically inspecting the product.
              </p>
            </div>
          </div>

          {/* RIGHT: Product Info & Actions (5 cols on lg) */}
          <div className="space-y-6 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">{listing.category}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={13} /> Posted {formattedDate}
                </span>
              </div>
              <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                {listing.title}
              </h1>
            </div>

            {/* Pricing Details */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Price</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-primary">
                  ₹{listing.price.toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-muted-foreground line-through">
                      ₹{listing.originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                <MapPin size={13} className="text-accent" />
                <span>Pickup: {listing.location || 'Pondicherry University'}</span>
              </p>
            </div>

            {/* Condition & Attributes */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border bg-card p-3.5">
                <p className="text-xs font-medium text-muted-foreground">Condition</p>
                <p className="mt-1 font-bold capitalize text-primary">
                  {listing.condition ? listing.condition.replace('_', ' ') : 'Not specified'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5">
                <p className="text-xs font-medium text-muted-foreground">Listing Type</p>
                <p className="mt-1 font-bold capitalize text-primary">{listing.type || 'Sell'}</p>
              </div>
            </div>

            {/* Product Description */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {listing.description}
              </p>
            </div>

            {/* Seller Profile Card — Protected for Logged-In Students */}
            {!session?.user ? (
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2.5 text-sm font-bold text-foreground">
                  <ShieldCheck className="size-5 text-accent shrink-0" />
                  <span>Seller & Contact Info Protected</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To prevent spam and safeguard student privacy, seller contact numbers, WhatsApp, and academic department details are visible only to verified Pondicherry University students.
                </p>
                <Link
                  href={`/sign-in?redirect=${encodeURIComponent(`/listing/${listing.id}`)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-xs font-bold text-primary-foreground shadow-md hover:opacity-95 active:scale-98 transition"
                >
                  <Lock size={14} /> Sign In with @pondiuni.ac.in to View Contact Info
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seller Information</p>
                <div className="flex items-center gap-3.5">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-sm">
                    {listing.sellerName?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={handleViewSellerProfile}
                      className="font-bold text-primary hover:text-accent truncate block text-base text-left"
                    >
                      {listing.sellerName || 'Verified PU Student'}
                    </button>
                    <p className="flex items-center gap-1 text-xs font-semibold text-accent mt-0.5">
                      <ShieldCheck size={14} /> Verified Pondicherry University
                    </p>
                    {listing.seller?.department && (
                      <p className="text-xs text-muted-foreground truncate">
                        {listing.seller.department} {listing.seller.year ? `· Year ${listing.seller.year}` : ''}
                      </p>
                    )}
                  </div>
                  {sellerStats?.averageRating && (
                    <div className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-bold text-white shadow-sm">
                      <span>{sellerStats.averageRating}</span>
                      <Star size={11} fill="currentColor" />
                    </div>
                  )}
                </div>

                {/* Seller Phone / Direct Call & WhatsApp Contact Box */}
                {sellerPhone ? (
                  <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Phone size={14} className="text-accent" />
                        <span>Direct Contact Number</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(sellerPhone)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                      >
                        {copiedPhone ? (
                          <>
                            <Check size={12} className="text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-sm font-extrabold tracking-wide text-primary">
                      {sellerPhone.startsWith('+') ? sellerPhone : `+91 ${sellerPhone}`}
                    </p>

                    {!isOwner && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={`tel:${cleanPhoneDigits.length === 10 ? `+91${cleanPhoneDigits}` : `+${cleanPhoneDigits}`}`}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition"
                        >
                          <PhoneCall size={13} /> Call Seller
                        </a>
                        <a
                          href={`https://wa.me/${formattedPhoneForWa}?text=${encodeURIComponent(
                            `Hi ${listing.sellerName || 'there'}, I'm interested in your "${listing.title}" on PUKart (₹${listing.price}). Is it available?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                ) : isOwner ? (
                  <div className="rounded-xl border border-dashed border-border bg-card/60 p-3 text-xs text-muted-foreground">
                    <p>You haven&apos;t added a contact phone to this listing.</p>
                    <Link href={`/listing/${listing.id}/edit`} className="font-bold text-accent hover:underline mt-1 inline-block">
                      + Add Phone Number
                    </Link>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleViewSellerProfile}
                  className="w-full text-center rounded-xl border border-border bg-background py-2 text-xs font-bold text-primary hover:bg-muted transition"
                >
                  View Seller Profile & Other Listings
                </button>
              </div>
            )}

            {/* CTA ACTION BUTTONS */}
            {isOwner ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Link
                    href={`/listing/${listing.id}/edit`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition"
                  >
                    <Edit size={16} /> Edit Listing
                  </Link>
                  <button
                    onClick={async () => {
                      const next = listing.status === 'active' ? 'reserved' : 'active'
                      await setListingStatus(listing.id, next)
                      setListing({ ...listing, status: next })
                      showToast(`Status changed to ${next}`)
                    }}
                    className="flex-1 rounded-xl border border-primary px-4 py-3.5 text-sm font-bold text-primary hover:bg-primary/5 transition"
                  >
                    Mark as {listing.status === 'active' ? 'Reserved' : 'Available'}
                  </button>
                </div>
                <button
                  onClick={async () => {
                    await setListingStatus(listing.id, 'sold')
                    setListing({ ...listing, status: 'sold' })
                    showToast('Listing marked as SOLD')
                  }}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition"
                >
                  Mark as Sold
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleContactSeller}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-95 active:scale-98 transition disabled:opacity-50"
                  >
                    <MessageCircle size={17} /> Contact Seller
                  </button>
                  <button
                    onClick={handleOpenOfferModal}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background py-3.5 text-sm font-bold text-primary hover:bg-primary/5 active:scale-98 transition"
                  >
                    <Tag size={17} /> Make Offer
                  </button>
                </div>

                <button
                  onClick={handleOpenBuyModal}
                  disabled={actionLoading || listing.status !== 'active'}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-base font-extrabold text-accent-foreground shadow-lg hover:opacity-95 active:scale-98 transition disabled:opacity-50"
                >
                  <ShoppingBag size={19} /> Buy / Request Purchase
                </button>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={handleOpenReportModal}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition"
                  >
                    <Flag size={13} /> Report listing
                  </button>
                  <span className="text-xs text-muted-foreground">{listing.viewsCount || 1} campus views</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MAKE OFFER MODAL */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-primary">Make an Offer</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Listed at ₹{listing.price.toLocaleString('en-IN')}. Propose a fair counter-price to the student seller.
            </p>
            <form onSubmit={handleMakeOfferSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  Offer Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-bold outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  Message for Seller (Optional)
                </label>
                <textarea
                  value={offerNote}
                  onChange={(e) => setOfferNote(e.target.value)}
                  placeholder="e.g., Can meet at Library today at 4 PM"
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground hover:opacity-90"
                >
                  {actionLoading ? 'Submitting...' : 'Send Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BUY / PURCHASE REQUEST MODAL */}
      {buyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-primary">Confirm Purchase Request</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Request purchase for ₹{listing.price.toLocaleString('en-IN')} via Campus Meetup.
            </p>
            <form onSubmit={handleBuyRequestSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  Preferred Campus Meetup Spot
                </label>
                <select
                  value={meetupLocation}
                  onChange={(e) => setMeetupLocation(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-accent"
                >
                  <option>Central Library Entrance</option>
                  <option>Science Complex Gate</option>
                  <option>Silver Jubilee Campus</option>
                  <option>Gate 1 / Main Gate</option>
                  <option>Gate 2 / East Gate</option>
                  <option>Hostel Mess / Common Room</option>
                </select>
              </div>
              <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Payment Method: Campus Cash / UPI on Meetup</p>
                <p className="mt-1">You will inspect the item in person and pay the seller directly during the campus meetup.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBuyModalOpen(false)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  {actionLoading ? 'Sending...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-destructive">Report Listing</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Help keep PUKart safe and honest for all Pondicherry University students.
            </p>
            <form onSubmit={handleReportSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-destructive"
                >
                  <option>Suspicious pricing or advance payment requested</option>
                  <option>Counterfeit or misrepresented product</option>
                  <option>Prohibited item on campus</option>
                  <option>Spam or duplicate listing</option>
                  <option>Harassment or abusive content</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground hover:opacity-90"
                >
                  {actionLoading ? 'Reporting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
