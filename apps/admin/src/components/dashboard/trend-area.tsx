'use client'

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function fmtDay(iso: string): string {
  const [, m, d] = iso.split('-')
  return d && m ? `${d}/${m}` : iso
}

/** Courbe d'activité (aire) sur la période — données `timeline` du KPI. */
export function TrendArea({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="wpArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#009dc5" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#009dc5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={fmtDay}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            labelFormatter={(l) => fmtDay(String(l))}
            formatter={(v) => [Number(v), 'Interactions']}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e2e8ec',
              fontSize: 12,
              boxShadow: '0 8px 24px rgba(20,30,60,0.12)',
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#009dc5"
            strokeWidth={2.5}
            fill="url(#wpArea)"
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
