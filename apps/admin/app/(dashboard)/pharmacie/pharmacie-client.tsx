'use client'

import { useState } from 'react'
import { CalendarPlus, Power, Tag, Trash2 } from 'lucide-react'
import { api } from '@/lib/trpc/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type StaffRole = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE'

const DEFAULT_HOURS = [9, 10, 11, 14, 15, 16]

function AppointmentTypes() {
  const utils = api.useUtils()
  const list = api.appointmentTypes.list.useQuery(undefined)
  const invalidate = () => utils.appointmentTypes.list.invalidate()

  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [duration, setDuration] = useState(20)
  const [error, setError] = useState<string | null>(null)

  const create = api.appointmentTypes.create.useMutation({
    onSuccess: () => {
      setCode('')
      setLabel('')
      setError(null)
      void invalidate()
    },
    onError: (e) => setError(e.message),
  })
  const toggle = api.appointmentTypes.toggle.useMutation({ onSuccess: invalidate })
  const generate = api.appointmentTypes.generateSlots.useMutation({ onSuccess: invalidate })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Types de rendez-vous</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <input
            className="w-32 rounded-md border bg-background px-3 py-2 text-sm uppercase"
            placeholder="CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <input
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Libellé (ex. Vaccination grippe)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="w-20 rounded-md border bg-background px-3 py-2 text-sm"
            type="number"
            min={5}
            max={180}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            aria-label="Durée (min)"
          />
          <Button
            onClick={() => create.mutate({ code, label, durationMin: duration })}
            disabled={create.isPending || code.length < 2 || !label.trim()}
          >
            Ajouter
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {list.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !list.data || list.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun type d’acte configuré.</p>
        ) : (
          <ul className="space-y-2">
            {list.data.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t.label}{' '}
                    <span className="text-xs text-muted-foreground">({t.code})</span>
                    {!t.active ? (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        inactif
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.durationMin} min · {t.freeSlots} créneau{t.freeSlots > 1 ? 'x' : ''} libre
                    {t.freeSlots > 1 ? 's' : ''} à venir
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      generate.mutate({ appointmentTypeId: t.id, days: 7, hours: DEFAULT_HOURS })
                    }
                    disabled={generate.isPending}
                    title="Générer des créneaux pour les 7 prochains jours"
                  >
                    <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Créneaux 7j
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggle.mutate({ id: t.id })}
                    disabled={toggle.isPending}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function Promotions() {
  const utils = api.useUtils()
  const list = api.promotions.list.useQuery()
  const invalidate = () => utils.promotions.list.invalidate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const create = api.promotions.create.useMutation({
    onSuccess: () => {
      setTitle('')
      setDescription('')
      void invalidate()
    },
  })
  const toggle = api.promotions.toggle.useMutation({ onSuccess: invalidate })
  const remove = api.promotions.remove.useMutation({ onSuccess: invalidate })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Promotions &amp; offres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <input
            className="w-48 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Titre de l’offre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button
            onClick={() =>
              create.mutate({ title: title.trim(), description: description.trim() || undefined })
            }
            disabled={create.isPending || !title.trim()}
          >
            Ajouter
          </Button>
        </div>

        {list.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !list.data || list.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune promotion.</p>
        ) : (
          <ul className="space-y-2">
            {list.data.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {p.title}
                      {!p.isActive ? (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          inactive
                        </span>
                      ) : null}
                    </p>
                    {p.description ? (
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggle.mutate({ id: p.id })}
                    disabled={toggle.isPending}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove.mutate({ id: p.id })}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function PharmacieClient({ role }: { role: StaffRole }) {
  if (role === 'SUPER_ADMIN_GROUPEMENT') {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Ma pharmacie</h1>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            En tant qu’administrateur groupement, gérez les actes et offres par officine depuis la
            section <span className="font-medium text-foreground">Pharmacies</span>.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">Ma pharmacie</h1>
        <p className="text-sm text-muted-foreground">
          Configuration des rendez-vous et des offres de votre officine.
        </p>
      </div>
      <AppointmentTypes />
      <Promotions />
    </div>
  )
}
