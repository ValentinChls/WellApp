'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#009dc5', '#37bac9', '#2bad70', '#f39655', '#fbc682', '#afca0b']
const color = (i: number) => COLORS[i % COLORS.length] ?? '#009dc5'

/** Donut SVG (Recharts) + légende, pour une répartition par statut/catégorie. */
export function StatusDonut({ data }: { data: Array<{ label: string; count: number }> }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Aucune donnée sur la période.</p>
  }
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              stroke="none"
              animationDuration={800}
            >
              {data.map((d, i) => (
                <Cell key={d.label} fill={color(i)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8ec', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">total</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color(i) }} />
            <span className="text-foreground">{d.label}</span>
            <span className="ml-3 font-semibold tabular-nums text-muted-foreground">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
