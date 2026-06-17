import { useState } from 'react'
import { LigneDeVie } from './LigneDeVie'

/**
 * Logo Wellpharma. Affiche le fichier OFFICIEL s'il est présent
 * (`public/brand/logo-wellpharma.png` ou `.svg`) ; sinon un repli de marque
 * (ligne de vie signature + wordmark « wellpharma »).
 *
 * → Déposez le logo officiel dans `apps/patient/public/brand/logo-wellpharma.png`
 *   (fond transparent) pour un rendu pixel-perfect : il est utilisé automatiquement.
 */
export function WellpharmaLogo({
  height = 56,
  withTagline = false,
}: {
  height?: number
  withTagline?: boolean
}) {
  const [useFallback, setUseFallback] = useState(false)

  if (!useFallback) {
    return (
      <img
        src="/brand/logo-badge.png"
        alt="Wellpharma"
        style={{ height, width: height, display: 'block' }}
        onError={() => setUseFallback(true)}
      />
    )
  }

  return (
    <div className="wp-logo" role="img" aria-label="Wellpharma">
      <LigneDeVie variant={1} width={Math.round(height * 2.4)} />
      <span className="wp-wordmark">wellpharma</span>
      {withTagline ? <span className="wp-tagline">La performance coopérative</span> : null}
    </div>
  )
}
