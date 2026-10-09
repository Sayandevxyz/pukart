'use client'

import React, { useState } from 'react'
import { Bike, Calculator, Sparkles } from 'lucide-react'
import type { ListingItem } from '@/lib/types'
import { setListingDailyRentPrice } from '@/app/actions/listings'

export type RentalDuration = '1_day' | '3_days' | '1_week' | '1_month'

export const RENTAL_OPTIONS: Record<
  RentalDuration,
  { label: string; multiplier: number; days: number }
> = {
  '1_day': { label: 'Daily (1 Day)', multiplier: 1, days: 1 },
  '3_days': { label: 'Weekend Pass (3 Days)', multiplier: 2.4, days: 3 },
  '1_week': { label: 'Weekly Transit (7 Days)', multiplier: 4.8, days: 7 },
  '1_month': { label: 'Semester Month (30 Days)', multiplier: 14, days: 30 },
}

export function extractDailyRentPrice(item: Partial<ListingItem> | null | undefined): number {
  if (!item) return 350
  const unit = item.priceUnit || ''
  const match = unit.match(/daily_?(\d+)/i) || unit.match(/(\d+)/)
  if (match) {
    const parsed = parseInt(match[1], 10)
    if (parsed >= 20 && parsed <= 10000) return parsed
  }
  if (item.category === 'Scooty' || item.category === 'Bikes') {
    return 350
  }
  if (item.category === 'Cycles') {
    return 80
  }
  if (
    item.type === 'rent' &&
    typeof item.price === 'number' &&
    item.price >= 50 &&
    item.price <= 1000
  ) {
    return item.price
  }
  return 350
}

interface MobilityCalculatorProps {
  listing: ListingItem
  isOwner: boolean
  baseDailyRentalPrice: number
  rentalDuration: RentalDuration
  setRentalDuration: (val: RentalDuration) => void
  onUpdateDailyPrice: (newPrice: number) => void
  onOpenRentModal: () => void
  showToast: (msg: string) => void
}

export function MobilityCalculator({
  listing,
  isOwner,
  baseDailyRentalPrice,
  rentalDuration,
  setRentalDuration,
  onUpdateDailyPrice,
  onOpenRentModal,
  showToast,
}: MobilityCalculatorProps) {
  const [customDailyPrice, setCustomDailyPrice] = useState<string>(String(baseDailyRentalPrice))
  const [savingCustomPrice, setSavingCustomPrice] = useState(false)

  const selectedRentalConfig = RENTAL_OPTIONS[rentalDuration] || RENTAL_OPTIONS['1_day']
  const calculatedRentalAmount = Math.max(
    20,
    Math.round(baseDailyRentalPrice * selectedRentalConfig.multiplier)
  )
  const calculatedDepositAmount = Math.max(
    200,
    Math.min(1000, Math.round(baseDailyRentalPrice * 1.5))
  )

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-teal-950/20 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Bike size={16} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-primary">Campus Transit & Mobility Rental</h2>
            <p className="text-[11px] text-muted-foreground">800-acre PU Campus Walk-Saver</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
          Green Ride
        </span>
      </div>

      {isOwner && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent" />
              Seller Control: Customize 1-Day Rental Price
            </span>
            <span className="text-xs font-extrabold text-white">
              Current: ₹{baseDailyRentalPrice}/day
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground mr-1">PU Presets:</span>
            {[350, 400, 450, 500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={async () => {
                  setSavingCustomPrice(true)
                  try {
                    await setListingDailyRentPrice(listing.id, preset)
                    onUpdateDailyPrice(preset)
                    setCustomDailyPrice(String(preset))
                    showToast(`Daily rental price updated to ₹${preset}/day!`)
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : 'Failed to update rental price')
                  } finally {
                    setSavingCustomPrice(false)
                  }
                }}
                disabled={savingCustomPrice}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                  baseDailyRentalPrice === preset
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                    : 'bg-card/80 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                ₹{preset}/day
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                ₹
              </span>
              <input
                type="number"
                min="50"
                max="5000"
                value={customDailyPrice}
                onChange={(e) => setCustomDailyPrice(e.target.value)}
                placeholder="Custom ₹/day (e.g. 400)"
                className="h-9 w-full rounded-lg border border-border bg-background pl-7 pr-3 text-xs font-bold text-foreground outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              disabled={
                savingCustomPrice ||
                !customDailyPrice ||
                Number(customDailyPrice) === baseDailyRentalPrice
              }
              onClick={async () => {
                const val = Number(customDailyPrice)
                if (!val || val < 50 || val > 5000) {
                  showToast('Enter a fair daily rate between ₹50 and ₹5,000')
                  return
                }
                setSavingCustomPrice(true)
                try {
                  await setListingDailyRentPrice(listing.id, val)
                  onUpdateDailyPrice(val)
                  showToast(`Daily rental price set to ₹${val}/day!`)
                } catch (err) {
                  showToast(err instanceof Error ? err.message : 'Failed to update')
                } finally {
                  setSavingCustomPrice(false)
                }
              }}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {savingCustomPrice ? 'Saving...' : 'Save Rate'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5" role="group" aria-labelledby="rental-duration-heading">
        <p
          id="rental-duration-heading"
          className="text-xs font-semibold text-foreground flex items-center gap-1"
        >
          <Calculator size={12} className="text-accent" />
          <span>Select Rental Duration:</span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            Object.entries(RENTAL_OPTIONS) as [
              RentalDuration,
              (typeof RENTAL_OPTIONS)[RentalDuration]
            ][]
          ).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRentalDuration(key)}
              className={`rounded-xl p-2.5 text-center text-xs font-bold transition border ${
                rentalDuration === key
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-card/80 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }`}
            >
              <p className="truncate">{config.label.split(' (')[0]}</p>
              <p className="text-[10px] opacity-80">
                {config.days} Day{config.days > 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between font-semibold">
          <span className="text-muted-foreground">Est. Rental Cost ({selectedRentalConfig.label}):</span>
          <span className="text-sm font-extrabold text-primary">
            ₹{calculatedRentalAmount.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center justify-between font-medium text-slate-300">
          <span className="text-muted-foreground">Refundable Hostel Security Deposit:</span>
          <span className="font-bold text-accent">
            ₹{calculatedDepositAmount.toLocaleString('en-IN')}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
          * Deposit is 100% refunded in-person when returning the cycle/scooty at Central Library or
          your hostel quadrangle.
        </p>
      </div>

      {!isOwner && (
        <button
          type="button"
          onClick={onOpenRentModal}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition active:scale-[0.99]"
        >
          <Bike size={14} />
          <span>
            Rent for {selectedRentalConfig.label} (₹{calculatedRentalAmount})
          </span>
        </button>
      )}
    </div>
  )
}
