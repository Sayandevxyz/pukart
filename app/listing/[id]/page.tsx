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
  Copy,
  Check,
  Lock,
  Bike,
  GraduationCap,
  Home,
  Zap,
  Award,
  Calculator,
} from 'lucide-react'
import {
  getListingById,
  setListingStatus,
  incrementListingViews,
  setListingDailyRentPrice,
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
import { OfferModal } from '@/components/listing/offer-modal'
import { BuyModal } from '@/components/listing/buy-modal'
import { ReportModal } from '@/components/listing/report-modal'

function extractDailyRentPrice(item: any): number {
  if (!item) return 350
  const unit = item.priceUnit || ''
  const match = unit.match(/daily_?(\d+)/i) || unit.match(/(\d+)/)
  if (match) {
    const parsed = parseInt(match[1], 10)
    if (parsed >= 20 && parsed <= 10000) return parsed
  }
  if (item.category === 'Scooty' || item.category === 'Bikes') {
    return 350
  }
  if (item.category === 'Cycles') {
    return 80
  }
  if (item.type === 'rent' && item.price >= 50 && item.price <= 1000) {
    return item.price
  }
  return 350
}

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

  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerNote, setOfferNote] = useState('')
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [meetupLocation, setMeetupLocation] = useState('Central Library Entrance')
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('Suspicious pricing or advance payment requested')
  const [actionLoading, setActionLoading] = useState(false)

  const [copiedPhone, setCopiedPhone] = useState(false)
  const [rentalDuration, setRentalDuration] = useState<'1_day' | '3_days' | '1_week' | '1_month'>('1_day')
  const [customDailyPrice, setCustomDailyPrice] = useState<string>('')
  const [savingCustomPrice, setSavingCustomPrice] = useState(false)
  const [isRentalPurchase, setIsRentalPurchase] = useState(false)

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
    }).catch(() => { })

    if (!listingId || isNaN(listingId)) return

    incrementListingViews(listingId).catch(() => { })

    getListingById(listingId)
      .then(async (data) => {
        if (data) {
          setListing(data)
          const initialDaily = extractDailyRentPrice(data)
          setCustomDailyPrice(String(initialDaily))
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

    fetch('/api/favorites')
      .then((r) => r.json())
      .then((d) => {
        if (d?.listingIds && d.listingIds.includes(listingId)) {
          setIsSaved(true)
        }
      })
      .catch(() => { })
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
    setIsRentalPurchase(false)
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

  const isMobilityItem = listing && (
    listing.type === 'rent' ||
    ['Cycles', 'Scooty', 'Bikes'].includes(listing.category)
  )

  const baseDailyRentalPrice = extractDailyRentPrice(listing)

  const rentalOptions: Record<string, { label: string; multiplier: number; days: number }> = {
    '1_day': { label: 'Daily (1 Day)', multiplier: 1, days: 1 },
    '3_days': { label: 'Weekend Pass (3 Days)', multiplier: 2.4, days: 3 },
    '1_week': { label: 'Weekly Transit (7 Days)', multiplier: 4.8, days: 7 },
    '1_month': { label: 'Semester Month (30 Days)', multiplier: 14, days: 30 },
  }

  const selectedRentalConfig = rentalOptions[rentalDuration] || rentalOptions['1_day']
  const calculatedRentalAmount = Math.max(20, Math.round(baseDailyRentalPrice * selectedRentalConfig.multiplier))
  const calculatedDepositAmount = Math.max(200, Math.min(1000, Math.round(baseDailyRentalPrice * 1.5)))

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

          <div className="space-y-4 lg:col-span-7">

            <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted">
              <Image
                src={images[activeImageIndex] || '/images/campus-marketplace.png'}
                alt={listing.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />

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

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${activeImageIndex === idx ? 'border-accent shadow-md ring-2 ring-accent/20' : 'border-border/70 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

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

            {isMobilityItem && (
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-teal-950/20 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Bike size={16} />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-primary">Campus Transit & Mobility Rental</h3>
                      <p className="text-[11px] text-muted-foreground">800-acre PU Campus Walk-Saver</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                    Green Ride
                  </span>
                </div>

                {/* SELLER PRICING CUSTOMIZATION CONTROLS */}
                {isOwner && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-accent" />
                        Seller Control: Customize 1-Day Rental Price
                      </span>
                      <span className="text-xs font-extrabold text-white">Current: ₹{baseDailyRentalPrice}/day</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground mr-1">PU Presets:</span>
                      {[350, 400, 450, 500].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={async () => {
                            setSavingCustomPrice(true)
                            try {
                              await setListingDailyRentPrice(listing.id, preset)
                              setListing({ ...listing, priceUnit: `daily_${preset}` })
                              setCustomDailyPrice(String(preset))
                              showToast(`Daily rental price updated to ₹${preset}/day!`)
                            } catch (err: any) {
                              showToast(err.message || 'Failed to update rental price')
                            } finally {
                              setSavingCustomPrice(false)
                            }
                          }}
                          disabled={savingCustomPrice}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                            baseDailyRentalPrice === preset
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                              : 'bg-card/80 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          ₹{preset}/day
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                        <input
                          type="number"
                          min="50"
                          max="5000"
                          value={customDailyPrice}
                          onChange={(e) => setCustomDailyPrice(e.target.value)}
                          placeholder="Custom ₹/day (e.g. 400)"
                          className="h-9 w-full rounded-lg border border-border bg-background pl-7 pr-3 text-xs font-bold text-foreground outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={savingCustomPrice || !customDailyPrice || Number(customDailyPrice) === baseDailyRentalPrice}
                        onClick={async () => {
                          const val = Number(customDailyPrice)
                          if (!val || val < 50 || val > 5000) {
                            showToast('Enter a fair daily rate between ₹50 and ₹5,000')
                            return
                          }
                          setSavingCustomPrice(true)
                          try {
                            await setListingDailyRentPrice(listing.id, val)
                            setListing({ ...listing, priceUnit: `daily_${val}` })
                            showToast(`Daily rental price set to ₹${val}/day!`)
                          } catch (err: any) {
                            showToast(err.message || 'Failed to update')
                          } finally {
                            setSavingCustomPrice(false)
                          }
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {savingCustomPrice ? 'Saving...' : 'Save Rate'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Calculator size={12} className="text-accent" />
                    <span>Select Rental Duration:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(rentalOptions).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRentalDuration(key as any)}
                        className={`rounded-xl p-2.5 text-center text-xs font-bold transition border ${
                          rentalDuration === key
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                            : 'bg-card/80 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <p className="truncate">{config.label.split(' (')[0]}</p>
                        <p className="text-[10px] opacity-80">{config.days} Day{config.days > 1 ? 's' : ''}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Est. Rental Cost ({selectedRentalConfig.label}):</span>
                    <span className="text-sm font-extrabold text-primary">₹{calculatedRentalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium text-slate-300">
                    <span className="text-muted-foreground">Refundable Hostel Security Deposit:</span>
                    <span className="font-bold text-accent">₹{calculatedDepositAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                    * Deposit is 100% refunded in-person when returning the cycle/scooty at Central Library or your hostel quadrangle.
                  </p>
                </div>

                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!session?.user) {
                        router.push(`/sign-in?redirect=${encodeURIComponent(`/listing/${listing.id}`)}`)
                        return
                      }
                      setMeetupLocation('Central Library Cycle Stand')
                      setIsRentalPurchase(true)
                      setBuyModalOpen(true)
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition active:scale-[0.99]"
                  >
                    <Bike size={14} />
                    <span>Rent for {selectedRentalConfig.label} (₹{calculatedRentalAmount})</span>
                  </button>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {listing.description}
              </p>
            </div>

            {!session?.user ? (
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2.5 text-sm font-bold text-foreground">
                  <ShieldCheck className="size-5 text-accent shrink-0" />
                  <span>Seller & Contact Info Protected</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To prevent spam and safeguard privacy, seller contact numbers, WhatsApp, and academic details are visible only to signed-in users.
                </p>
                <Link
                  href={`/sign-in?redirect=${encodeURIComponent(`/listing/${listing.id}`)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-xs font-bold text-primary-foreground shadow-md hover:opacity-95 active:scale-98 transition"
                >
                  <Lock size={14} /> Sign In to Buy, Sell & Rent
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
                      {listing.sellerName || 'Verified Seller'}
                    </button>
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

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-border/60">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <GraduationCap size={12} className="text-emerald-400 shrink-0" />
                    <span>Verified Scholar {listing.seller?.department ? `(${listing.seller.department.slice(0, 20)})` : 'PU'}</span>
                  </span>

                  {listing.seller?.hostel && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                      <Home size={12} className="text-blue-400 shrink-0" />
                      <span>Hosteller ({listing.seller.hostel.slice(0, 18)})</span>
                    </span>
                  )}

                  {(sellerStats?.averageRating || 5) >= 4.5 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                      <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                      <span>Top Senior Peer ({sellerStats?.averageRating || '5.0'} / 5)</span>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-400 border border-teal-500/20">
                    <Zap size={12} className="text-teal-400 shrink-0" />
                    <span>Same-Day Handoff</span>
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20">
                    <Award size={12} className="text-indigo-400 shrink-0" />
                    <span>{(sellerStats?.reviewCount || 0) > 0 ? `${sellerStats?.reviewCount} Meetups Completed` : 'Campus Verified'}</span>
                  </span>
                </div>

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
                      <div className="pt-1">
                        <a
                          href={`https://wa.me/${formattedPhoneForWa}?text=${encodeURIComponent(
                            `Hi ${listing.sellerName || 'there'}, I'm interested in your "${listing.title}" on PUKart (₹${listing.price}). Is it available?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                          <MessageCircle size={14} /> WhatsApp
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
      <OfferModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        onSubmit={handleMakeOfferSubmit}
        listingPrice={listing?.price || 0}
        offerAmount={offerAmount}
        setOfferAmount={setOfferAmount}
        offerNote={offerNote}
        setOfferNote={setOfferNote}
        actionLoading={actionLoading}
      />

      {/* BUY / PURCHASE REQUEST MODAL */}
      <BuyModal
        isOpen={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        onSubmit={handleBuyRequestSubmit}
        listingPrice={isRentalPurchase ? calculatedRentalAmount : (listing?.price || 0)}
        meetupLocation={meetupLocation}
        setMeetupLocation={setMeetupLocation}
        actionLoading={actionLoading}
      />

      {/* REPORT MODAL */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        reportReason={reportReason}
        setReportReason={setReportReason}
        actionLoading={actionLoading}
      />
    </div>
  )
}
