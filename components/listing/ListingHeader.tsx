'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import type { ListingItem } from '@/lib/types'

interface ListingHeaderProps {
  listing: ListingItem
}

export function ListingBreadcrumbs({ listing }: ListingHeaderProps) {
  return (
    <div className="border-b border-border bg-card/40">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground sm:px-6 lg:px-8">
        <Link href="/" className="hover:text-primary">
          Marketplace
        </Link>
        <span>/</span>
        <Link href={`/?category=${encodeURIComponent(listing.category)}`} className="hover:text-primary">
          {listing.category}
        </Link>
        <span>/</span>
        <span className="truncate text-foreground max-w-[200px] sm:max-w-none">{listing.title}</span>
      </div>
    </div>
  )
}

export function ListingHeader({ listing }: ListingHeaderProps) {
  const formattedDate = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently'
  const hasDiscount = Boolean(listing.originalPrice && listing.originalPrice > listing.price)
  const discountPercent =
    hasDiscount && listing.originalPrice
      ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">{listing.category}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={13} /> Posted {formattedDate}
          </span>
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          {listing.title}
        </h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Price</p>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-extrabold text-primary">
            ₹{listing.price.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <>
              <span className="text-base text-muted-foreground line-through">
                ₹{listing.originalPrice?.toLocaleString('en-IN')}
              </span>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {discountPercent}% OFF
              </span>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
          <MapPin size={13} className="text-accent" />
          <span>Pickup: {listing.location || 'Pondicherry University'}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-xs font-medium text-muted-foreground">Condition</p>
          <p className="mt-1 font-bold capitalize text-primary">
            {listing.condition ? listing.condition.replace('_', ' ') : 'Not specified'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-xs font-medium text-muted-foreground">Listing Type</p>
          <p className="mt-1 font-bold capitalize text-primary">{listing.type || 'Sell'}</p>
        </div>
      </div>
    </div>
  )
}
