'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  MessageSquare,
} from 'lucide-react'
import { api } from '@/lib/trpc/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RetryState } from '@/components/ui/retry-state'
import { DashboardClient } from './dashboard-client'

function todayLabel(): string {
  const s = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function timeLabel(d: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}
function agoLabel(d: Date | string): string {
  const h = Math.round((Date.now() - new Date(d).getTime()) / 3_600_000)
  if (h < 1) return "à l'instant"
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.round(h / 24)} j`
}

function ActionRow({
  icon,
  tint,
  color,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode
  tint: string
  color: string
  title: string
  subtitle: string
  action: React.ReactNode
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: tint, color }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </Card>
  )
}

export function CockpitClient() {
  const utils = api.useUtils()
  const q = api.cockpit.today.useQuery(undefined, { staleTime: 30_000 })
  const relanceBatch = api.missions.relanceBatch.useMutation({
    onSuccess: () => void utils.cockpit.today.invalidate(),
  })
  const d = q.data
  const [showStats, setShowStats] = useState(false)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">Mon comptoir</h1>
        <p className="text-sm text-muted-foreground">{todayLabel()}</p>
      </div>

      {q.isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="h-20 animate-pulse bg-muted/40" />
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <Card key={i} className="h-16 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : q.isError || !d ? (
        <RetryState message="Impossible de charger votre comptoir." onRetry={() => void q.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="relative overflow-hidden p-4">
              <span className="absolute inset-x-0 bottom-0 h-1 bg-primary" />
              <p className="font-display text-3xl font-bold tabular-nums text-foreground">{d.counts.aTraiter}</p>
              <p className="text-sm text-muted-foreground">À traiter</p>
            </Card>
            <Card className="relative overflow-hidden p-4">
              <span className="absolute inset-x-0 bottom-0 h-1 bg-wellpharma-green" />
              <p className="font-display text-3xl font-bold tabular-nums text-wellpharma-green">{d.caAmeliToday} €</p>
              <p className="text-sm text-muted-foreground">CA Ameli aujourd’hui</p>
            </Card>
            <Card className="relative overflow-hidden p-4">
              <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" />
              <p className="font-display text-3xl font-bold tabular-nums text-foreground">{d.rdv.count}</p>
              <p className="text-sm text-muted-foreground">RDV du jour</p>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-base font-semibold text-foreground">À traiter maintenant</h2>

            {d.counts.aTraiter === 0 ? (
              <Card className="flex flex-col items-center gap-3 p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-wellpharma-green" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Tout est traité. Beau travail.</p>
                  <p className="text-sm text-muted-foreground">
                    Profitez-en pour proposer une mission à un patient éligible.
                  </p>
                </div>
                <Link href="/missions">
                  <Button size="sm" variant="outline">
                    Proposer une mission <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {d.missions.count > 0 ? (
                  <ActionRow
                    icon={<ClipboardCheck className="h-5 w-5" />}
                    tint="rgba(0,157,197,0.12)"
                    color="#0c447c"
                    title={`${d.missions.count} mission${d.missions.count > 1 ? 's' : ''} à valider · ${d.missions.caPending} € en attente`}
                    subtitle={
                      d.missions.sample
                        ? `${d.missions.sample.patientName} · ${d.missions.sample.title}${d.missions.sample.attentionCount > 0 ? ` — ${d.missions.sample.attentionCount} point${d.missions.sample.attentionCount > 1 ? 's' : ''} d’attention` : ''}`
                        : 'Réponses pré-remplies, validez en 2 minutes'
                    }
                    action={
                      <Link href="/missions">
                        <Button size="sm">
                          Valider <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    }
                  />
                ) : null}

                {d.conseils.count > 0 ? (
                  <ActionRow
                    icon={<MessageSquare className="h-5 w-5" />}
                    tint="rgba(211,83,126,0.12)"
                    color="#993556"
                    title={`${d.conseils.count} demande${d.conseils.count > 1 ? 's' : ''} de conseil nouvelle${d.conseils.count > 1 ? 's' : ''}`}
                    subtitle={
                      d.conseils.sample ? `« ${d.conseils.sample.subject} » · ${agoLabel(d.conseils.sample.at)}` : 'À traiter'
                    }
                    action={
                      <Link href="/advice">
                        <Button size="sm" variant="outline">
                          Répondre <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    }
                  />
                ) : null}

                {d.relances.count > 0 ? (
                  <ActionRow
                    icon={<BellRing className="h-5 w-5" />}
                    tint="rgba(186,117,23,0.14)"
                    color="#854f0b"
                    title={`${d.relances.count} patient${d.relances.count > 1 ? 's' : ''} en attente depuis +5 jours`}
                    subtitle="Relance douce groupée, un seul geste"
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={relanceBatch.isPending}
                        onClick={() => relanceBatch.mutate({ ids: d.relances.ids })}
                      >
                        <BellRing className="mr-1 h-4 w-4" />
                        {relanceBatch.isPending ? 'Envoi…' : 'Tout relancer'}
                      </Button>
                    }
                  />
                ) : null}

                {d.rdv.count > 0 ? (
                  <ActionRow
                    icon={<CalendarClock className="h-5 w-5" />}
                    tint="rgba(43,173,112,0.12)"
                    color="#0f6e56"
                    title={d.rdv.nextAt ? `Prochain RDV à ${timeLabel(d.rdv.nextAt)}` : `${d.rdv.count} RDV aujourd’hui`}
                    subtitle={`${d.rdv.count} rendez-vous confirmé${d.rdv.count > 1 ? 's' : ''} aujourd’hui`}
                    action={
                      <Link href="/pharmacie">
                        <Button size="sm" variant="ghost">
                          Agenda
                        </Button>
                      </Link>
                    }
                  />
                ) : null}

                {relanceBatch.isSuccess && relanceBatch.data ? (
                  <p className="text-xs font-medium text-wellpharma-green">
                    {relanceBatch.data.relanced} relance{relanceBatch.data.relanced > 1 ? 's' : ''} envoyée
                    {relanceBatch.data.relanced > 1 ? 's' : ''} ✓
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </>
      )}

      <details
        className="rounded-lg border bg-card"
        onToggle={(e) => setShowStats((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-foreground">
          Statistiques détaillées
        </summary>
        <div className="border-t p-4">
          {showStats ? <DashboardClient role="ADMIN_PHARMACIE" /> : null}
        </div>
      </details>
    </div>
  )
}
