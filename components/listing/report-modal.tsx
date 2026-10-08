'use client'

import React, { useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  reportReason: string
  setReportReason: (val: string) => void
  actionLoading: boolean
}

export function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  reportReason,
  setReportReason,
  actionLoading,
}: ReportModalProps) {
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
      aria-labelledby="report-modal-title"
      aria-describedby="report-modal-desc"
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

        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-destructive" />
          <h3 id="report-modal-title" className="text-xl font-bold text-destructive">
            Report Listing
          </h3>
        </div>
        <p id="report-modal-desc" className="mt-1 text-xs text-muted-foreground">
          Help keep PUKart safe and honest for all Pondicherry University students.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="report-reason-select"
              className="block text-xs font-bold uppercase tracking-wider text-foreground"
            >
              Reason for Report
            </label>
            <select
              id="report-reason-select"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20"
            >
              <option>Suspicious pricing or advance payment requested</option>
              <option>Counterfeit or misrepresented product</option>
              <option>Prohibited item on campus</option>
              <option>Spam or duplicate listing</option>
              <option>Harassment or abusive content</option>
            </select>
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
              className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              {actionLoading ? 'Reporting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
