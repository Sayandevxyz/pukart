'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/components/listing/use-focus-trap'

export interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface ModalDialogProps extends BaseModalProps {
  titleId?: string
  descId?: string
  title?: string
  header?: React.ReactNode
  description: string
  children: React.ReactNode
}

export function ModalDialog({
  isOpen,
  onClose,
  titleId = 'modal-dialog-title',
  descId = 'modal-dialog-desc',
  title,
  header,
  description,
  children,
}: ModalDialogProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)
  if (!isOpen) return null

  const resolvedHeader =
    header ??
    (title ? (
      <h3 id={titleId} className="text-xl font-bold text-primary">
        {title}
      </h3>
    ) : null)

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
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

        {resolvedHeader}
        <p id={descId} className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>

        {children}
      </div>
    </div>
  )
}

export interface ModalActionButtonsProps {
  onCancel: () => void
  submitLabel?: string
  submitText?: string
  loadingLabel?: string
  isLoading?: boolean
  submitting?: boolean
  cancelText?: string
  submitVariant?: 'primary' | 'accent' | 'destructive'
}

export function ModalActionButtons({
  onCancel,
  submitLabel,
  submitText,
  loadingLabel = 'Submitting...',
  isLoading,
  submitting,
  cancelText = 'Cancel',
  submitVariant = 'primary',
}: ModalActionButtonsProps) {
  const isBusy = isLoading ?? submitting ?? false
  const finalSubmitText = submitText || submitLabel || 'Submit'

  const variantClass =
    submitVariant === 'destructive'
      ? 'bg-destructive text-destructive-foreground'
      : submitVariant === 'accent'
      ? 'bg-accent text-accent-foreground'
      : 'bg-primary text-primary-foreground'

  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted transition"
      >
        {cancelText}
      </button>
      <button
        type="submit"
        disabled={isBusy}
        className={`flex-1 rounded-xl py-3 text-sm font-bold hover:opacity-90 transition disabled:opacity-50 ${variantClass}`}
      >
        {isBusy ? loadingLabel : finalSubmitText}
      </button>
    </div>
  )
}
