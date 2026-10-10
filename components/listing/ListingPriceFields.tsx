'use client'

import React from 'react'

export interface ListingPriceFieldsProps {
  idPrefix: string
  price: string
  setPrice: (val: string) => void
  originalPrice: string
  setOriginalPrice: (val: string) => void
}

export function ListingPriceFields({
  idPrefix,
  price,
  setPrice,
  originalPrice,
  setOriginalPrice,
}: ListingPriceFieldsProps) {
  const priceId = `${idPrefix}-price`
  const origPriceId = `${idPrefix}-original-price`

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label
          htmlFor={priceId}
          className="block text-xs font-bold uppercase tracking-wider text-foreground"
        >
          Price (₹ INR)
        </label>
        <input
          id={priceId}
          required
          type="number"
          min="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-bold outline-none focus:border-accent"
        />
      </div>

      <div>
        <label
          htmlFor={origPriceId}
          className="block text-xs font-bold uppercase tracking-wider text-foreground"
        >
          Original Retail Price (₹)
        </label>
        <input
          id={origPriceId}
          type="number"
          min="1"
          value={originalPrice}
          onChange={(e) => setOriginalPrice(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none focus:border-accent"
        />
      </div>
    </div>
  )
}
