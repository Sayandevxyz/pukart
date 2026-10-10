'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { ModalDialog, ModalActionButtons } from '@/components/ui/modal-dialog'

export interface TransactionReviewModalProps {
  isOpen: boolean
  onClose: () => void
  listingTitle?: string
  rating: number
  onRatingChange: (rating: number) => void
  reviewBody: string
  onReviewBodyChange: (body: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
}

export function TransactionReviewModal({
  isOpen,
  onClose,
  listingTitle,
  rating,
  onRatingChange,
  reviewBody,
  onReviewBodyChange,
  onSubmit,
  submitting,
}: TransactionReviewModalProps) {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Student Review"
      description={`Rate your experience for the purchase of "${listingTitle || 'item'}".`}
    >
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div role="group" aria-labelledby="star-rating-label">
          <p id="star-rating-label" className="block text-xs font-bold uppercase tracking-wider text-foreground">
            Star Rating (1 - 5)
          </p>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onRatingChange(s)}
                className="p-1 hover:scale-110 transition"
              >
                <Star
                  size={26}
                  className={s <= rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="review-body-input" className="block text-xs font-bold uppercase tracking-wider text-foreground">
            Your Review Feedback
          </label>
          <textarea
            id="review-body-input"
            required
            rows={3}
            value={reviewBody}
            onChange={(e) => onReviewBodyChange(e.target.value)}
            placeholder="Describe punctuality, item condition as described, and campus handoff friendliness."
            className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <ModalActionButtons
          onCancel={onClose}
          cancelText="Cancel"
          submitText={submitting ? 'Publishing...' : 'Submit Review'}
          submitting={submitting}
        />
      </form>
    </ModalDialog>
  )
}
