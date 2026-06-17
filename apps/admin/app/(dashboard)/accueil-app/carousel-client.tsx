'use client'

import { useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  GalleryHorizontalEnd,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { api } from '@/lib/trpc/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

const TARGET_W = 1200
const TARGET_H = 675

/** Recadrage « cover » centré vers le format requis → JPEG data URL. */
function cropToCover(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = TARGET_W
      canvas.height = TARGET_H
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('canvas'))
      const scale = Math.max(TARGET_W / img.width, TARGET_H / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, (TARGET_W - dw) / 2, (TARGET_H - dh) / 2, dw, dh)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image'))
    }
    img.src = url
  })
}

interface FormState {
  id?: string
  title: string
  subtitle: string
  linkUrl: string
  active: boolean
  imageDataUrl?: string // défini seulement si une nouvelle image est choisie
  preview?: string
}

const EMPTY: FormState = { title: '', subtitle: '', linkUrl: '', active: true }

export function CarouselClient() {
  const utils = api.useUtils()
  const list = api.home.adminList.useQuery()
  const banners = list.data ?? []

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [imgError, setImgError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const invalidate = () => utils.home.adminList.invalidate()
  const save = api.home.save.useMutation({
    onSuccess: () => {
      void invalidate()
      setOpen(false)
      setForm(EMPTY)
    },
  })
  const remove = api.home.remove.useMutation({ onSuccess: () => void invalidate() })
  const move = api.home.move.useMutation({ onSuccess: () => void invalidate() })

  function startCreate() {
    setForm(EMPTY)
    setImgError(null)
    setOpen(true)
  }
  function startEdit(b: (typeof banners)[number]) {
    setForm({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle ?? '',
      linkUrl: b.linkUrl ?? '',
      active: b.active,
      preview: b.imageDataUrl,
    })
    setImgError(null)
    setOpen(true)
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImgError('Veuillez choisir une image.')
      return
    }
    try {
      const dataUrl = await cropToCover(file)
      setForm((f) => ({ ...f, imageDataUrl: dataUrl, preview: dataUrl }))
      setImgError(null)
    } catch {
      setImgError('Image illisible. Réessayez avec un autre fichier.')
    }
  }

  function submit() {
    if (!form.title.trim()) {
      setImgError('Le titre est requis.')
      return
    }
    if (!form.id && !form.imageDataUrl) {
      setImgError('Une image est requise.')
      return
    }
    save.mutate({
      id: form.id,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      linkUrl: form.linkUrl.trim() || undefined,
      active: form.active,
      imageDataUrl: form.imageDataUrl,
    })
  }

  function toggleActive(b: (typeof banners)[number]) {
    save.mutate({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle ?? undefined,
      linkUrl: b.linkUrl ?? undefined,
      active: !b.active,
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Carrousel d’accueil</h1>
          <p className="text-sm text-muted-foreground">
            Pilotez les tuiles défilantes en haut de l’app patient. Format image{' '}
            <strong>{TARGET_W}×{TARGET_H}</strong> — recadrage automatique si l’image dépasse.
          </p>
        </div>
        {!open ? (
          <Button size="sm" onClick={startCreate}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter
          </Button>
        ) : null}
      </div>

      {open ? (
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {form.id ? 'Modifier la bannière' : 'Nouvelle bannière'}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Zone image */}
          <div>
            <label className="text-sm font-medium text-foreground">Image</label>
            <div className="mt-1">
              {form.preview ? (
                <div className="relative overflow-hidden rounded-lg border" style={{ aspectRatio: '16 / 9' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.preview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-md bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow"
                  >
                    <ImagePlus className="h-3.5 w-3.5" /> Remplacer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground hover:bg-secondary"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm">Choisir une image ({TARGET_W}×{TARGET_H})</span>
                  <span className="text-xs">Recadrage automatique « cover »</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickFile}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Titre</label>
            <input
              value={form.title}
              maxLength={80}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex. : Faire équipe pour votre santé"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Sous-titre (facultatif)</label>
            <input
              value={form.subtitle}
              maxLength={160}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="Texte d’accompagnement"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Lien (facultatif)</label>
            <input
              value={form.linkUrl}
              maxLength={500}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              placeholder="/prevention ou https://…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4"
            />
            Visible dans l’app
          </label>

          {imgError ? <p className="text-sm text-destructive">{imgError}</p> : null}
          {save.isError ? <p className="text-sm text-destructive">Enregistrement échoué. Réessayez.</p> : null}

          <div className="flex gap-2">
            <Button size="sm" disabled={save.isPending} onClick={submit}>
              <Check className="mr-1 h-4 w-4" /> {save.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Liste */}
      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : banners.length === 0 ? (
        <EmptyState
          icon={GalleryHorizontalEnd}
          title="Aucune bannière"
          hint="Ajoutez une première tuile : elle apparaîtra en haut de l’accueil de l’app patient."
        />
      ) : (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <Card key={b.id} className="flex items-center gap-4 p-3">
              <div className="relative w-28 shrink-0 overflow-hidden rounded-md border" style={{ aspectRatio: '16 / 9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageDataUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{b.title}</p>
                {b.subtitle ? <p className="truncate text-xs text-muted-foreground">{b.subtitle}</p> : null}
                <span
                  className={
                    b.active
                      ? 'mt-1 inline-block rounded-full bg-wellpharma-green/10 px-2 py-0.5 text-xs font-medium text-wellpharma-green'
                      : 'mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                  }
                >
                  {b.active ? 'Visible' : 'Masquée'}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={i === 0 || move.isPending}
                  onClick={() => move.mutate({ id: b.id, direction: 'up' })}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                  aria-label="Monter"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={i === banners.length - 1 || move.isPending}
                  onClick={() => move.mutate({ id: b.id, direction: 'down' })}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                  aria-label="Descendre"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(b)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                  aria-label={b.active ? 'Masquer' : 'Afficher'}
                >
                  {b.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(b)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                  aria-label="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ id: b.id })}
                  className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
