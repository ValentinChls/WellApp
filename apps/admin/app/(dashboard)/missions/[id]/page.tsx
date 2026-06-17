'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Check, Printer } from 'lucide-react'
import { getMissionTemplate } from '@wellpharma/shared'
import { api } from '@/lib/trpc/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function formatAnswer(v: unknown): string {
  if (v === true) return 'Oui'
  if (v === false) return 'Non'
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  if (v === '' || v === null || v === undefined) return '—'
  return String(v)
}

export default function MissionValidatePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const utils = api.useUtils()
  const [note, setNote] = useState('')

  const q = api.missions.assignment.useQuery({ id }, { enabled: Boolean(id) })
  const validate = api.missions.validate.useMutation({
    onSuccess: () => {
      void utils.missions.inbox.invalidate()
      router.push('/missions')
    },
  })

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>
  if (q.isError || !q.data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Mission introuvable ou accès refusé.</p>
        <Link href="/missions" className="text-sm text-primary">‹ Retour</Link>
      </div>
    )
  }

  const a = q.data
  const template = getMissionTemplate(a.missionCode)
  const inputSteps = (template?.steps ?? []).filter((s) => s.kind !== 'info' && s.kind !== 'consent')
  const alreadyValidated = a.signedOff || a.state === 'VALIDEE' || a.state === 'FACTUREE'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/missions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> File de missions
      </Link>

      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {template?.shortTitle ?? a.missionCode}
        </h1>
        <p className="text-sm text-muted-foreground">
          {a.patientName}
          {a.completedAt ? ` · complétée le ${new Date(a.completedAt).toLocaleDateString('fr-FR')}` : ''}
        </p>
      </div>

      {a.attentionPoints.length > 0 ? (
        <Card className="border-destructive/30 bg-destructive/5 p-4">
          <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" /> Points d’attention
          </p>
          <ul className="space-y-1 text-sm text-foreground">
            {a.attentionPoints.map((p, i) => (
              <li key={i}>• {p}</li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="bg-wellpharma-green/5 p-4">
          <p className="text-sm text-wellpharma-green">Aucun point d’attention détecté.</p>
        </Card>
      )}

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Réponses du patient</p>
        <dl className="space-y-3">
          {inputSteps.map((s) => (
            <div key={s.id} className="border-b pb-3 last:border-0 last:pb-0">
              <dt className="text-sm text-muted-foreground">{s.prompt}</dt>
              <dd className="text-sm font-medium text-foreground">{formatAnswer(a.answers[s.id])}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {alreadyValidated ? (
        <Card className="space-y-4 p-5">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-wellpharma-green">
            <Check className="h-4 w-4" /> Acte validé
          </p>
          {a.note ? <p className="text-sm text-muted-foreground">Note : {a.note}</p> : null}

          {/* Bordereau Ameli (pré-rempli) */}
          <div className="rounded-lg border bg-secondary/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bordereau de facturation Ameli
            </p>
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Acte</dt>
              <dd className="text-right font-medium text-foreground">{template?.shortTitle ?? a.missionCode}</dd>
              <dt className="text-muted-foreground">Patient</dt>
              <dd className="text-right font-medium text-foreground">{a.patientName}</dd>
              <dt className="text-muted-foreground">Date</dt>
              <dd className="text-right font-medium text-foreground">
                {a.validatedAt ? new Date(a.validatedAt).toLocaleDateString('fr-FR') : '—'}
              </dd>
              <dt className="text-muted-foreground">Forfait</dt>
              <dd className="text-right font-semibold text-wellpharma-green">
                {template?.remuneration ? `${template.remuneration.amountEur}€` : '—'}
              </dd>
            </dl>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Imprimer le bordereau
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="space-y-3 p-5">
          <label className="text-sm font-medium text-foreground" htmlFor="note">
            Note (facultatif)
          </label>
          <textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Observation, conseil donné, suite à prévoir…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {validate.isError ? (
            <p className="text-sm text-destructive">La validation a échoué. Réessayez.</p>
          ) : null}
          <Button
            className="w-full"
            disabled={validate.isPending}
            onClick={() => validate.mutate({ id, note: note || undefined })}
          >
            <Check className="mr-1.5 h-4 w-4" />
            {validate.isPending ? 'Validation…' : 'Valider l’acte'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            La validation trace l’accès et prépare la facturation Ameli.
          </p>
        </Card>
      )}
    </div>
  )
}
