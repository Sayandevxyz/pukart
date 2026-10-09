'use client'

import React, { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { ShoppingBag } from 'lucide-react'
import { OfferModal } from '@/components/listing/offer-modal'
import { BuyModal } from '@/components/listing/buy-modal'
import { ReportModal } from '@/components/listing/report-modal'
import { ListingBreadcrumbs, ListingHeader } from '@/components/listing/ListingHeader'
import { ListingGallery } from '@/components/listing/ListingGallery'
import {
  MobilityCalculator,
  extractDailyRentPrice,
  RENTAL_OPTIONS,
} from '@/components/listing/MobilityCalculator'
import { SellerBadgeCard } from '@/components/listing/SellerBadgeCard'
import { ListingActions } from '@/components/listing/ListingActions'
import { useListingDetail } from '@/components/listing/use-listing-detail'

export default function ListingDetailPage() {
  const params = useParams()
  const listingId = Number(params?.id)

  const {
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
  } = useListingDetail(listingId)

  const isMobilityItem = Boolean(
    listing &&
      (listing.type === 'rent' ||
        ['Cycles', 'Scooty', 'Bikes'].includes(listing.category))
  )

  const baseDailyRentalPrice = useMemo(() => extractDailyRentPrice(listing), [
    listing?.priceUnit,
    listing?.category,
    listing?.type,
    listing?.price,
  ])

  const selectedRentalConfig = RENTAL_OPTIONS[rentalDuration] || RENTAL_OPTIONS['1_day']
  const calculatedRentalAmount = Math.max(
    20,
    Math.round(baseDailyRentalPrice * selectedRentalConfig.multiplier)
  )

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
  const images =
    listing.images && listing.images.length > 0
      ? listing.images
      : [listing.imageUrl || '/images/campus-marketplace.png']

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

      <ListingBreadcrumbs listing={listing} />

      <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <ListingGallery
            listing={listing}
            images={images}
            activeImageIndex={activeImageIndex}
            setActiveImageIndex={setActiveImageIndex}
            isSaved={isSaved}
            onToggleFavorite={handleToggleFavorite}
            onShare={handleShare}
          />

          <div className="space-y-6 lg:col-span-5">
            <ListingHeader listing={listing} />

            {isMobilityItem && (
              <MobilityCalculator
                listing={listing}
                isOwner={isOwner}
                baseDailyRentalPrice={baseDailyRentalPrice}
                rentalDuration={rentalDuration}
                setRentalDuration={setRentalDuration}
                onUpdateDailyPrice={(newPrice) => {
                  setListing({ ...listing, priceUnit: `daily_${newPrice}` })
                }}
                onOpenRentModal={() => {
                  setMeetupLocation('Central Library Cycle Stand')
                  setIsRentalPurchase(true)
                  setBuyModalOpen(true)
                }}
                showToast={showToast}
              />
            )}

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {listing.description}
              </p>
            </div>

            <SellerBadgeCard
              listing={listing}
              sellerStats={sellerStats}
              session={session}
              onViewSellerProfile={handleViewSellerProfile}
            />

            <ListingActions
              listing={listing}
              isOwner={isOwner}
              actionLoading={actionLoading}
              onContactSeller={handleContactSeller}
              onOpenOfferModal={handleOpenOfferModal}
              onOpenBuyModal={handleOpenBuyModal}
              onOpenReportModal={handleOpenReportModal}
              onStatusChanged={(nextStatus) => {
                setListing({ ...listing, status: nextStatus })
              }}
              showToast={showToast}
            />
          </div>
        </div>
      </main>

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

      <BuyModal
        isOpen={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        onSubmit={handleBuyRequestSubmit}
        listingPrice={isRentalPurchase ? calculatedRentalAmount : listing?.price || 0}
        meetupLocation={meetupLocation}
        setMeetupLocation={setMeetupLocation}
        actionLoading={actionLoading}
      />

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
