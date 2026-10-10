'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Layers,
  Star,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import {
  getMyTransactions,
  updateTransactionStatus,
  leaveReview,
} from '@/app/actions/marketplace'
import { useToast } from '@/lib/hooks/useToast'
import { useRequireAuth } from '@/lib/hooks/useRequireAuth'
import { PageShell } from '@/components/ui/PageShell'
import { TabNavigation } from '@/components/ui/TabNavigation'
import { TransactionReviewModal } from '@/components/transactions/TransactionReviewModal'

type TransactionEntry = Awaited<ReturnType<typeof getMyTransactions>>[number]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'buying' | 'selling'>('all')
  const { toastMessage, showToast } = useToast()

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<TransactionEntry | null>(null)
  const [rating, setRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const { loading } = useRequireAuth(() => {
    loadTransactions()
  })

  async function loadTransactions() {
    try {
      const data = await getMyTransactions()
      setTransactions(data)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load transactions')
    }
  }

  async function handleStatusUpdate(txId: number, status: 'accepted' | 'completed' | 'rejected' | 'cancelled') {
    try {
      await updateTransactionStatus(txId, status)
      showToast(`Transaction updated to ${status.toUpperCase()}`)
      loadTransactions()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update transaction status')
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTx) return
    setSubmittingReview(true)
    try {
      await leaveReview({
        transactionId: selectedTx.id,
        rating,
        body: reviewBody,
      })
      setReviewModalOpen(false)
      showToast('Thank you! Your campus review has been published.')
      loadTransactions()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const filtered = transactions.filter((tx) => {
    if (activeTab === 'buying') return tx.isBuyer
    if (activeTab === 'selling') return !tx.isBuyer
    return true
  })

  return (
    <PageShell toastMessage={toastMessage} maxWidthClass="max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">Campus Transactions & Deals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage purchase requests, campus meetups, and leave two-way student reviews.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <TabNavigation
            tabs={[
              { id: 'all' as const, label: `All Deals (${transactions.length})` },
              { id: 'buying' as const, label: `Buying (${transactions.filter((t) => t.isBuyer).length})` },
              { id: 'selling' as const, label: `Selling (${transactions.filter((t) => !t.isBuyer).length})` },
            ]}
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">Loading transaction records...</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <Layers className="mx-auto size-14 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-bold text-primary">No transactions found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              When you make an offer or accept a buyer&apos;s request, deal tracking will appear here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground"
            >
              Explore Campus Marketplace
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((tx) => {
              const isSeller = !tx.isBuyer
              const counterpart = tx.isBuyer ? tx.seller : tx.buyer

              return (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <Image
                          src={tx.listing?.imageUrl || '/images/campus-marketplace.png'}
                          alt={tx.listing?.title || 'Listing'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              tx.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.status === 'accepted'
                                ? 'bg-blue-100 text-blue-800'
                                : tx.status === 'requested' || tx.status === 'inquiry'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {tx.status}
                          </span>
                          <span className="text-xs font-semibold text-accent">
                            {tx.isBuyer ? 'You are Buyer' : 'You are Seller'}
                          </span>
                        </div>
                        <Link
                          href={`/listing/${tx.listingId}`}
                          className="font-bold text-primary hover:text-accent text-base block mt-0.5"
                        >
                          {tx.listing?.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Amount: <span className="font-extrabold text-foreground">₹{tx.amount.toLocaleString('en-IN')}</span> · Counterpart: {counterpart?.name || 'Student'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  {tx.status === 'accepted' && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900 flex items-start gap-2">
                      <ShieldCheck className="size-4 shrink-0 mt-0.5 text-blue-700" />
                      <div>
                        <p className="font-bold">Ready for Campus Meetup</p>
                        <p className="mt-0.5 text-[11px] text-blue-800">
                          Meet in a public campus spot ({tx.meetupLocation || 'Central Library'}). Verify the product in person, complete the cash/UPI exchange, and click &quot;Mark Completed&quot;.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
                    <div className="flex gap-2">
                      <Link
                        href={`/listing/${tx.listingId}`}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <ExternalLink size={13} /> View Listing
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      
                      {isSeller && (tx.status === 'requested' || tx.status === 'inquiry') && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(tx.id, 'accepted')}
                            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition"
                          >
                            Accept Deal
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(tx.id, 'rejected')}
                            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {tx.status === 'accepted' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(tx.id, 'completed')}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(tx.id, 'cancelled')}
                            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20"
                          >
                            Cancel Deal
                          </button>
                        </>
                      )}

                      {tx.status === 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedTx(tx)
                            setReviewModalOpen(true)
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground hover:opacity-90"
                        >
                          <Star size={13} fill="currentColor" /> Leave Campus Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <TransactionReviewModal
          isOpen={reviewModalOpen && Boolean(selectedTx)}
          onClose={() => setReviewModalOpen(false)}
          listingTitle={selectedTx?.listing?.title}
          rating={rating}
          onRatingChange={setRating}
          reviewBody={reviewBody}
          onReviewBodyChange={setReviewBody}
          onSubmit={handleReviewSubmit}
          submitting={submittingReview}
        />
    </PageShell>
  )
}
