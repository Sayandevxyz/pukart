'use client'

import React from 'react'
import Link from 'next/link'
import {
  MessageCircle,
  Tag,
  ShoppingBag,
  Flag,
  Edit,
} from 'lucide-react'
import type { ListingItem } from '@/lib/types'
import { setListingStatus } from '@/app/actions/listings'

interface ListingActionsProps {
  listing: ListingItem
  isOwner: boolean
  actionLoading: boolean
  onContactSeller: () => void
  onOpenOfferModal: () => void
  onOpenBuyModal: () => void
  onOpenReportModal: () => void
  onStatusChanged: (nextStatus: string) => void
  showToast: (msg: string) => void
}

export function ListingActions({
  listing,
  isOwner,
  actionLoading,
  onContactSeller,
  onOpenOfferModal,
  onOpenBuyModal,
  onOpenReportModal,
  onStatusChanged,
  showToast,
}: ListingActionsProps) {
  if (isOwner) {
    return (
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
              onStatusChanged(next)
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
            onStatusChanged('sold')
            showToast('Listing marked as SOLD')
          }}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition"
        >
          Mark as Sold
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onContactSeller}
          disabled={actionLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-95 active:scale-98 transition disabled:opacity-50"
        >
          <MessageCircle size={17} /> Contact Seller
        </button>
        <button
          onClick={onOpenOfferModal}
          disabled={actionLoading}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background py-3.5 text-sm font-bold text-primary hover:bg-primary/5 active:scale-98 transition"
        >
          <Tag size={17} /> Make Offer
        </button>
      </div>

      <button
        onClick={onOpenBuyModal}
        disabled={actionLoading || listing.status !== 'active'}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-base font-extrabold text-accent-foreground shadow-lg hover:opacity-95 active:scale-98 transition disabled:opacity-50"
      >
        <ShoppingBag size={19} /> Buy / Request Purchase
      </button>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition"
        >
          <Flag size={13} /> Report listing
        </button>
        <span className="text-xs text-muted-foreground">
          {listing.viewsCount || 1} campus views
        </span>
      </div>
    </div>
  )
}
