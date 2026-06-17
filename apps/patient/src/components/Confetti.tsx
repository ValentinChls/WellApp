import { motion } from 'framer-motion'

const COLORS = ['#009dc5', '#37bac9', '#2bad70', '#e8902b', '#7c6cdb']

/** Pluie de confettis (décorative). À placer dans un conteneur `position: relative`. */
export function Confetti({ count = 40 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="confetti">
      {Array.from({ length: count }, (_, i) => {
        const left = Math.round(Math.random() * 100)
        const delay = Math.random() * 0.3
        const dur = 0.9 + Math.random() * 0.8
        return (
          <motion.span
            key={i}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: 340, x: (Math.random() - 0.5) * 80, opacity: 0, rotate: Math.random() * 420 }}
            transition={{ duration: dur, delay, ease: 'easeIn' }}
            style={{ left: `${left}%`, background: COLORS[i % COLORS.length] }}
          />
        )
      })}
    </div>
  )
}
