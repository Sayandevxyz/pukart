'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Lock,
  Star,
  GraduationCap,
  Home,
  Zap,
  Award,
} from 'lucide-react'
import type { ListingItem, UserRatingStats } from '@/lib/types'

interface SellerBadgeCardProps {
  listing: ListingItem
  sellerStats: UserRatingStats | null
  session: { user?: { id: string; name?: string; email?: string } } | null
  onViewSellerProfile: (e: React.MouseEvent) => void
}

export function SellerBadgeCard({
  listing,
  sellerStats,
  session,
  onViewSellerProfile,
}: SellerBadgeCardProps) {
  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center gap-2.5 text-sm font-bold text-foreground">
          <ShieldCheck className="size-5 text-accent shrink-0" />
          <span>Seller & Contact Info Protected</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          To prevent spam and safeguard privacy, seller contact numbers, WhatsApp, and academic
          details are visible only to signed-in users.
        </p>
        <Link
          href={`/sign-in?redirect=${encodeURIComponent(`/listing/${listing.id}`)}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-xs font-bold text-primary-foreground shadow-md hover:opacity-95 active:scale-98 transition"
        >
          <Lock size={14} /> Sign In to Buy, Sell & Rent
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Seller Information
      </p>
      <div className="flex items-center gap-3.5">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-sm">
          {listing.sellerName?.[0]?.toUpperCase() || 'P'}
        </div>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={onViewSellerProfile}
            className="font-bold text-primary hover:text-accent truncate block text-base text-left"
          >
            {listing.sellerName || 'Verified Seller'}
          </button>
          {listing.seller?.department && (
            <p className="text-xs text-muted-foreground truncate">
              {listing.seller.department} {listing.seller.year ? `· Year ${listing.seller.year}` : ''}
            </p>
          )}
        </div>
        {sellerStats?.averageRating && (
          <div className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-bold text-white shadow-sm">
            <span>{sellerStats.averageRating}</span>
            <Star size={11} fill="currentColor" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-border/60">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
          <GraduationCap size={12} className="text-emerald-400 shrink-0" />
          <span>
            Verified Scholar {listing.seller?.department ? `(${listing.seller.department.slice(0, 20)})` : 'PU'}
          </span>
        </span>

        {listing.seller?.hostel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
            <Home size={12} className="text-blue-400 shrink-0" />
            <span>Hosteller ({listing.seller.hostel.slice(0, 18)})</span>
          </span>
        )}

        {(sellerStats?.averageRating || 5) >= 4.5 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
            <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
            <span>Top Senior Peer ({sellerStats?.averageRating || '5.0'} / 5)</span>
          </span>
        )}

        <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-400 border border-teal-500/20">
          <Zap size={12} className="text-teal-400 shrink-0" />
          <span>Same-Day Handoff</span>
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20">
          <Award size={12} className="text-indigo-400 shrink-0" />
          <span>
            {(sellerStats?.reviewCount || 0) > 0
              ? `${sellerStats?.reviewCount} Meetups Completed`
              : 'Campus Verified'}
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={onViewSellerProfile}
        className="w-full text-center rounded-xl border border-border bg-background py-2 text-xs font-bold text-primary hover:bg-muted transition"
      >
        View Seller Profile & Other Listings
      </button>
    </div>
  )
}
