export interface LatLng {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Distance haversine (km) entre deux points, arrondie à 0,1 km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  const d = 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
  return Math.round(d * 10) / 10
}
