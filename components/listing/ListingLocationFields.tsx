'use client'

import React from 'react'
import { Phone } from 'lucide-react'

export interface MobilityRateFieldProps {
  idPrefix: string
  category: string
  type: string
  dailyRentPrice: string
  setDailyRentPrice: (val: string) => void
}

export function MobilityRateField({
  idPrefix,
  category,
  type,
  dailyRentPrice,
  setDailyRentPrice,
}: MobilityRateFieldProps) {
  const isVehicle = ['Cycles', 'Scooty', 'Bikes'].includes(category)
  if (!isVehicle && type !== 'rent') return null

  const labelText =
    category === 'Cycles'
      ? 'Daily Cycle Rental Rate (₹/day)'
      : category === 'Scooty' || category === 'Bikes'
      ? 'Daily Scooty/Bike Rental Rate (₹/day)'
      : 'Rental Rate Per Day (₹/day)'

  const placeholderText =
    category === 'Cycles' ? '80' : category === 'Scooty' ? '350' : '200'

  const hintText =
    category === 'Cycles'
      ? 'Typical campus cycle rentals are ₹50 - ₹100 per day.'
      : category === 'Scooty' || category === 'Bikes'
      ? 'Typical campus scooty rentals are ₹300 - ₹500 per day.'
      : 'Renters will be able to book for multiple days based on this daily rate.'

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`${idPrefix}-daily-rent`}
          className="block text-xs font-bold uppercase tracking-wider text-accent"
        >
          {labelText}
        </label>
        <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
          Mobility Rental
        </span>
      </div>
      <div className="relative mt-1.5">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-accent">
          ₹
        </div>
        <input
          id={`${idPrefix}-daily-rent`}
          type="number"
          min="10"
          max="10000"
          value={dailyRentPrice}
          onChange={(e) => setDailyRentPrice(e.target.value)}
          placeholder={placeholderText}
          className="h-11 w-full rounded-xl border border-accent/30 bg-background pl-8 pr-16 text-sm font-bold text-foreground outline-none focus:border-accent"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-muted-foreground">
          / day
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{hintText}</p>
    </div>
  )
}

export interface LocationAndPhoneFieldsProps {
  idPrefix: string
  location: string
  setLocation: (val: string) => void
  phone: string
  setPhone: (val: string) => void
  locationPlaceholder?: string
}

export function LocationAndPhoneFields({
  idPrefix,
  location,
  setLocation,
  phone,
  setPhone,
  locationPlaceholder = 'e.g. Silver Beach Hostel / Gate 1 / Library',
}: LocationAndPhoneFieldsProps) {
  const locationId = `${idPrefix}-location`
  const phoneId = `${idPrefix}-phone`

  return (
    <>
      <div>
        <label
          htmlFor={locationId}
          className="block text-xs font-bold uppercase tracking-wider text-foreground"
        >
          Campus Location
        </label>
        <input
          id={locationId}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={locationPlaceholder}
          className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-accent"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor={phoneId}
            className="block text-xs font-bold uppercase tracking-wider text-foreground"
          >
            Phone / WhatsApp Number{' '}
            <span className="text-xs font-normal text-muted-foreground">
              (Shown to buyers for direct call / WhatsApp)
            </span>
          </label>
        </div>
        <div className="relative mt-1.5">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
            <Phone size={16} className="text-accent" />
          </div>
          <input
            id={phoneId}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210 (or +91 98765 43210)"
            maxLength={20}
            className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm font-medium outline-none focus:border-accent transition-colors"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Buyers can contact you via direct phone call or WhatsApp to finalize campus meetup and
          product inspection.
        </p>
      </div>
    </>
  )
}
