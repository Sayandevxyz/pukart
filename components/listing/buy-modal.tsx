'use client'

import React, { useEffect } from 'react'
import { X, ShieldCheck } from 'lucide-react'

interface BuyModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  listingPrice: number
  meetupLocation: string
  setMeetupLocation: (val: string) => void
  actionLoading: boolean
}

export function BuyModal({
  isOpen,
  onClose,
  onSubmit,
  listingPrice,
  meetupLocation,
  setMeetupLocation,
  actionLoading,
}: BuyModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-modal-title"
      aria-describedby="buy-modal-desc"
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

        <h3 id="buy-modal-title" className="text-xl font-bold text-primary">
          Confirm Purchase Request
        </h3>
        <p id="buy-modal-desc" className="mt-1 text-xs text-muted-foreground">
          Request purchase for ₹{listingPrice.toLocaleString('en-IN')} via Campus Meetup.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="meetup-location-select"
              className="block text-xs font-bold uppercase tracking-wider text-foreground"
            >
              Preferred Campus Meetup Spot
            </label>
            <select
              id="meetup-location-select"
              value={meetupLocation}
              onChange={(e) => setMeetupLocation(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option>Central Library Entrance</option>
              <option>Science Complex Gate</option>
              <option>Silver Jubilee Campus</option>
              <option>Gate 1 / Main Gate</option>
              <option>Gate 2 / East Gate</option>
              <option>Hostel Mess / Common Room</option>
            </select>
          </div>

          <div className="rounded-xl bg-muted/70 p-3.5 text-xs text-muted-foreground border border-border/50">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Campus Cash / UPI on Meetup</span>
            </div>
            <p className="mt-1">
              You will inspect the item in person and pay the seller directly during the campus meetup.
            </p>
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
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              {actionLoading ? 'Sending...' : 'Confirm Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
