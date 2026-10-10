'use client'

import React from 'react'

export interface AdminTableProps {
  headers: React.ReactNode
  children: React.ReactNode
}

export function AdminTable({ headers, children }: AdminTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-muted/50 font-bold uppercase text-muted-foreground">
          <tr>{headers}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}
