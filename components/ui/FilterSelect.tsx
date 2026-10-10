'use client'

import React from 'react'

export interface FilterSelectOption {
  value: string
  label: string
}

export interface FilterSelectProps {
  id: string
  label: string
  value: string
  onChange: (val: string) => void
  options: FilterSelectOption[]
  vertical?: boolean
}

export function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  vertical = false,
}: FilterSelectProps) {
  return (
    <div className={vertical ? '' : 'flex items-center gap-1.5'}>
      <label
        htmlFor={id}
        className={
          vertical
            ? 'block text-xs font-bold uppercase tracking-wider text-foreground'
            : 'text-xs font-medium text-muted-foreground'
        }
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          vertical
            ? 'mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-accent'
            : 'h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none shadow-sm'
        }
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
