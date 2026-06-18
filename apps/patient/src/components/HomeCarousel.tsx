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
  // Index de la tuile courante = source de vérité = position RÉELLE du scroll
  // (lue directement, pas via l'événement `scroll` qui ne part pas toujours sur
  // un défilement programmé). Tenu à jour par syncActive().
  const activeRef = useRef(0)
  const pausedUntil = useRef(0)
  const pause = () => {
    pausedUntil.current = Date.now() + 9000
  }

  // Index de la tuile dont le bord gauche est le plus proche du défilement
  // courant (robuste pour la dernière tuile, end-aligned, jamais centrable).
  const indexFromScroll = () => {
    const el = trackRef.current
    if (!el) return 0
    const children = Array.from(el.children) as HTMLElement[]
    let best = 0
    let bestDist = Infinity
    children.forEach((c, i) => {
      const dist = Math.abs(c.offsetLeft - el.scrollLeft)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    return best
  }

  // Aligne la pastille sur la position réelle de la diapo. Appelé en continu
  // (onScroll + boucle d'animation + montage) → la pastille SUIT toujours la
  // diapo, jamais en avance ni en retard.
  const syncActive = () => {
    const i = indexFromScroll()
    activeRef.current = i
    setActive(i)
  }

  // Scroll fiable vers une tuile. Pièges contournés :
  //  1) cible EXACTE clampée au scroll max plutôt qu'offsetLeft brut — la
  //     dernière tuile (86% de large) ne peut pas s'aligner à gauche, sa cible
  //     est donc le scroll max (alignée à droite).
  //  2) `scroll-snap-type: mandatory` interrompt l'animation `smooth` → on coupe
  //     le snap pendant le scroll, et on ne le RÉACTIVE qu'une fois ARRIVÉ à la
  //     cible (réactivé à mi-course, il re-snappe vers le point le plus proche —
  //     souvent en arrière — ce qui bloquait la tuile du milieu).
  //  3) on synchronise la pastille à CHAQUE pas (la position réelle), donc elle
  //     suit l'animation sans dépendre de l'événement `scroll`. Filet : si
  //     `smooth` n'anime pas (webview), on force la position au bout de 1,2 s.
  const scrollToIndex = (i: number) => {
    const el = trackRef.current
    const child = el?.children[i] as HTMLElement | undefined
    if (!el || !child) return
    const maxScroll = el.scrollWidth - el.clientWidth
    const delta = child.getBoundingClientRect().left - el.getBoundingClientRect().left
    const target = Math.min(Math.max(el.scrollLeft + delta, 0), maxScroll)
    el.style.scrollSnapType = 'none'
    el.scrollTo({ left: target, behavior: 'smooth' })
    const startTs = Date.now()
    const settle = () => {
      if (trackRef.current !== el) return
      syncActive() // la pastille suit la position réelle pendant l'animation
      const arrived = Math.abs(el.scrollLeft - target) < 4
      const timedOut = Date.now() - startTs > 1200
      if (arrived || timedOut) {
        if (!arrived) el.scrollTo({ left: target, behavior: 'auto' })
        el.style.scrollSnapType = '' // restaure le snap CSS, pile sur la cible
        syncActive()
        return
      }
      window.setTimeout(settle, 50)
    }
    window.setTimeout(settle, 50)
  }

  // Aligne la pastille sur la position de départ (la diapo n'est pas forcément
  // à 0 : restauration de scroll, end-align…) — sinon pastille ≠ tuile affichée.
  useEffect(() => {
    const raf = requestAnimationFrame(syncActive)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length])

  // Défilement automatique : avance d'un index toutes les ~4,5 s, en boucle.
  // Pause ~9 s dès que l'utilisateur interagit, respecte « prefers-reduced-motion ».
  useEffect(() => {
    if (banners.length <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return
      const next = (activeRef.current + 1) % banners.length
      scrollToIndex(next)
    }, 4500)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length])

  if (banners.length === 0) return null

  function goTo(i: number) {
    pause()
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
        onScroll={syncActive}
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
