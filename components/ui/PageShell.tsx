'use client'

import React from 'react'
import { Navbar } from '@/components/navbar'
import { ToastBanner } from '@/components/ui/ToastBanner'

export interface PageShellProps {
  toastMessage?: string | null
  maxWidthClass?: string
  children: React.ReactNode
}

export function PageShell({
  toastMessage,
  maxWidthClass = 'max-w-6xl',
  children,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <ToastBanner message={toastMessage ?? null} />
      <main id="main-content" className={`mx-auto ${maxWidthClass} px-4 py-8 sm:px-6 lg:px-8`}>
        {children}
      </main>
    </div>
  )
}

export function PageLoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex h-[calc(100vh-120px)] flex-col items-center justify-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
