'use client'

import { Search } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
}

/** Barre de liste réutilisable : recherche + filtre optionnel (filtrage client). */
export function ListToolbar({
  query,
  onQuery,
  placeholder = 'Rechercher…',
  filterValue,
  filterOptions,
  onFilter,
  children,
}: {
  query: string
  onQuery: (v: string) => void
  placeholder?: string
  filterValue?: string
  filterOptions?: FilterOption[]
  onFilter?: (v: string) => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
        />
      </div>
      {filterOptions && filterOptions.length > 0 ? (
        <select
          value={filterValue}
          onChange={(e) => onFilter?.(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm text-foreground"
        >
          {filterOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : null}
      {children}
    </div>
  )
}
