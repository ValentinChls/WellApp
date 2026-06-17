import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LigneDeVie } from './LigneDeVie'

/**
 * En-tête d'écran unifié : bouton retour optionnel, ligne de vie (motif de
 * marque) optionnelle, sur-titre et titre.
 */
export function ScreenHeader({
  title,
  eyebrow,
  back,
  lifeline = false,
}: {
  title: string
  eyebrow?: string
  back?: string | true
  lifeline?: boolean
}) {
  const navigate = useNavigate()
  return (
    <header className="screen-head">
      {back ? (
        <button
          className="head-back"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
        >
          <ArrowLeft size={18} aria-hidden="true" /> Retour
        </button>
      ) : null}
      {lifeline ? <LigneDeVie variant={1} width={116} /> : null}
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h1>{title}</h1>
    </header>
  )
}
