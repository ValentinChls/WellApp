'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  BellRing,
  Check,
  ChevronRight,
  ClipboardList,
  Plus,
  Power,
  SlidersHorizontal,
} from 'lucide-react'
import type { MissionConfig } from '@wellpharma/shared'
import { cn } from '@wellpharma/ui/cn'
import { api } from '@/lib/trpc/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

type StaffRole = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE'

const STATE_LABELS: Record<string, string> = {
  PROPOSEE: 'Proposée',
  OUVERTE: 'À démarrer',
  EN_COURS: 'En cours',
  COMPLETEE: 'À valider',
  A_VALIDER: 'À valider',
  VALIDEE: 'Validée',
  FACTUREE: 'Facturée',
}

const CHANNELS: { value: string; label: string }[] = [
  { value: 'PUSH', label: 'Notification (push)' },
  { value: 'SMS', label: 'SMS' },
  { value: 'QR', label: 'QR comptoir' },
  { value: 'TABLET', label: 'Tablette officine' },
]

// Éditeur no-code de personnalisation d'une mission (groupement) : message
// patient, cadence de relance, canal par défaut — stockés dans la config,
// sans toucher au code. Pilote la proposition et la relance côté officine.
function MissionConfigEditor({
  code,
  active,
  config,
}: {
  code: string
  active: boolean
  config: MissionConfig | null
}) {
  const utils = api.useUtils()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(config?.patientMessage ?? '')
  const [relanceDays, setRelanceDays] = useState(config?.relanceDays != null ? String(config.relanceDays) : '')
  const [channel, setChannel] = useState(config?.channel ?? 'PUSH')
  const save = api.missions.setActivation.useMutation({
    onSuccess: () => utils.missions.catalog.invalidate(),
  })
  const isCustom = Boolean(config?.patientMessage || config?.relanceDays != null || config?.channel)

  return (
    <div className="mt-3 border-t pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Personnaliser
        {isCustom ? <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">personnalisée</span> : null}
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground">Message au patient</label>
            <textarea
              rows={2}
              maxLength={280}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex. : Votre pharmacien vous propose un point sur votre traitement…"
              className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            />
            <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{message.length}/280</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs font-medium text-foreground">Relance après (jours)</label>
              <input
                type="number"
                min={0}
                max={90}
                value={relanceDays}
                onChange={(e) => setRelanceDays(e.target.value)}
                placeholder="7"
                className="mt-1 w-24 rounded-md border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Canal par défaut</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-1 block rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              disabled={save.isPending}
              onClick={() =>
                save.mutate({
                  missionCode: code,
                  active,
                  config: {
                    patientMessage: message.trim() || undefined,
                    relanceDays: relanceDays === '' ? undefined : Number(relanceDays),
                    channel: (channel as 'PUSH' | 'SMS' | 'QR' | 'TABLET') || undefined,
                  },
                })
              }
            >
              <Check className="mr-1 h-4 w-4" />
              Enregistrer
            </Button>
            {save.isSuccess ? <span className="text-xs font-medium text-wellpharma-green">Enregistré ✓</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ───────────────────────── Groupement : catalogue & activation
function Catalogue() {
  const utils = api.useUtils()
  const cat = api.missions.catalog.useQuery()
  const toggle = api.missions.setActivation.useMutation({
    onSuccess: () => utils.missions.catalog.invalidate(),
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">Catalogue de missions</h1>
        <p className="text-sm text-muted-foreground">
          Activez les missions à pousser sur le réseau. Le pharmacien les propose, le patient les complète.
        </p>
      </div>

      {cat.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cat.data?.map((m) => (
            <Card key={m.code} className="relative overflow-hidden p-5">
              <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: m.accent }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-semibold text-foreground">{m.shortTitle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ~{m.estimatedMin} min · {m.recurrence}
                    {m.remuneration ? ` · ${m.remuneration.amountEur}€` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate({ missionCode: m.code, active: !m.active })}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    m.active
                      ? 'bg-wellpharma-green/10 text-wellpharma-green'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Power className="h-3.5 w-3.5" />
                  {m.active ? 'Active' : 'Inactive'}
                </button>
              </div>
              <p className="mt-3 text-sm text-foreground">{m.title}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.eligibility.map((e) => (
                  <span key={e} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {e}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{m.assignmentCount} proposées</span>
                <span>· {m.completees} à valider</span>
                <span className="font-semibold text-wellpharma-green">· {m.validees} validées</span>
                {m.caEur > 0 ? (
                  <span className="ml-auto rounded-full bg-wellpharma-green/10 px-2 py-0.5 font-semibold text-wellpharma-green">
                    {m.caEur}€ CA Ameli
                  </span>
                ) : null}
              </div>
              <MissionConfigEditor code={m.code} active={m.active} config={m.config} />
            </Card>
          ))}
        </div>
      )}

      <Benchmark />
    </div>
  )
}

// Benchmark officines (groupement) — classement par missions validées.
function Benchmark() {
  const stats = api.missions.networkStats.useQuery()
  const ranking = stats.data?.ranking ?? []
  if (ranking.length === 0) return null
  const max = Math.max(1, ...ranking.map((r) => r.validees))
  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">Officines les plus actives</p>
      <div className="space-y-2.5">
        {ranking.map((r, i) => (
          <div key={r.pharmacyId} className="flex items-center gap-3">
            <span className="w-5 text-sm font-semibold text-muted-foreground">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-foreground">{r.name}</span>
                <span className="ml-2 shrink-0 font-medium text-muted-foreground">
                  {r.validees} validées · {r.completion}%
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(r.validees / max) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

type EligRow = { id: string; name: string; age: number | null; reasons: string[] }

// Liste cochable de patients (un groupe : éligibles OU candidats LGO).
function PickList({
  title,
  hint,
  rows,
  tone,
  selected,
  onToggle,
  onToggleAll,
}: {
  title: string
  hint?: string
  rows: EligRow[]
  tone: 'green' | 'amber'
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[]) => void
}) {
  if (rows.length === 0) return null
  const ids = rows.map((r) => r.id)
  const allIn = ids.every((id) => selected.has(id))
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title} · {rows.length}
        </p>
        <button
          type="button"
          onClick={() => onToggleAll(ids)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {allIn ? 'Tout décocher' : 'Tout sélectionner'}
        </button>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="space-y-1.5">
        {rows.map((r) => {
          const checked = selected.has(r.id)
          // L'âge est déjà rendu en badge → on ne le répète pas en « raison ».
          const reasons = r.reasons.filter((x) => x !== `${r.age} ans`)
          return (
            <label
              key={r.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors',
                checked ? 'border-primary/40 bg-primary/5' : 'bg-card hover:bg-secondary',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(r.id)}
                className="h-4 w-4 accent-[var(--wellpharma-primary,#009dc5)]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                {reasons.length > 0 ? (
                  <p className="truncate text-xs text-muted-foreground">{reasons.join(' · ')}</p>
                ) : null}
              </div>
              {r.age !== null ? (
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {r.age} ans
                </span>
              ) : null}
              {tone === 'amber' ? (
                <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                  Traitement à confirmer
                </span>
              ) : null}
            </label>
          )
        })}
      </div>
    </div>
  )
}

// Proposer une mission par ciblage : choisir la mission → moteur d'éligibilité
// (âge/sexe) → proposer en lot. Ferme la boucle côté officine.
function ProposeMission() {
  const utils = api.useUtils()
  const missions = api.missions.activeForPharmacy.useQuery()
  const [code, setCode] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const eligible = api.missions.eligible.useQuery({ missionCode: code }, { enabled: Boolean(code) })
  const proposeBatch = api.missions.proposeBatch.useMutation({
    onSuccess: () => {
      void utils.missions.inbox.invalidate()
      void utils.missions.eligible.invalidate({ missionCode: code })
      setSelected(new Set())
    },
  })

  const elig = eligible.data?.eligible ?? []
  const lgo = eligible.data?.needsLgo ?? []
  const excluded = eligible.data?.excluded ?? 0

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleAll(ids: string[]) {
    setSelected((prev) => {
      const next = new Set(prev)
      const allIn = ids.every((id) => next.has(id))
      ids.forEach((id) => (allIn ? next.delete(id) : next.add(id)))
      return next
    })
  }

  const hasMissions = (missions.data?.length ?? 0) > 0

  return (
    <Card className="space-y-4 p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">Proposer une mission</p>
        <p className="text-xs text-muted-foreground">
          Choisissez une mission : le moteur cible automatiquement vos patients éligibles.
        </p>
      </div>

      <select
        value={code}
        onChange={(e) => {
          setCode(e.target.value)
          setSelected(new Set())
        }}
        className="w-full max-w-sm rounded-md border bg-background px-3 py-1.5 text-sm text-foreground"
      >
        <option value="">Choisir une mission…</option>
        {missions.data?.map((m) => (
          <option key={m.code} value={m.code}>
            {m.shortTitle}
            {m.remuneration ? ` · ${m.remuneration}€` : ''}
          </option>
        ))}
      </select>

      {!hasMissions ? (
        <p className="text-xs text-muted-foreground">
          Aucune mission active. Demandez au groupement d’en activer dans le catalogue.
        </p>
      ) : null}

      {code ? (
        eligible.isLoading ? (
          <p className="text-sm text-muted-foreground">Analyse de la patientèle…</p>
        ) : elig.length === 0 && lgo.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun patient à cibler{excluded > 0 ? ` (${excluded} hors critères)` : ''}.
          </p>
        ) : (
          <div className="space-y-4">
            <PickList
              title="Éligibles"
              tone="green"
              rows={elig}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
            />
            <PickList
              title="Candidats à confirmer (LGO)"
              hint="Critère d’âge rempli ; le traitement reste à confirmer dans le dossier patient (id.)."
              tone="amber"
              rows={lgo}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
            />
            {excluded > 0 ? (
              <p className="text-xs text-muted-foreground">{excluded} patient(s) hors critères d’âge.</p>
            ) : null}
            <div className="flex items-center gap-3 border-t pt-3">
              <Button
                size="sm"
                disabled={selected.size === 0 || proposeBatch.isPending}
                onClick={() =>
                  proposeBatch.mutate({ patientIds: [...selected], missionCode: code })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Proposer à {selected.size} patient{selected.size > 1 ? 's' : ''}
              </Button>
              {proposeBatch.isSuccess && proposeBatch.data ? (
                <p className="text-xs font-medium text-wellpharma-green">
                  {proposeBatch.data.created} mission(s) proposée(s) ✓
                </p>
              ) : null}
            </div>
          </div>
        )
      ) : null}
    </Card>
  )
}

// ───────────────────────── Pharmacien : file de missions
function Inbox() {
  const utils = api.useUtils()
  const inbox = api.missions.inbox.useQuery({})
  const relance = api.missions.relance.useMutation({ onSuccess: () => utils.missions.inbox.invalidate() })
  const relanceBatch = api.missions.relanceBatch.useMutation({ onSuccess: () => utils.missions.inbox.invalidate() })
  const items = inbox.data?.items ?? []
  const counts = inbox.data?.counts ?? { aValider: 0, enCours: 0, validees: 0 }

  const aValider = items.filter((i) => i.state === 'COMPLETEE' || i.state === 'A_VALIDER')
  const enCours = items.filter((i) => i.state === 'PROPOSEE' || i.state === 'EN_COURS')
  const validees = items.filter((i) => i.state === 'VALIDEE' || i.state === 'FACTUREE')

  function Row({ i }: { i: (typeof items)[number] }) {
    const canRelance = i.state === 'PROPOSEE' || i.state === 'EN_COURS'
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/missions/${i.id}`}
          className="flex flex-1 items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-secondary"
        >
          <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: i.accent }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {i.patientName} · {i.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {STATE_LABELS[i.state] ?? i.state}
              {i.remuneration ? ` · ${i.remuneration}€` : ''}
            </p>
          </div>
          {i.attentionCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
              <AlertTriangle className="h-3 w-3" />
              {i.attentionCount}
            </span>
          ) : null}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
        {canRelance ? (
          <Button
            variant="outline"
            size="sm"
            disabled={relance.isPending}
            onClick={() => relance.mutate({ id: i.id })}
          >
            <BellRing className="mr-1 h-3.5 w-3.5" /> Relancer
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">Missions</h1>
        <p className="text-sm text-muted-foreground">
          Vos patients pré-remplissent ; vous validez en 2 minutes.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { k: 'aValider', label: 'À valider', v: counts.aValider, accent: '#009dc5' },
          { k: 'enCours', label: 'En cours', v: counts.enCours, accent: '#37bac9' },
          { k: 'validees', label: 'Validées', v: counts.validees, accent: '#2bad70' },
        ].map((c) => (
          <Card key={c.k} className="relative overflow-hidden p-4">
            <span className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: c.accent }} />
            <p className="font-display text-3xl font-bold tabular-nums text-foreground">{c.v}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </Card>
        ))}
      </div>

      <ProposeMission />

      {inbox.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune mission pour le moment"
          hint="Proposez une mission à un patient ci-dessus — elle apparaîtra ici dès qu’il l’aura complétée."
        />
      ) : (
        <div className="space-y-6">
          {aValider.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">À valider</h2>
              {aValider.map((i) => (
                <Row key={i.id} i={i} />
              ))}
            </section>
          ) : null}
          {enCours.length > 0 ? (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">En cours</h2>
                {enCours.length > 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={relanceBatch.isPending}
                    onClick={() => relanceBatch.mutate({ ids: enCours.map((i) => i.id) })}
                  >
                    <BellRing className="mr-1 h-3.5 w-3.5" />
                    {relanceBatch.isPending ? 'Envoi…' : `Relancer les ${enCours.length}`}
                  </Button>
                ) : null}
              </div>
              {enCours.map((i) => (
                <Row key={i.id} i={i} />
              ))}
            </section>
          ) : null}
          {validees.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Validées</h2>
              {validees.map((i) => (
                <Row key={i.id} i={i} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function MissionsClient({ role }: { role: StaffRole }) {
  return role === 'SUPER_ADMIN_GROUPEMENT' ? <Catalogue /> : <Inbox />
}
