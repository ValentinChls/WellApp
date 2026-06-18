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
  // Position courante pour l'auto-play — source de vérité déterministe, mise à
  // jour aussi par le défilement manuel (onScroll). On n'avance PAS en relisant
  // scrollLeft (fragile pendant une animation), on incrémente cet index.
  const activeRef = useRef(0)
  const pausedUntil = useRef(0)
  // Fenêtre pendant laquelle un scroll est piloté par le code : onScroll ne doit
  // pas contrarier la pastille (sinon elle suit les positions intermédiaires de
  // l'animation au lieu de la tuile cible).
  const programmaticUntil = useRef(0)
  const pause = () => {
    pausedUntil.current = Date.now() + 9000
  }

  // Scroll fiable vers une tuile. Trois pièges contournés :
  //  1) cible EXACTE clampée au scroll max plutôt qu'offsetLeft brut — la
  //     dernière tuile (86% de large) ne peut pas s'aligner à gauche, sa cible
  //     est donc le scroll max (alignée à droite).
  //  2) `scroll-snap-type: mandatory` interrompt l'animation `smooth` → on coupe
  //     le snap pendant le scroll.
  //  3) on ne RÉACTIVE le snap qu'une fois ARRIVÉ à la cible. Réactivé à
  //     mi-course (minuterie aveugle), le snap mandatory re-snappe vers le point
  //     le plus proche — souvent EN ARRIÈRE — ce qui empêchait la tuile du
  //     milieu de s'accrocher. Filet : si `smooth` n'anime pas (webview), on
  //     force la position au bout de 1,2 s.
  const scrollToIndex = (i: number) => {
    const el = trackRef.current
    const child = el?.children[i] as HTMLElement | undefined
    if (!el || !child) return
    const maxScroll = el.scrollWidth - el.clientWidth
    const delta = child.getBoundingClientRect().left - el.getBoundingClientRect().left
    const target = Math.min(Math.max(el.scrollLeft + delta, 0), maxScroll)
    programmaticUntil.current = Date.now() + 1600
    el.style.scrollSnapType = 'none'
    el.scrollTo({ left: target, behavior: 'smooth' })
    const startTs = Date.now()
    const settle = () => {
      if (trackRef.current !== el) return
      const arrived = Math.abs(el.scrollLeft - target) < 4
      const timedOut = Date.now() - startTs > 1200
      if (arrived || timedOut) {
        if (!arrived) el.scrollTo({ left: target, behavior: 'auto' })
        el.style.scrollSnapType = '' // restaure le snap CSS, pile sur la cible
        return
      }
      window.setTimeout(settle, 50)
    }
    window.setTimeout(settle, 50)
  }

  // Défilement automatique : avance d'un index toutes les ~4,5 s, en boucle.
  // Pause ~9 s dès que l'utilisateur interagit, respecte « prefers-reduced-motion ».
  useEffect(() => {
    if (banners.length <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return
      const next = (activeRef.current + 1) % banners.length
      activeRef.current = next
      setActive(next)
      scrollToIndex(next)
    }, 4500)
    return () => window.clearInterval(id)
  }, [banners.length])

  if (banners.length === 0) return null

  // Pastille active sur défilement manuel = tuile dont le bord gauche est le
  // plus proche du défilement courant (robuste pour la dernière tuile, qui ne
  // peut jamais être centrée).
  function onScroll() {
    // Pendant un scroll piloté par le code, la pastille suit l'index cible (déjà
    // posé par l'auto-play / goTo) — on ignore les positions intermédiaires.
    if (Date.now() < programmaticUntil.current) return
    const el = trackRef.current
    if (!el) return
    const children = Array.from(el.children) as HTMLElement[]
    if (children.length === 0) return
    let best = 0
    let bestDist = Infinity
    children.forEach((c, i) => {
      const dist = Math.abs(c.offsetLeft - el.scrollLeft)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    activeRef.current = best
    setActive(best)
  }

  function goTo(i: number) {
    pause()
    activeRef.current = i
    setActive(i)
    scrollToIndex(i)
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
