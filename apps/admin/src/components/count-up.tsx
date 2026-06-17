'use client'

import { useEffect, useRef, useState } from 'react'

/** Compteur animé (ease-out) jusqu'à `value`, format FR. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const origin = from.current
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      setN(Math.round(origin + (value - origin) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <>{n.toLocaleString('fr-FR')}</>
}
