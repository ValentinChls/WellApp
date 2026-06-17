import { motion, useReducedMotion } from 'framer-motion'
import { Check, ShieldCheck } from 'lucide-react'

export interface PreventionItem {
  id: string
  label: string
  done: boolean
  hint?: string
}

/**
 * « Bouclier de prévention » — anneau radial premium qui se remplit selon
 * l'état de prévention du patient (vaccins / entretien / dépistages ciblés).
 * Couleur #009dc5 → vert #2bad70 à mesure que la protection grandit.
 * [ENGAGEMENT, déclaratif] — aucun contenu santé sensible affiché.
 */
export function BouclierPrevention({ items }: { items: PreventionItem[] }) {
  const reduce = useReducedMotion()
  const done = items.filter((i) => i.done).length
  const ratio = items.length ? done / items.length : 0
  const pct = Math.round(ratio * 100)

  const R = 56
  const CIRC = 2 * Math.PI * R
  const color = ratio >= 1 ? '#2bad70' : ratio >= 0.5 ? '#0bb3b0' : 'var(--wp-primary, #009dc5)'

  return (
    <div className="shield-card">
      <div className="shield-ring" role="img" aria-label={`Prévention à jour à ${pct}%`}>
        <svg viewBox="0 0 140 140" width="140" height="140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(20,30,60,0.08)" strokeWidth="12" />
          <motion.circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            transform="rotate(-90 70 70)"
            initial={{ strokeDashoffset: reduce ? CIRC * (1 - ratio) : CIRC }}
            animate={{ strokeDashoffset: CIRC * (1 - ratio) }}
            transition={{ type: 'spring', stiffness: 60, damping: 16, delay: 0.15 }}
          />
        </svg>
        <div className="shield-center">
          <ShieldCheck size={22} aria-hidden="true" style={{ color }} />
          <motion.span
            className="shield-pct"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ color }}
          >
            {pct}%
          </motion.span>
          <span className="shield-sub">à jour</span>
        </div>
      </div>

      <div className="shield-items">
        <div className="shield-title">Mon bouclier de prévention</div>
        <ul>
          {items.map((it, i) => (
            <motion.li
              key={it.id}
              className={it.done ? 'is-done' : ''}
              initial={reduce ? false : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
            >
              <span className={`shield-pip${it.done ? ' is-done' : ''}`}>
                {it.done ? <Check size={13} aria-hidden="true" /> : null}
              </span>
              <span className="grow">{it.label}</span>
              <span className="shield-state">{it.done ? 'À jour' : 'À faire'}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}
