'use client'

import React from 'react'

export interface TabItem<T extends string = string> {
  id: T
  label: string
}

export interface TabNavigationProps<T extends string = string> {
  tabs: TabItem<T>[]
  activeTab: T
  onSelect: (id: T) => void
  className?: string
}

export function TabNavigation<T extends string = string>({
  tabs,
  activeTab,
  onSelect,
  className = '',
}: TabNavigationProps<T>) {
  return (
    <div className={`flex gap-2 border-b border-border pb-3 text-sm font-semibold overflow-x-auto ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={`rounded-xl px-4 py-2 transition whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground font-bold shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
