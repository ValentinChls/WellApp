'use client'

import { useMemo, useState } from 'react'
import { Activity, X } from 'lucide-react'
import { DEMO_PHARMACIES } from '@wellpharma/shared'
import { api } from '@/lib/trpc/react'

/**
 * Carte « Réseau Wellpharma » (pilotage groupement) : constellation des
 * officines aux vraies coordonnées géocodées, onde lumineuse + pulsation.
 * Chaque officine est cliquable → drill-down sur son activité missions réelle.
 */
const LNG_K = 0.695
const LNG_MIN = -5.2 * LNG_K
const LNG_MAX = 9.6 * LNG_K
const LAT_MIN = 41.3
const LAT_MAX = 51.1
const clamp = (n: number) => Math.max(0, Math.min(100, n))

export function ReseauMap({ networkSize = 450 }: { networkSize?: number }) {
  const [selected, setSelected] = useState<string | null>(null)
  const stats = api.missions.networkStats.useQuery(undefined, { staleTime: 60_000 })

  const points = useMemo(
    () =>
      DEMO_PHARMACIES.map((p, i) => ({
        id: p.cip || String(i),
        cip: p.cip,
        name: p.name,
        city: p.city,
        title: `${p.name} · ${p.city}`,
        x: clamp(((p.longitude * LNG_K - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100),
        y: clamp(((LAT_MAX - p.latitude) / (LAT_MAX - LAT_MIN)) * 100),
      })),
    [],
  )

  const activityByCip = useMemo(() => {
    const m = new Map<string, { total: number; validees: number; completion: number }>()
    for (const a of stats.data?.activity ?? []) {
      if (a.cip) m.set(a.cip, { total: a.total, validees: a.validees, completion: a.completion })
    }
    return m
  }, [stats.data])

  const sel = points.find((p) => p.id === selected) ?? null
  const selActivity = sel ? activityByCip.get(sel.cip) : undefined

  return (
    <div className="overflow-hidden rounded-lg border bg-[#1d243f] p-5 text-white shadow-sm">
      <style>{`@keyframes wpSweep{0%{transform:translateX(-110%)}100%{transform:translateX(360%)}}`}</style>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#37bac9]">
        <Activity className="h-4 w-4" /> Réseau Wellpharma en direct
      </div>
      <h3 className="mt-1 font-display text-lg font-bold">
        {points.length} officines connectées
        <span className="font-normal text-white/60"> · coopérative de {networkSize}</span>
      </h3>

      <div className="relative mx-auto mt-4 w-full max-w-md" style={{ aspectRatio: '21 / 20' }}>
        <div
          className="absolute inset-y-0 left-0 w-1/3 mix-blend-screen"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(55,186,201,0.25), transparent)',
            animation: 'wpSweep 5s linear infinite',
          }}
        />
        {points.map((pt) => {
          const isSel = pt.id === selected
          const hasActivity = activityByCip.has(pt.cip)
          return (
            <button
              key={pt.id}
              type="button"
              title={pt.title}
              aria-label={`Officine ${pt.title}`}
              onClick={() => setSelected(isSel ? null : pt.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-150 focus:outline-none focus:ring-2 focus:ring-white/70"
              style={{
                left: `${pt.x}%`,
                top: `${pt.y}%`,
                height: isSel ? 13 : 7,
                width: isSel ? 13 : 7,
                background: hasActivity ? '#7ee0ec' : '#37bac9',
                boxShadow: isSel
                  ? '0 0 0 4px rgba(126,224,236,0.35), 0 0 12px rgba(126,224,236,0.9)'
                  : '0 0 8px rgba(55,186,201,0.7)',
                animation: isSel ? 'none' : undefined,
              }}
            />
          )
        })}
      </div>

      {sel ? (
        <div className="mt-3 flex items-start gap-3 rounded-lg bg-white/10 p-3 backdrop-blur">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{sel.name}</p>
            <p className="truncate text-xs text-white/55">{sel.city}</p>
            {selActivity ? (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="text-white/70">{selActivity.total} proposées</span>
                <span className="font-semibold text-[#7ee0ec]">{selActivity.validees} validées</span>
                <span className="text-white/70">{selActivity.completion}% complétion</span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-white/50">Aucune mission encore proposée.</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Fermer"
            className="shrink-0 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="mt-3 text-center text-xs text-white/45">
          Positions réelles · cliquez une officine pour son activité
        </p>
      )}
    </div>
  )
}
