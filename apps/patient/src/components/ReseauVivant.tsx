import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, Syringe, Stethoscope, ScanLine } from 'lucide-react'
import { DEMO_PHARMACIES } from '@wellpharma/shared'
import { CountUp } from './CountUp'

/**
 * « Le Réseau qui bat » — constellation des officines Wellpharma sur le
 * territoire. Chaque point = une officine (vraies coordonnées géocodées) ;
 * une onde lumineuse traverse la France de gauche à droite (la coopérative
 * qui respire). Agrégats réseau [ENGAGEMENT, comptes seulement, RGPD-safe].
 */

// Cadre métropole + correction de la longitude au cos(lat moyen ≈ 46°).
const LNG_K = 0.695
const LNG_MIN = -5.2 * LNG_K
const LNG_MAX = 9.6 * LNG_K
const LAT_MIN = 41.3
const LAT_MAX = 51.1

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng * LNG_K - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
}

// Agrégats hebdomadaires du réseau (démo, comptes seulement — non sensibles).
const NETWORK = { officines: 450, connected: DEMO_PHARMACIES.length, vaccinations: 3218, entretiens: 1047, depistages: 612 }

export function ReseauVivant() {
  const reduce = useReducedMotion()
  const points = useMemo(
    () =>
      DEMO_PHARMACIES.map((p, i) => {
        const { x, y } = project(p.latitude, p.longitude)
        return { id: p.cip || String(i), x, y, delay: (x / 100) * 1.8 }
      }),
    [],
  )

  return (
    <div className="reseau-card">
      <div className="reseau-head">
        <span className="reseau-kicker">
          <Activity size={15} aria-hidden="true" /> Le réseau Wellpharma en direct
        </span>
        <h3>
          <CountUp value={NETWORK.connected} /> officines connectées
          <span className="reseau-sub"> · coopérative de {NETWORK.officines}</span>
        </h3>
      </div>

      <div className="reseau-map" role="img" aria-label="Carte du réseau des officines Wellpharma en France">
        {!reduce ? <span className="reseau-scan" aria-hidden="true" /> : null}
        {points.map((pt) => (
          <span
            key={pt.id}
            className="reseau-dot"
            style={{
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              animationDelay: reduce ? undefined : `${pt.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="reseau-stats">
        <motion.div className="reseau-stat" initial={reduce ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Syringe size={16} aria-hidden="true" />
          <strong><CountUp value={NETWORK.vaccinations} /></strong>
          <span>vaccinations</span>
        </motion.div>
        <motion.div className="reseau-stat" initial={reduce ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
          <Stethoscope size={16} aria-hidden="true" />
          <strong><CountUp value={NETWORK.entretiens} /></strong>
          <span>entretiens</span>
        </motion.div>
        <motion.div className="reseau-stat" initial={reduce ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}>
          <ScanLine size={16} aria-hidden="true" />
          <strong><CountUp value={NETWORK.depistages} /></strong>
          <span>dépistages</span>
        </motion.div>
      </div>
      <p className="reseau-foot">Cette semaine dans le réseau · données agrégées</p>
    </div>
  )
}
