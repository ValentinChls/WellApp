import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { PharmacyView } from '@wellpharma/shared'
import { listAffiliations, searchPharmacies } from '../data/pharmacyService'
import { PharmacyCard } from '../components/PharmacyCard'
import { PharmacyMap, type LatLng } from '../components/PharmacyMap'
import { BottomSheet } from '../components/BottomSheet'

export function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [coords, setCoords] = useState<LatLng | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)

  const results = useQuery({
    queryKey: ['pharmacies', query, coords],
    queryFn: () =>
      searchPharmacies({ query: query || undefined, lat: coords?.lat, lng: coords?.lng }),
  })
  const affiliations = useQuery({ queryKey: ['affiliations'], queryFn: listAffiliations })
  const referenceId = affiliations.data?.find((a) => a.type === 'REFERENCE')?.pharmacyId ?? null

  const list = useMemo(() => results.data ?? [], [results.data])

  function select(p: PharmacyView) {
    setSelectedId(p.id)
    setFlyTarget([p.latitude, p.longitude])
  }

  function locate() {
    setGeoError(null)
    if (!('geolocation' in navigator)) {
      setGeoError('Géolocalisation indisponible sur cet appareil.')
      return
    }
    setGeoBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoBusy(false)
      },
      () => {
        setGeoError('Position refusée ou indisponible.')
        setGeoBusy(false)
      },
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }

  return (
    <div className="map-screen">
      <div className="map-canvas">
        <PharmacyMap
          pharmacies={list}
          activeId={selectedId ?? referenceId}
          referenceId={referenceId}
          userCoords={coords}
          flyTarget={flyTarget}
          onSelect={(id) => {
            const p = list.find((x) => x.id === id)
            if (p) select(p)
          }}
        />
      </div>

      <div className="map-topbar">
        <button type="button" className="glass-btn" onClick={() => navigate('/')} aria-label="Retour">
          ←
        </button>
        <div className="glass-field">
          <span className="glass-field-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            placeholder="Nom, ville ou code postal"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher une pharmacie"
          />
        </div>
      </div>

      <button
        type="button"
        className={`fab-locate${geoBusy ? ' is-busy' : ''}`}
        onClick={locate}
        aria-label="Pharmacies autour de moi"
      >
        {geoBusy ? '⏳' : '📍'}
      </button>

      <BottomSheet>
        <div className="sheet-head">
          <h2>
            {list.length} pharmacie{list.length > 1 ? 's' : ''}
          </h2>
          <span className="muted">{coords ? 'autour de vous' : 'réseau Wellpharma'}</span>
        </div>
        {geoError ? <p className="muted sheet-note">{geoError}</p> : null}
        <div className="sheet-list">
          {results.isLoading ? <p className="muted">Recherche…</p> : null}
          {!results.isLoading && list.length === 0 ? (
            <p className="muted">Aucune pharmacie trouvée.</p>
          ) : null}
          {list.map((p, i) => (
            <PharmacyCard
              key={p.id}
              pharmacy={p}
              index={i}
              isReference={p.id === referenceId}
              selected={p.id === selectedId}
              onClick={() => select(p)}
              onOpen={() => navigate(`/pharmacies/${p.id}`)}
            />
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
