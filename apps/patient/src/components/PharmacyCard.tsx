import { motion } from 'framer-motion'
import { PHARMACY_SERVICES, type PharmacyView } from '@wellpharma/shared'

export function PharmacyCard({
  pharmacy,
  index = 0,
  isReference,
  selected,
  onClick,
  onOpen,
}: {
  pharmacy: PharmacyView
  index?: number
  isReference?: boolean
  selected?: boolean
  onClick?: () => void
  onOpen?: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.45), type: 'spring', stiffness: 380, damping: 30 }}
      className={`pharma-card${selected ? ' is-selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <div className="pharma-card-head">
        <strong>{pharmacy.name}</strong>
        {isReference ? <span className="badge badge-ref">★ Référence</span> : null}
      </div>
      <div className="muted">
        {pharmacy.addressLine}, {pharmacy.postalCode} {pharmacy.city}
      </div>
      <div className="pharma-meta">
        <span className={pharmacy.isOpen ? 'status-open' : 'status-closed'}>
          {pharmacy.isOpen ? '● Ouvert' : '● Fermé'}
        </span>
        {pharmacy.distanceKm != null ? (
          <span className="muted">· {pharmacy.distanceKm} km</span>
        ) : null}
      </div>
      <div className="chips">
        {pharmacy.services.slice(0, 3).map((s) => (
          <span key={s} className="chip">
            {PHARMACY_SERVICES[s]}
          </span>
        ))}
      </div>
      {selected ? (
        <button
          type="button"
          className="btn pharma-open"
          onClick={(e) => {
            e.stopPropagation()
            onOpen?.()
          }}
        >
          Voir la fiche →
        </button>
      ) : null}
    </motion.div>
  )
}
