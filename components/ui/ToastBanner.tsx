'use client'

import React from 'react'

export interface ToastBannerProps {
  message: string | null
}

export function ToastBanner({ message }: ToastBannerProps) {
  if (!message) return null

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-2xl"
    >
      {message}
    </div>
  )
}
