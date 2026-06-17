import { type ReactNode, useEffect, useState } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'

const PEEK = 184

/** Feuille glissante (façon app native) à 2 positions : repliée (peek) / déployée. */
export function BottomSheet({ children }: { children: ReactNode }) {
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800))
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const sheetHeight = Math.round(vh * 0.84)
  const closedY = Math.max(0, sheetHeight - PEEK)
  const y = useMotionValue(closedY)
  const [expanded, setExpanded] = useState(false)

  const snap = (open: boolean) =>
    animate(y, open ? 0 : closedY, { type: 'spring', stiffness: 340, damping: 34 })

  // Toggle (poignée) + recalage sur redimensionnement.
  useEffect(() => {
    snap(expanded)
  }, [expanded, closedY])

  return (
    <motion.section
      className="sheet"
      style={{ height: sheetHeight, y }}
      drag="y"
      dragConstraints={{ top: 0, bottom: closedY }}
      dragElastic={0.05}
      onDragEnd={(_, info) => {
        const open = info.velocity.y < -250 || (info.velocity.y <= 250 && y.get() < closedY / 2)
        setExpanded(open)
        snap(open)
      }}
    >
      <button
        type="button"
        className="sheet-handle"
        onClick={() => setExpanded((e) => !e)}
        aria-label={expanded ? 'Réduire la liste' : 'Déployer la liste'}
      >
        <span />
      </button>
      <div className="sheet-body">{children}</div>
    </motion.section>
  )
}
