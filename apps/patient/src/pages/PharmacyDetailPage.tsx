import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PHARMACY_SERVICES,
  WEEKDAYS,
  WEEKDAY_LABELS,
  formatDayHours,
} from '@wellpharma/shared'
import {
  addConsulted,
  getPharmacy,
  listAffiliations,
  removeAffiliation,
  setReference,
} from '../data/pharmacyService'
import { PharmacyMap } from '../components/PharmacyMap'
import { ScreenHeader } from '../components/ScreenHeader'

export function PharmacyDetailPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()

  const pharmacy = useQuery({ queryKey: ['pharmacy', id], queryFn: () => getPharmacy(id) })
  const affiliations = useQuery({ queryKey: ['affiliations'], queryFn: listAffiliations })
  const current = affiliations.data?.find((a) => a.pharmacyId === id)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['affiliations'] })
  const refMut = useMutation({ mutationFn: () => setReference(id), onSuccess: invalidate })
  const addMut = useMutation({ mutationFn: () => addConsulted(id), onSuccess: invalidate })
  const removeMut = useMutation({ mutationFn: () => removeAffiliation(id), onSuccess: invalidate })

  if (pharmacy.isLoading) {
    return (
      <div className="page">
        <p className="muted">Chargement…</p>
      </div>
    )
  }

  const p = pharmacy.data
  if (!p) {
    return (
      <div className="page">
        <ScreenHeader title="Pharmacie" back="/pharmacies" />
        <p className="muted">Pharmacie introuvable.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <ScreenHeader title={p.name} back="/pharmacies" />

      <section className="card stack">
        <div className="pharma-card-head">
          {current?.type === 'REFERENCE' ? (
            <span className="badge">★ Référence</span>
          ) : current ? (
            <span className="badge">Consultée</span>
          ) : null}
        </div>
        <p className="muted">
          {p.addressLine}, {p.postalCode} {p.city}
        </p>
        <p>
          <span className={p.isOpen ? 'status-open' : 'status-closed'}>
            {p.isOpen ? '● Ouvert' : '● Fermé'}
          </span>
          {p.distanceKm != null ? <span className="muted"> · {p.distanceKm} km</span> : null}
        </p>
        <a className="link" href={`tel:${p.phone.replace(/\s/g, '')}`}>
          📞 {p.phone}
        </a>
      </section>

      <div className="wp-map">
        <PharmacyMap
          pharmacies={[p]}
          activeId={p.id}
          referenceId={current?.type === 'REFERENCE' ? p.id : null}
        />
      </div>

      <section className="card">
        <h2>Horaires</h2>
        <ul className="hours">
          {WEEKDAYS.map((d) => (
            <li key={d}>
              <span>{WEEKDAY_LABELS[d]}</span>
              <span className="muted">{formatDayHours(p.openingHours, d)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Services</h2>
        <div className="chips">
          {p.services.map((s) => (
            <span key={s} className="chip">
              {PHARMACY_SERVICES[s]}
            </span>
          ))}
        </div>
      </section>

      <div className="stack">
        {current?.type !== 'REFERENCE' ? (
          <button
            type="button"
            className="btn"
            disabled={refMut.isPending}
            onClick={() => refMut.mutate()}
          >
            ★ Définir comme pharmacie de référence
          </button>
        ) : null}
        {!current ? (
          <button
            type="button"
            className="btn btn-outline"
            disabled={addMut.isPending}
            onClick={() => addMut.mutate()}
          >
            + Ajouter à mes pharmacies consultées
          </button>
        ) : null}
        {current ? (
          <button
            type="button"
            className="btn btn-outline"
            disabled={removeMut.isPending}
            onClick={() => removeMut.mutate()}
          >
            Retirer de mes pharmacies
          </button>
        ) : null}
      </div>
    </div>
  )
}
