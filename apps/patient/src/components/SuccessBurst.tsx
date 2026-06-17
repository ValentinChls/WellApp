import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ShieldCheck, Syringe } from 'lucide-react'
import { Confetti } from './Confetti'

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 16 }

/** Célébration plein écran (confettis + anneaux + icône animée + message).
 *  `icon="shield"` joue un morphing seringue → bouclier (jalons vaccination). */
export function SuccessBurst({
  title,
  subtitle,
  onClose,
  icon = 'check',
}: {
  title: string
  subtitle?: string
  onClose: () => void
  icon?: 'check' | 'shield'
}) {
  const [morphed, setMorphed] = useState(icon !== 'shield')
  useEffect(() => {
    if (icon !== 'shield') return
    const t = setTimeout(() => setMorphed(true), 520)
    return () => clearTimeout(t)
  }, [icon])

  return (
    <motion.div
      className="success-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-label={title}
    >
      <Confetti count={48} />
      <motion.div
        className="success-card"
        initial={{ scale: 0.85, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="success-check"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...SPRING, damping: 16, delay: 0.1 }}
        >
          <span className="success-ring" aria-hidden="true" />
          <span className="success-ring success-ring-2" aria-hidden="true" />
          {icon === 'shield' ? (
            <AnimatePresence mode="wait" initial={false}>
              {!morphed ? (
                <motion.span
                  key="syringe"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.3, opacity: 0, rotate: 40 }}
                  transition={SPRING}
                  style={{ display: 'inline-flex' }}
                >
                  <Syringe size={32} aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="shield"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={SPRING}
                  style={{ display: 'inline-flex' }}
                >
                  <ShieldCheck size={36} aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          ) : (
            <Check size={34} aria-hidden="true" />
          )}
        </motion.div>
        <h2>{title}</h2>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
        <button className="btn" onClick={onClose}>
          Continuer
        </button>
      </motion.div>
    </motion.div>
  )
}
