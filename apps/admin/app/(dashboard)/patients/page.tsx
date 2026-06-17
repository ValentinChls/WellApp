'use client'

import { useEffect, useState } from 'react'
import { Users, X } from 'lucide-react'
import { cn } from '@wellpharma/ui/cn'
import { api } from '@/lib/trpc/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CONSENT_LABEL: Record<string, string> = {
  HEALTH_DATA: 'Données de santé',
  MARKETING: 'Marketing',
  PUSH_NOTIFICATIONS: 'Notifications',
  DATA_SHARING_PHARMACY: 'Partage pharmacie',
}
const SEX_LABEL: Record<string, string> = {
  MALE: 'Homme',
  FEMALE: 'Femme',
  UNDISCLOSED: 'Non précisé',
}

function formatDateFr(value: Date | string | null): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d)
}

function PatientDetail({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const { data, isLoading } = api.patients.get.useQuery({ patientId })
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle className="text-base">
          {isLoading || !data ? 'Patient' : `${data.patient.firstName} ${data.patient.lastName}`}
        </CardTitle>
        <button onClick={onClose} aria-label="Fermer" className="text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isLoading || !data ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Né(e) le</span>
              <span className="text-foreground">{formatDateFr(data.patient.birthDate)}</span>
              <span>Sexe</span>
              <span className="text-foreground">
                {data.patient.sex ? (SEX_LABEL[data.patient.sex] ?? data.patient.sex) : '—'}
              </span>
              <span>Téléphone</span>
              <span className="text-foreground">{data.patient.phone ?? '—'}</span>
            </div>
            <div>
              <p className="mb-1 font-medium text-foreground">Consentements</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(CONSENT_LABEL).map((type) => {
                  const granted = data.consents[type] === true
                  return (
                    <span
                      key={type}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        granted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {CONSENT_LABEL[type]} : {granted ? 'oui' : 'non'}
                    </span>
                  )
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.affiliations.length} affiliation{data.affiliations.length > 1 ? 's' : ''} dans
              votre périmètre · santé non affichée ici (voir Demandes / Entretiens).
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function PatientsPage() {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  // Pré-remplissage depuis la palette de commandes (/patients?q=Nom).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('q')
    if (param) setQ(param)
  }, [])
  const list = api.patients.list.useQuery(q.trim() ? { q: q.trim() } : undefined)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">Patients</h1>
        <p className="text-sm text-muted-foreground">
          Patients affiliés à votre périmètre. Identité et consentements uniquement — aucune donnée
          de santé.
        </p>
      </div>

      <input
        className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
        placeholder="Rechercher par nom…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          {list.isLoading ? (
            <Card className="h-24 animate-pulse bg-muted/40" />
          ) : !list.data || list.data.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Users className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium text-foreground">Aucun patient</p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {list.data.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      'w-full rounded-md border p-3 text-left transition-colors hover:bg-accent/5',
                      selected === p.id && 'border-primary',
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {p.firstName} {p.lastName}
                      {p.isReference ? (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          référence
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Né(e) le {formatDateFr(p.birthDate)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>{selected ? <PatientDetail patientId={selected} onClose={() => setSelected(null)} /> : null}</div>
      </div>
    </div>
  )
}
