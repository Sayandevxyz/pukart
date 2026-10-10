'use client'

import React, { useState } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

export interface SelectOptionGroup {
  label: string
  options: string[]
}

export interface SearchableSelectProps {
  label: string
  icon: React.ElementType
  value: string
  onChange: (val: string) => void
  placeholder: string
  groups?: SelectOptionGroup[]
  flatOptions?: string[]
  required?: boolean
}

function SelectOptionButton({
  opt,
  isSelected,
  onSelect,
}: {
  opt: string
  isSelected: boolean
  onSelect: (opt: string) => void
}) {
  return (
    <button
      type="button"
      key={opt}
      onClick={() => onSelect(opt)}
      className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-accent/10 ${
        isSelected ? 'bg-accent/15 font-semibold text-accent' : 'text-foreground'
      }`}
    >
      {isSelected && <Check size={12} />}
      <span className={isSelected ? '' : 'pl-5'}>{opt}</span>
    </button>
  )
}

function renderOptions(
  options: string[],
  current: string,
  onSelect: (opt: string) => void
) {
  return options.map((opt) => (
    <SelectOptionButton
      key={opt}
      opt={opt}
      isSelected={current === opt}
      onSelect={onSelect}
    />
  ))
}

export function SearchableSelect({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  groups,
  flatOptions,
  required,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const allOpts = flatOptions || groups?.flatMap((g) => g.options) || []
  const filtered = search
    ? allOpts.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : allOpts

  const filteredGroups = groups
    ? groups
        .map((g) => ({
          ...g,
          options: g.options.filter((o) =>
            o.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((g) => g.options.length > 0)
    : null

  const handleSelect = (opt: string) => {
    onChange(opt)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="relative">
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
        <Icon size={13} className="text-accent" />
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-1.5 flex h-11 w-full items-center justify-between rounded-xl border border-border bg-background px-3 text-xs outline-none transition hover:border-accent focus:border-accent"
      >
        <span className={value ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close dropdown"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search size={13} className="text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="max-h-52 overflow-y-auto">
              {filteredGroups
                ? filteredGroups.map((group) => (
                    <div key={group.label}>
                      <div className="sticky top-0 bg-card/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent backdrop-blur-sm">
                        {group.label}
                      </div>
                      {group.options.map((opt) => (
                        <SelectOptionButton
                          key={opt}
                          opt={opt}
                          isSelected={value === opt}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  ))
                : renderOptions(filtered, value, handleSelect)}

              {filtered.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No results found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
