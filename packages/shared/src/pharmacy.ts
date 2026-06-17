/** Types & libellés du domaine « pharmacie » — partagés serveur + PWA. */

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Weekday = (typeof WEEKDAYS)[number]

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
}

/** Créneau d'ouverture, heures au format "HH:MM". */
export interface DayInterval {
  open: string
  close: string
}

/** Horaires hebdomadaires. Jour absent ou tableau vide = fermé. */
export type OpeningHours = Partial<Record<Weekday, DayInterval[]>>

/** Services proposés par une officine (codes stables + libellés FR). */
export const PHARMACY_SERVICES = {
  VACCINATION: 'Vaccination',
  TROD: 'TROD (tests rapides)',
  ENTRETIEN: 'Entretien pharmaceutique',
  BILAN_MEDICATION: 'Bilan partagé de médication',
  MATERIEL_MEDICAL: 'Matériel médical',
  ORTHOPEDIE: 'Orthopédie',
  AROMATHERAPIE: 'Aromathérapie',
  GARDE: 'Pharmacie de garde',
} as const

export type ServiceCode = keyof typeof PHARMACY_SERVICES

/** Données « source » d'une pharmacie (seed + démo). */
export interface PharmacySeed {
  cip: string
  name: string
  addressLine: string
  postalCode: string
  city: string
  latitude: number
  longitude: number
  phone: string
  services: ServiceCode[]
  openingHours: OpeningHours
}

/** Pharmacie telle que renvoyée à l'UI (source + champs calculés). */
export interface PharmacyView {
  id: string
  cip: string
  name: string
  addressLine: string
  postalCode: string
  city: string
  latitude: number
  longitude: number
  phone: string
  services: ServiceCode[]
  openingHours: OpeningHours
  /** Distance en km depuis le point fourni, ou null si non géolocalisé. */
  distanceKm: number | null
  /** Ouverte à l'instant de la requête. */
  isOpen: boolean
}

export type AffiliationType = 'REFERENCE' | 'CONSULTEE'

export interface AffiliationView {
  pharmacyId: string
  type: AffiliationType
}
