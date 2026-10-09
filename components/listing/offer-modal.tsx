'use client'

import React from 'react'
import { X } from 'lucide-react'

import { useFocusTrap } from './use-focus-trap'

interface OfferModalProps {
  isOpen: boolean
  onClose: () => void
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
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)

  if (!isOpen) return null

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-modal-title"
      aria-describedby="offer-modal-desc"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-border">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <X size={18} />
        </button>

        <h3 id="offer-modal-title" className="text-xl font-bold text-primary">
          Make an Offer
        </h3>
        <p id="offer-modal-desc" className="mt-1 text-xs text-muted-foreground">
          Listed at ₹{listingPrice.toLocaleString('en-IN')}. Propose a fair counter-price to the student seller.
        </p>

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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              {actionLoading ? 'Submitting...' : 'Send Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
