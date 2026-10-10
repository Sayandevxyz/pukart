'use client'

import React from 'react'
import { ModalDialog, ModalActionButtons, type BaseModalProps } from '@/components/ui/modal-dialog'

interface OfferModalProps extends BaseModalProps {
  onSubmit: (e: React.FormEvent) => void
  listingPrice: number
  offerAmount: string
  setOfferAmount: (val: string) => void
  offerNote: string
  setOfferNote: (val: string) => void
  actionLoading: boolean
}

export function OfferModal({
  isOpen,
  onClose,
  onSubmit,
  listingPrice,
  offerAmount,
  setOfferAmount,
  offerNote,
  setOfferNote,
  actionLoading,
}: OfferModalProps) {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="offer-modal-title"
      descId="offer-modal-desc"
      header={
        <h3 id="offer-modal-title" className="text-xl font-bold text-primary">
          Make an Offer
        </h3>
      }
      description={`Listed at ₹${listingPrice.toLocaleString('en-IN')}. Propose a fair counter-price to the student seller.`}
    >
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="offer-amount-input"
            className="block text-xs font-bold uppercase tracking-wider text-foreground"
          >
            Offer Amount (₹ INR)
          </label>
          <input
            id="offer-amount-input"
            type="number"
            min="1"
            required
            aria-required="true"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            placeholder="e.g. 1500"
            className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-bold outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label
            htmlFor="offer-note-input"
            className="block text-xs font-bold uppercase tracking-wider text-foreground"
          >
            Message for Seller (Optional)
          </label>
          <textarea
            id="offer-note-input"
            value={offerNote}
            onChange={(e) => setOfferNote(e.target.value)}
            placeholder="e.g., Can meet at Library today at 4 PM"
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <ModalActionButtons
          onCancel={onClose}
          submitLabel="Send Offer"
          loadingLabel="Submitting..."
          isLoading={actionLoading}
          submitVariant="accent"
        />
      </form>
    </ModalDialog>
  )
}
