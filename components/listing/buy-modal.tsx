'use client'

import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { ModalDialog, ModalActionButtons, type BaseModalProps } from '@/components/ui/modal-dialog'

interface BuyModalProps extends BaseModalProps {
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
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="buy-modal-title"
      descId="buy-modal-desc"
      header={
        <h3 id="buy-modal-title" className="text-xl font-bold text-primary">
          Confirm Purchase Request
        </h3>
      }
      description={`Request purchase for ₹${listingPrice.toLocaleString('en-IN')} via Campus Meetup.`}
    >
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

        <ModalActionButtons
          onCancel={onClose}
          submitLabel="Confirm Request"
          loadingLabel="Sending..."
          isLoading={actionLoading}
          submitVariant="primary"
        />
      </form>
    </ModalDialog>
  )
}
