import { Link } from 'react-router-dom'

/** Onglets pilule du hub Prévention (Calendrier ↔ Défis). */
export function PreventionTabs({ active }: { active: 'calendrier' | 'defis' }) {
  return (
    <div className="pill-tabs" role="tablist" aria-label="Sections prévention">
      <Link
        to="/calendrier"
        role="tab"
        aria-selected={active === 'calendrier'}
        className={`pill-tab${active === 'calendrier' ? ' is-active' : ''}`}
      >
        Calendrier
      </Link>
      <Link
        to="/prevention"
        role="tab"
        aria-selected={active === 'defis'}
        className={`pill-tab${active === 'defis' ? ' is-active' : ''}`}
      >
        Défis
      </Link>
    </div>
  )
}
