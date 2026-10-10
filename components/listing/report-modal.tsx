'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { ModalDialog, ModalActionButtons, type BaseModalProps } from '@/components/ui/modal-dialog'

interface ReportModalProps extends BaseModalProps {
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
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId="report-modal-title"
      descId="report-modal-desc"
      header={
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-destructive" />
          <h3 id="report-modal-title" className="text-xl font-bold text-destructive">
            Report Listing
          </h3>
        </div>
      }
      description="Help keep PUKart safe and honest for all Pondicherry University students."
    >
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

        <ModalActionButtons
          onCancel={onClose}
          submitLabel="Submit Report"
          loadingLabel="Reporting..."
          isLoading={actionLoading}
          submitVariant="destructive"
        />
      </form>
    </ModalDialog>
  )
}
