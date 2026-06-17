'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@wellpharma/ui/cn'
import { Card } from '@/components/ui/card'
import { CountUp } from '../count-up'

/**
 * Carte KPI premium : pastille d'icône teintée, valeur animée, barre d'accent,
 * tendance optionnelle (uniquement si une vraie variation est fournie).
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent = '#009dc5',
  hint,
  trend,
  delay = 0,
}: {
  label: string
  value: number
  icon: LucideIcon
  accent?: string
  hint?: string
  trend?: number | null
  delay?: number
}) {
  const up = (trend ?? 0) >= 0
  return (
    <Card
      className="relative overflow-hidden p-5 transition-shadow duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${delay}ms`, animationDuration: '500ms', animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
        {typeof trend === 'number' ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              up ? 'bg-wellpharma-green/10 text-wellpharma-green' : 'bg-destructive/10 text-destructive',
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums text-foreground">
        <CountUp value={value} />
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      <span className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: accent }} />
    </Card>
  )
}
