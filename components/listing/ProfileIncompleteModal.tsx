'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, UserRound } from 'lucide-react'

export interface ProfileIncompleteModalProps {
  missingFields: string[] | null
}

export function ProfileIncompleteModal({ missingFields }: ProfileIncompleteModalProps) {
  if (!missingFields || missingFields.length === 0) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex items-center gap-3 text-amber-400">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-bold text-foreground">Complete Your Profile</h2>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Before listing items on PUKart, you need to complete your Pondicherry University student profile. This helps buyers verify your identity and arrange safe campus meetups.
        </p>

        <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
          <p className="text-xs font-bold text-amber-300 mb-2">Missing information:</p>
          <ul className="space-y-1">
            {missingFields.map((field) => (
              <li key={field} className="flex items-center gap-2 text-xs text-amber-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {field}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/profile?redirect=/listing/new"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg hover:opacity-90 transition"
        >
          <UserRound size={16} />
          Complete Profile Now
        </Link>

        <Link
          href="/"
          className="mt-2 flex w-full items-center justify-center rounded-xl border border-border py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  )
}
