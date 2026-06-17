'use client'

import Link from 'next/link'
import { Inbox, ChevronRight } from 'lucide-react'
import { adviceStatusLabel } from '@wellpharma/shared'
import { cn } from '@wellpharma/ui/cn'
import { api } from '@/lib/trpc/react'
import { Card } from '@/components/ui/card'

/** Formate une date au format français (jour mois année). */
function formatDateFr(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Pastille de statut. Les couleurs s'appuient sur les tokens de la charte
 * (primaire pour « traitée », accent neutre sinon) afin de rester lisible en
 * mode clair comme sombre.
 */
function StatusBadge({ status }: { status: string }) {
  const isAnswered = status === 'ANSWERED'
  const isRead = status === 'IN_PROGRESS'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        isAnswered && 'bg-primary/10 text-primary',
        isRead && 'bg-accent/15 text-accent-foreground',
        !isAnswered && !isRead && 'bg-muted text-muted-foreground',
      )}
    >
      {adviceStatusLabel(status)}
    </span>
  )
}

/**
 * Inbox des demandes de conseil de l'officine du staff connecté.
 * Les métadonnées seules transitent ici ; le contenu santé n'est jamais
 * affiché en liste (réservé à la page détail authentifiée).
 */
export default function AdviceInboxPage() {
  const { data, isLoading, isError } =
    api.health.adviceRequests.listForPharmacy.useQuery()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Demandes de conseil
        </h1>
        <p className="text-sm text-muted-foreground">
          Demandes adressées à l’officine par les patients affiliés.
        </p>
      </div>

      {isLoading && (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="h-20 animate-pulse bg-muted/40" />
            </li>
          ))}
        </ul>
      )}

      {isError && !isLoading && (
        <Card className="p-6">
          <p className="text-sm text-destructive">
            Le chargement des demandes a échoué. Merci de réessayer.
          </p>
        </Card>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <Inbox className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-foreground">
            Aucune demande pour le moment
          </p>
          <p className="text-sm text-muted-foreground">
            Les nouvelles demandes de conseil apparaîtront ici.
          </p>
        </Card>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((request) => (
            <li key={request.id}>
              <Link
                href={`/advice/${request.id}`}
                className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="flex items-center justify-between gap-4 p-4 transition-colors group-hover:bg-accent/5">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {request.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reçue le {formatDateFr(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={request.status} />
                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
