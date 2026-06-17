import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/**
 * Compteur animé (ease-out) de 0 jusqu'à `value`, déclenché quand l'élément
 * entre dans le viewport. Format FR (séparateur de milliers). Respecte
 * prefers-reduced-motion (affiche directement la valeur finale).
 */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (reduce) {
      setN(value)
      return
    }
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduce, inView])

  return <span ref={ref}>{n.toLocaleString('fr-FR')}</span>
}
