'use client'

import { Store } from 'lucide-react'
import { api } from '@/lib/trpc/react'
import { Card, CardContent } from '@/components/ui/card'

export default function PharmaciesPage() {
  const list = api.kpi.scopePharmacies.useQuery()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">Pharmacies</h1>
        <p className="text-sm text-muted-foreground">
          Officines du groupement{list.data ? ` · ${list.data.length}` : ''}.
        </p>
      </div>

      {list.isLoading ? (
        <Card className="h-24 animate-pulse bg-muted/40" />
      ) : !list.data || list.data.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Aucune pharmacie.</p>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.map((p) => (
            <li key={p.id}>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Store className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.city ?? '—'}</p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Astuce : filtrez le tableau de bord par pharmacie pour les indicateurs détaillés.
      </p>
    </div>
  )
}
