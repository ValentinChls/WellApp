'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ShieldCheck, Paperclip } from 'lucide-react'
import { adviceStatusLabel } from '@wellpharma/shared'
import { cn } from '@wellpharma/ui/cn'
import { api } from '@/lib/trpc/react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/** Formate une date au format français long avec l'heure. */
function formatDateTimeFr(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

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
 * Détail d'une demande de conseil — SEUL endroit où le contenu santé déchiffré
 * est affiché (page authentifiée, accès tracé côté serveur via AuditLog).
 */
export default function AdviceDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const utils = api.useUtils()
  const detail = api.health.adviceRequests.get.useQuery(
    { id },
    { enabled: Boolean(id) },
  )

  const setStatus = api.health.adviceRequests.setStatus.useMutation({
    onSuccess: async () => {
      // Rafraîchit le détail et l'inbox pour refléter le nouveau statut.
      await Promise.all([
        utils.health.adviceRequests.get.invalidate({ id }),
        utils.health.adviceRequests.listForPharmacy.invalidate(),
      ])
    },
  })

  const isMutating = setStatus.isPending
  const currentStatus = detail.data?.status

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/advice"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour aux demandes
        </Link>
      </div>

      {detail.isLoading && (
        <Card className="h-64 animate-pulse bg-muted/40" aria-hidden="true" />
      )}

      {detail.isError && !detail.isLoading && (
        <Card className="p-6">
          <p className="text-sm text-destructive">
            Cette demande est introuvable ou son accès n’est pas autorisé.
          </p>
        </Card>
      )}

      {detail.data && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg text-foreground">
                  {detail.data.subject}
                </CardTitle>
                <CardDescription>
                  Reçue le {formatDateTimeFr(detail.data.createdAt)}
                </CardDescription>
              </div>
              <StatusBadge status={detail.data.status} />
            </CardHeader>

            <CardContent className="space-y-4">
              <section aria-labelledby="advice-content-heading" className="space-y-2">
                <h2
                  id="advice-content-heading"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Contenu de la demande
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {detail.data.body}
                </p>
              </section>

              {detail.data.attachmentPath && (
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4" aria-hidden="true" />
                  Pièce jointe associée à la demande.
                </p>
              )}

              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Accès tracé (journal d’audit).
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isMutating || currentStatus === 'IN_PROGRESS'}
              onClick={() => setStatus.mutate({ id, status: 'IN_PROGRESS' })}
            >
              Marquer comme lue
            </Button>
            <Button
              type="button"
              disabled={isMutating || currentStatus === 'ANSWERED'}
              onClick={() => setStatus.mutate({ id, status: 'ANSWERED' })}
            >
              Marquer comme traitée
            </Button>
          </div>

          {setStatus.isError && (
            <p className="text-sm text-destructive" role="alert">
              La mise à jour du statut a échoué. Merci de réessayer.
            </p>
          )}
        </>
      )}
    </div>
  )
}
