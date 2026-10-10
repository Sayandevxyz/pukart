'use client'

import React from 'react'
import {
  ShieldCheck,
  Star,
  MessageCircle,
  GraduationCap,
  Phone,
  Copy,
  Check,
  Home,
  Zap,
  Award,
} from 'lucide-react'
import type { SellerProfileData } from '@/lib/types'

export interface SellerHeaderCardProps {
  user: SellerProfileData['user']
  ratingStats: SellerProfileData['ratingStats']
  copiedPhone: boolean
  onCopyPhone: (phone?: string | null) => void
}

export function SellerHeaderCard({
  user,
  ratingStats,
  copiedPhone,
  onCopyPhone,
}: SellerHeaderCardProps) {
  const avgRating = ratingStats?.averageRating
  const reviewCount = ratingStats?.reviewCount || 0

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex size-20 sm:size-24 shrink-0 items-center justify-center rounded-3xl bg-primary text-3xl font-bold text-primary-foreground shadow-lg">
          {user.name?.[0]?.toUpperCase() || 'P'}
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">{user.name}</h1>
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
              <ShieldCheck size={14} /> Verified PU Account
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
          {(user.department || user.course) && (
            <p className="text-xs sm:text-sm text-foreground/80 font-semibold">
              {user.course || 'Student'} {user.department ? `· Dept of ${user.department}` : ''} {user.year ? `· Year ${user.year}` : ''}
            </p>
          )}
          {user.bio && <p className="text-xs text-muted-foreground mt-2 max-w-2xl">{user.bio}</p>}

          {user.phone && (
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
              <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                <Phone size={13} className="text-accent" />
                <span>{user.phone.startsWith('+') ? user.phone : `+91 ${user.phone}`}</span>
              </span>

              <button
                type="button"
                onClick={() => onCopyPhone(user.phone)}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition"
              >
                {copiedPhone ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/${user.phone.replace(/\D/g, '').length === 10 ? `91${user.phone.replace(/\D/g, '')}` : user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hi ${user.name || 'there'}, I found your profile on PUKart and would like to inquire about your campus listings.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <MessageCircle size={12} /> WhatsApp
              </a>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-border/60">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
              <GraduationCap size={12} className="text-emerald-400 shrink-0" />
              <span>Verified Scholar {user.department ? `(${user.department})` : 'PU'}</span>
            </span>

            {user.hostel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                <Home size={12} className="text-blue-400 shrink-0" />
                <span>Hosteller ({user.hostel})</span>
              </span>
            )}

            {(avgRating || 5) >= 4.5 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                <span>Top Senior Peer ({avgRating || '5.0'} / 5)</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-400 border border-teal-500/20">
              <Zap size={12} className="text-teal-400 shrink-0" />
              <span>Same-Day Handoff</span>
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20">
              <Award size={12} className="text-indigo-400 shrink-0" />
              <span>{reviewCount > 0 ? `${reviewCount} Meetups Completed` : 'Campus Verified'}</span>
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center min-w-[140px]">
          <div className="flex items-center justify-center gap-1 text-2xl font-black text-primary">
            <span>{avgRating ?? 'New'}</span>
            {avgRating && <Star className="size-5 fill-emerald-600 text-emerald-600" />}
          </div>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
            {reviewCount} Campus Review{reviewCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>
    </div>
  )
}
