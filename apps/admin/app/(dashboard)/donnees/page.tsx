'use client'

import { api } from '@/lib/trpc/react'
import { cn } from '@wellpharma/ui/cn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const INTENT_LABEL: Record<string, string> = {
  horaires: 'Horaires',
  services: 'Services',
  adresse: 'Adresse / accès',
  contact: 'Contact',
  autre: 'Autre',
}

function formatDateTimeFr(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export default function DonneesPage() {
  const logs = api.kpi.recentChatLogs.useQuery({ limit: 50 })
  const marronnier = api.marronnier.count.useQuery()
  const reseed = api.marronnier.reseed.useMutation({ onSuccess: () => void marronnier.refetch() })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">Données &amp; conformité</h1>
        <p className="text-sm text-muted-foreground">
          Audit, calendrier de prévention et règles de protection des données.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendrier marronnier</CardTitle>
            <CardDescription>
              {marronnier.data ? `${marronnier.data.events} événements en base.` : 'Chargement…'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              (Ré)applique le jeu canonique de campagnes de prévention (upsert par identifiant).
            </p>
            <Button onClick={() => reseed.mutate()} disabled={reseed.isPending}>
              {reseed.isPending ? 'Import…' : 'Réimporter le marronnier'}
            </Button>
            {reseed.data ? (
              <p className="text-sm text-primary">{reseed.data.upserted} événements importés.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Protection des données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Domaines séparés : engagement (standard) / santé (chiffré, HDS-ready).</p>
            <p>Le journal chatbot ne conserve que des métadonnées, jamais le texte.</p>
            <p className="text-xs">
              À venir : purge planifiée des journaux (art. 5.1.e) et export RGPD par patient.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit de l’assistant (50 derniers)</CardTitle>
          <CardDescription>Métadonnées uniquement — aucun contenu de message.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : !logs.data || logs.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun échange enregistré.</p>
          ) : (
            <ul className="divide-y">
              {logs.data.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-muted-foreground">{formatDateTimeFr(l.createdAt)}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-foreground">
                      {l.redirected ? 'Question santé' : (INTENT_LABEL[l.intent ?? 'autre'] ?? l.intent)}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        l.redirected
                          ? 'bg-accent/15 text-accent-foreground'
                          : 'bg-primary/10 text-primary',
                      )}
                    >
                      {l.redirected ? 'redirigé' : 'répondu'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
