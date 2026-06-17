'use client'

import { useState } from 'react'
import { Megaphone, Send, X } from 'lucide-react'
import { cn } from '@wellpharma/ui/cn'
import { api } from '@/lib/trpc/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type StaffRole = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE'
type Channel = 'WEB_PUSH' | 'EXPO_PUSH'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  SCHEDULED: 'Programmée',
  SENT: 'Envoyée',
  CANCELLED: 'Annulée',
}
const CHANNEL_LABEL: Record<Channel, string> = { WEB_PUSH: 'Web', EXPO_PUSH: 'App' }

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'SENT' && 'bg-primary/10 text-primary',
        status === 'DRAFT' && 'bg-accent/15 text-accent-foreground',
        status === 'SCHEDULED' && 'bg-accent/15 text-accent-foreground',
        status === 'CANCELLED' && 'bg-muted text-muted-foreground',
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export function CampaignsClient({ role }: { role: StaffRole }) {
  const isGroupement = role === 'SUPER_ADMIN_GROUPEMENT'
  const utils = api.useUtils()
  const list = api.campaigns.list.useQuery()
  const pharmacies = api.kpi.scopePharmacies.useQuery(undefined, { enabled: isGroupement })

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [channels, setChannels] = useState<Channel[]>(['WEB_PUSH'])
  const [pharmacyId, setPharmacyId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const invalidate = () => utils.campaigns.list.invalidate()
  const create = api.campaigns.create.useMutation({
    onSuccess: () => {
      setTitle('')
      setBody('')
      setChannels(['WEB_PUSH'])
      setError(null)
      void invalidate()
    },
    onError: (e) => setError(e.message),
  })
  const send = api.campaigns.send.useMutation({ onSuccess: invalidate })
  const cancel = api.campaigns.cancel.useMutation({ onSuccess: invalidate })

  const toggleChannel = (c: Channel) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const submit = () => {
    if (!title.trim() || !body.trim() || channels.length === 0) return
    create.mutate({
      title: title.trim(),
      body: body.trim(),
      channels,
      pharmacyId: isGroupement ? (pharmacyId || null) : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">Campagnes</h1>
        <p className="text-sm text-muted-foreground">
          Notifications génériques (jamais de contenu santé) envoyées aux patients ayant consenti.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle campagne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Titre"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Message (générique, non-santé)"
            rows={3}
            maxLength={500}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-4">
            {(['WEB_PUSH', 'EXPO_PUSH'] as Channel[]).map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={channels.includes(c)}
                  onChange={() => toggleChannel(c)}
                />
                {CHANNEL_LABEL[c]}
              </label>
            ))}
            {isGroupement ? (
              <select
                className="rounded-md border bg-background px-3 py-1.5 text-sm"
                value={pharmacyId}
                onChange={(e) => setPharmacyId(e.target.value)}
              >
                <option value="">Tout le groupement</option>
                {pharmacies.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : null}
            <Button
              onClick={submit}
              disabled={create.isPending || !title.trim() || !body.trim() || channels.length === 0}
            >
              Créer le brouillon
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {list.isLoading ? (
        <Card className="h-24 animate-pulse bg-muted/40" />
      ) : !list.data || list.data.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Megaphone className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-foreground">Aucune campagne</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.data.map((c) => (
            <li key={c.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.channels.map((ch) => CHANNEL_LABEL[ch as Channel] ?? ch).join(' · ')}
                    {c.pharmacyId ? '' : ' · Groupement'}
                  </p>
                </div>
                {c.status === 'DRAFT' || c.status === 'SCHEDULED' ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => send.mutate({ id: c.id })}
                      disabled={send.isPending}
                    >
                      <Send className="mr-1 h-3.5 w-3.5" /> Envoyer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancel.mutate({ id: c.id })}
                      disabled={cancel.isPending}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Annuler
                    </Button>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
