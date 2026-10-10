'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ListingItem, UserRatingStats } from '@/lib/types'
import {
  getListingById,
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
import type { RentalDuration } from './MobilityCalculator'

export function useListingDetail(listingId: number) {
  const router = useRouter()
  const [session, setSession] = useState<{
    user?: { id: string; name?: string; email?: string }
  } | null>(null)
  const [listing, setListing] = useState<ListingItem | null>(null)
  const [sellerStats, setSellerStats] = useState<UserRatingStats | null>(null)
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
  const [reportReason, setReportReason] = useState(
    'Suspicious pricing or advance payment requested'
  )
  const [actionLoading, setActionLoading] = useState(false)
  const [rentalDuration, setRentalDuration] = useState<RentalDuration>('1_day')
  const [isRentalPurchase, setIsRentalPurchase] = useState(false)

  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(''), 3000)
  }

  useEffect(() => {
    authClient
      .getSession()
      .then((res) => {
        if (res?.data?.user) setSession(res.data)
      })
      .catch(() => {})

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

    fetch('/api/favorites')
      .then((r) => r.json())
      .then((d) => {
        if (d?.listingIds && d.listingIds.includes(listingId)) {
          setIsSaved(true)
        }
      })
      .catch(() => {})
  }, [listingId])

  function ensureAuth(): boolean {
    if (!session?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/listing/${listingId}`)}`)
      return false
    }
    return true
  }

  async function handleToggleFavorite() {
    if (!ensureAuth()) return
    const nextSaved = !isSaved
    setIsSaved(nextSaved)
    showToast(nextSaved ? 'Saved to favorites' : 'Removed from favorites')
    try {
      await toggleFavorite(listingId)
    } catch {
      setIsSaved(!nextSaved)
      showToast('Failed to update favorites')
    }
  }

  async function handleContactSeller() {
    if (!ensureAuth()) return
    if (session?.user?.id === listing?.userId) {
      showToast('You cannot message yourself')
      return
    }
    if (!listing) return

    setActionLoading(true)
    try {
      const conv = await startConversation(
        listing.id,
        `Hi! I saw your listing for "${listing.title}". Is it still available?`
      )
      if (conv.success && conv.id) {
        router.push(`/messages?conversationId=${conv.id}`)
      } else {
        showToast(conv.error || 'Failed to start chat')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to start chat')
    } finally {
      setActionLoading(false)
    }
  }

  function handleOpenOfferModal() {
    if (ensureAuth()) setOfferModalOpen(true)
  }

  function handleOpenBuyModal() {
    if (ensureAuth()) {
      setIsRentalPurchase(false)
      setBuyModalOpen(true)
    }
  }

  function handleOpenReportModal() {
    if (ensureAuth()) setReportModalOpen(true)
  }

  function handleViewSellerProfile(e: React.MouseEvent) {
    e.preventDefault()
    if (!listing) return
    if (!session?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/seller/${listing.userId}`)}`)
      return
    }
    router.push(`/seller/${listing.userId}`)
  }

  async function executeAuthenticatedAction(
    e: React.FormEvent,
    action: () => Promise<void>,
    failureFallbackMsg: string
  ) {
    e.preventDefault()
    if (!session?.user) {
      router.push('/sign-in')
      return
    }
    setActionLoading(true)
    try {
      await action()
    } catch (err) {
      showToast(err instanceof Error ? err.message : failureFallbackMsg)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleMakeOfferSubmit(e: React.FormEvent) {
    const val = Number(offerAmount)
    if (!val || val <= 0) {
      e.preventDefault()
      showToast('Enter a valid amount in INR')
      return
    }
    await executeAuthenticatedAction(
      e,
      async () => {
        await makeOffer(listingId, val, offerNote)
        setOfferModalOpen(false)
        setOfferAmount('')
        setOfferNote('')
        showToast(`Offer of ₹${val} submitted to seller! Check Messages.`)
      },
      'Failed to send offer'
    )
  }

  async function handleBuyRequestSubmit(e: React.FormEvent) {
    await executeAuthenticatedAction(
      e,
      async () => {
        await requestTransaction(listingId, meetupLocation)
        setBuyModalOpen(false)
        showToast('Purchase request sent! The seller will contact you to coordinate handover.')
      },
      'Request failed'
    )
  }

  async function handleReportSubmit(e: React.FormEvent) {
    await executeAuthenticatedAction(
      e,
      async () => {
        await reportListing(listingId, reportReason)
        setReportModalOpen(false)
        showToast('Listing reported. Our campus moderation team will review it.')
      },
      'Report failed'
    )
  }

  function handleShare() {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href)
      showToast('Listing link copied to clipboard!')
    }
  }

  return {
    router,
    session,
    listing,
    setListing,
    sellerStats,
    activeImageIndex,
    setActiveImageIndex,
    isSaved,
    loading,
    toastMessage,
    showToast,
    offerModalOpen,
    setOfferModalOpen,
    offerAmount,
    setOfferAmount,
    offerNote,
    setOfferNote,
    buyModalOpen,
    setBuyModalOpen,
    meetupLocation,
    setMeetupLocation,
    reportModalOpen,
    setReportModalOpen,
    reportReason,
    setReportReason,
    actionLoading,
    rentalDuration,
    setRentalDuration,
    isRentalPurchase,
    setIsRentalPurchase,
    handleToggleFavorite,
    handleContactSeller,
    handleOpenOfferModal,
    handleOpenBuyModal,
    handleOpenReportModal,
    handleViewSellerProfile,
    handleMakeOfferSubmit,
    handleBuyRequestSubmit,
    handleReportSubmit,
    handleShare,
  }
}
