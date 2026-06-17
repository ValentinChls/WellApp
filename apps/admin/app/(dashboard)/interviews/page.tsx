'use client'

import Link from 'next/link'
import { getInterviewTemplate } from '@wellpharma/shared'
import { api } from '@/lib/trpc/react'

export default function InterviewsInboxPage() {
  const list = api.health.interviews.listForPharmacy.useQuery()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Entretiens pharmaceutiques</h1>
        <p className="text-sm text-muted-foreground">
          Entretiens finalisés par les patients de votre officine. Le contenu n’est consultable
          qu’en ouvrant la fiche (accès tracé).
        </p>
      </div>

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : list.isError ? (
        <p className="text-sm text-destructive" role="alert">
          Impossible de charger les entretiens.
        </p>
      ) : (list.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun entretien finalisé pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {(list.data ?? []).map((i) => {
            const tpl = i.templateCode ? getInterviewTemplate(i.templateCode) : undefined
            return (
              <li key={i.id}>
                <Link
                  href={`/interviews/${i.id}`}
                  className="block rounded-lg border bg-background p-4 transition-colors hover:border-primary"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground">{tpl?.label ?? i.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {i.completedAt
                        ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(
                            i.completedAt,
                          )
                        : ''}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
