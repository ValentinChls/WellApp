/**
 * Couche d'accès « pharmacies & affiliations ».
 * Bascule entre le MODE DÉMO (données embarquées + localStorage, hors-ligne)
 * et le MODE RÉEL (tRPC → API admin). Les écrans restent agnostiques.
 */
import {
  DEMO_PHARMACIES,
  distanceKm,
  isOpenNow,
  type AffiliationType,
  type AffiliationView,
  type PharmacySeed,
  type PharmacyView,
} from '@wellpharma/shared'
import { isDemoEnabled } from '../lib/demo'
import { trpc } from '../lib/trpcVanilla'

export interface SearchParams {
  query?: string
  lat?: number
  lng?: number
}

const AFF_KEY = 'wp-demo-affiliations'

// ─────────────────────────── Démo
function demoView(p: PharmacySeed, origin?: { latitude: number; longitude: number }): PharmacyView {
  return {
    id: p.cip,
    cip: p.cip,
    name: p.name,
    addressLine: p.addressLine,
    postalCode: p.postalCode,
    city: p.city,
    latitude: p.latitude,
    longitude: p.longitude,
    phone: p.phone,
    services: p.services,
    openingHours: p.openingHours,
    distanceKm: origin ? distanceKm(origin, p) : null,
    isOpen: isOpenNow(p.openingHours, new Date()),
  }
}

function demoSearch(params: SearchParams): PharmacyView[] {
  const q = params.query?.trim().toLowerCase()
  const origin =
    params.lat != null && params.lng != null
      ? { latitude: params.lat, longitude: params.lng }
      : undefined
  const views = DEMO_PHARMACIES.filter(
    (p) =>
      !q ||
      p.city.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.postalCode.startsWith(q),
  ).map((p) => demoView(p, origin))
  views.sort((a, b) =>
    origin ? (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) : a.name.localeCompare(b.name),
  )
  return views
}

function demoAffiliations(): AffiliationView[] {
  try {
    return JSON.parse(localStorage.getItem(AFF_KEY) ?? '[]') as AffiliationView[]
  } catch {
    return []
  }
}
function saveDemoAffiliations(list: AffiliationView[]): void {
  localStorage.setItem(AFF_KEY, JSON.stringify(list))
}

// ─────────────────────────── API publique (agnostique du mode)
export async function searchPharmacies(params: SearchParams): Promise<PharmacyView[]> {
  if (isDemoEnabled()) return demoSearch(params)
  return trpc.engagement.pharmacies.search.query(params)
}

export async function getPharmacy(id: string): Promise<PharmacyView | null> {
  if (isDemoEnabled()) {
    const p = DEMO_PHARMACIES.find((x) => x.cip === id)
    return p ? demoView(p) : null
  }
  return trpc.engagement.pharmacies.getById.query({ id })
}

export async function listAffiliations(): Promise<AffiliationView[]> {
  if (isDemoEnabled()) return demoAffiliations()
  const rows = await trpc.affiliation.list.query()
  return rows.map((r) => ({ pharmacyId: r.pharmacyId, type: r.type as AffiliationType }))
}

export async function setReference(pharmacyId: string): Promise<void> {
  if (isDemoEnabled()) {
    const list = demoAffiliations().map((a) =>
      a.type === 'REFERENCE' ? { ...a, type: 'CONSULTEE' as const } : a,
    )
    const idx = list.findIndex((a) => a.pharmacyId === pharmacyId)
    if (idx >= 0) list[idx] = { pharmacyId, type: 'REFERENCE' }
    else list.push({ pharmacyId, type: 'REFERENCE' })
    saveDemoAffiliations(list)
    return
  }
  await trpc.affiliation.setReference.mutate({ pharmacyId })
}

export async function addConsulted(pharmacyId: string): Promise<void> {
  if (isDemoEnabled()) {
    const list = demoAffiliations()
    if (!list.some((a) => a.pharmacyId === pharmacyId)) {
      list.push({ pharmacyId, type: 'CONSULTEE' })
      saveDemoAffiliations(list)
    }
    return
  }
  await trpc.affiliation.addConsulted.mutate({ pharmacyId })
}

export async function removeAffiliation(pharmacyId: string): Promise<void> {
  if (isDemoEnabled()) {
    saveDemoAffiliations(demoAffiliations().filter((a) => a.pharmacyId !== pharmacyId))
    return
  }
  await trpc.affiliation.remove.mutate({ pharmacyId })
}
