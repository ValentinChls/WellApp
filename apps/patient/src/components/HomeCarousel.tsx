import { useRef, useState } from 'react'
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
      <div className="home-carousel-track" ref={trackRef} onScroll={onScroll}>
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
