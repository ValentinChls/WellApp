import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import type { PharmacyView } from '@wellpharma/shared'

export interface LatLng {
  lat: number
  lng: number
}

function markerHtml(active: boolean, isRef: boolean) {
  return `<div class="wp-marker${active ? ' is-active' : ''}${isRef ? ' is-ref' : ''}">
    <span class="wp-marker-ring"></span>
    <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1C8.4 1 1.5 7.9 1.5 16.5 1.5 28 17 41 17 41s15.5-13 15.5-24.5C32.5 7.9 25.6 1 17 1Z" fill="currentColor" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="17" cy="16.2" r="9.1" fill="#ffffff"/>
      <path d="M17 11.2v10M12 16.2h10" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    </svg>
  </div>`
}

function makeIcon(active: boolean, isRef: boolean) {
  return L.divIcon({
    className: 'wp-marker-wrap',
    html: markerHtml(active, isRef),
    iconSize: [34, 42],
    iconAnchor: [17, 41],
  })
}

function clusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount()
  const size = count < 8 ? 'sm' : count < 20 ? 'md' : 'lg'
  return L.divIcon({
    html: `<div class="wp-cluster wp-cluster-${size}"><span>${count}</span></div>`,
    className: 'wp-cluster-wrap',
    iconSize: L.point(48, 48),
  })
}

function ClusterLayer({
  pharmacies,
  activeId,
  referenceId,
  onSelect,
}: {
  pharmacies: PharmacyView[]
  activeId?: string | null
  referenceId?: string | null
  onSelect?: (id: string) => void
}) {
  const map = useMap()
  const markers = useRef<Map<string, L.Marker>>(new Map())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const prevActive = useRef<string | null>(null)

  // (Re)construit le groupe quand la liste ou la pharmacie de référence change.
  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 56,
      chunkedLoading: true,
      iconCreateFunction: clusterIcon,
    })
    const map2 = new Map<string, L.Marker>()
    for (const p of pharmacies) {
      const marker = L.marker([p.latitude, p.longitude], {
        icon: makeIcon(false, p.id === referenceId),
      })
      marker.on('click', () => onSelectRef.current?.(p.id))
      map2.set(p.id, marker)
      group.addLayer(marker)
    }
    map.addLayer(group)
    markers.current = map2
    prevActive.current = null
    return () => {
      map.removeLayer(group)
      markers.current = new Map()
    }
  }, [map, pharmacies, referenceId])

  // Met à jour l'icône active sans reconstruire le groupe.
  useEffect(() => {
    const m = markers.current
    if (prevActive.current && m.has(prevActive.current)) {
      const id = prevActive.current
      m.get(id)!.setIcon(makeIcon(false, id === referenceId))
    }
    if (activeId && m.has(activeId)) {
      m.get(activeId)!.setIcon(makeIcon(true, activeId === referenceId))
    }
    prevActive.current = activeId ?? null
  }, [activeId, referenceId])

  return null
}

function FitController({
  pharmacies,
  userCoords,
}: {
  pharmacies: PharmacyView[]
  userCoords?: LatLng | null
}) {
  const map = useMap()
  useEffect(() => {
    if (pharmacies.length === 0) return
    let points: Array<[number, number]> = pharmacies.map((p) => [p.latitude, p.longitude])
    if (userCoords) {
      points = [
        [userCoords.lat, userCoords.lng],
        ...pharmacies.slice(0, 5).map((p) => [p.latitude, p.longitude] as [number, number]),
      ]
    }
    if (points.length === 1) {
      map.setView(points[0]!, 13, { animate: true })
    } else {
      map.fitBounds(points, { padding: [70, 70], maxZoom: userCoords ? 13 : 12, animate: true })
    }
  }, [map, pharmacies, userCoords])
  return null
}

function FlyController({ target }: { target?: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    // setView animé (flyTo est défaillant avec ce fond de carte) : recentrage fluide.
    if (target) map.setView(target, Math.max(map.getZoom(), 14), { animate: true })
  }, [map, target])
  return null
}

function UserLocation({ coords }: { coords?: LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    if (!coords) return
    const marker = L.marker([coords.lat, coords.lng], {
      interactive: false,
      zIndexOffset: 1000,
      icon: L.divIcon({
        className: 'wp-userloc-wrap',
        html: '<div class="wp-userdot"><span class="wp-userdot-pulse"></span><span class="wp-userdot-core"></span></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    })
    marker.addTo(map)
    return () => {
      marker.remove()
    }
  }, [map, coords])
  return null
}

export function PharmacyMap({
  pharmacies,
  activeId,
  referenceId,
  userCoords,
  flyTarget,
  onSelect,
}: {
  pharmacies: PharmacyView[]
  activeId?: string | null
  referenceId?: string | null
  userCoords?: LatLng | null
  flyTarget?: [number, number] | null
  onSelect?: (id: string) => void
}) {
  return (
    <MapContainer
      center={[46.6, 2.4]}
      zoom={6}
      zoomControl={false}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      <ClusterLayer
        pharmacies={pharmacies}
        activeId={activeId}
        referenceId={referenceId}
        onSelect={onSelect}
      />
      <UserLocation coords={userCoords} />
      <FitController pharmacies={pharmacies} userCoords={userCoords} />
      <FlyController target={flyTarget} />
    </MapContainer>
  )
}
