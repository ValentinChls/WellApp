import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HomeBanner } from '../data/homeService'

/**
 * Carrousel d'accueil défilant (scroll-snap horizontal). Contenu piloté par le
 * groupement (image recadrée + textes). Tuiles tappables si un lien est défini.
 */
export function HomeCarousel({ banners }: { banners: HomeBanner[] }) {
  const navigate = useNavigate()
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const pausedUntil = useRef(0)
  const pause = () => {
    pausedUntil.current = Date.now() + 9000
  }

  // Défilement automatique : avance d'une bannière toutes les ~4,5 s, en boucle.
  // Se met en pause ~9 s dès que l'utilisateur interagit, et respecte
  // « prefers-reduced-motion ».
  useEffect(() => {
    if (banners.length <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return
      const el = trackRef.current
      if (!el) return
      const children = Array.from(el.children) as HTMLElement[]
      if (children.length === 0) return
      let cur = 0
      let best = Infinity
      children.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft - el.scrollLeft)
        if (d < best) {
          best = d
          cur = i
        }
      })
      const next = children[(cur + 1) % children.length]
      if (next) el.scrollTo({ left: next.offsetLeft, behavior: 'smooth' })
    }, 4500)
    return () => window.clearInterval(id)
  }, [banners.length])

  if (banners.length === 0) return null

  function onScroll() {
    const el = trackRef.current
    if (!el) return
    const children = Array.from(el.children) as HTMLElement[]
    if (children.length === 0) return
    // Tuile active = celle dont le bord gauche est le plus proche du défilement
    // (scroll-snap-align: start). Robuste pour la DERNIÈRE tuile, qui ne peut
    // jamais être centrée — la détection par « centre » la ratait (le point
    // actif restait bloqué sur l'avant-dernière).
    let best = 0
    let bestDist = Infinity
    children.forEach((c, i) => {
      const dist = Math.abs(c.offsetLeft - el.scrollLeft)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    setActive(best)
  }

  function goTo(i: number) {
    pause()
    const el = trackRef.current
    const child = el?.children[i] as HTMLElement | undefined
    if (el && child) el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
  }

  function open(b: HomeBanner) {
    if (!b.linkUrl) return
    if (b.linkUrl.startsWith('/')) navigate(b.linkUrl)
    else window.open(b.linkUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="home-carousel">
      <div
        className="home-carousel-track"
        ref={trackRef}
        onScroll={onScroll}
        onPointerDown={pause}
        onTouchStart={pause}
      >
        {banners.map((b) => (
          <button
            key={b.id}
            type="button"
            className="home-tile"
            onClick={() => open(b)}
            style={{ cursor: b.linkUrl ? 'pointer' : 'default' }}
            aria-label={b.title}
          >
            <img src={b.imageDataUrl} alt="" className="home-tile-img" loading="lazy" />
            <span className="home-tile-overlay" aria-hidden="true" />
            <span className="home-tile-text">
              <span className="home-tile-title">{b.title}</span>
              {b.subtitle ? <span className="home-tile-sub">{b.subtitle}</span> : null}
            </span>
          </button>
        ))}
      </div>
      {banners.length > 1 ? (
        <div className="home-dots">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Aller à la bannière ${i + 1}`}
              aria-current={i === active ? 'true' : undefined}
              className={`home-dot${i === active ? ' on' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
