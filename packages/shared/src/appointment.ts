/** Types & helpers « rendez-vous » — partagés serveur + PWA (config non sensible). */

export interface AppointmentTypeView {
  id: string
  code: string
  label: string
  durationMin: number
}

export interface SlotView {
  id: string
  appointmentTypeId: string
  startsAt: string // ISO 8601
}

/** Catalogue d'actes par défaut (appliqué à chaque officine au seed / en démo). */
export const DEFAULT_APPOINTMENT_TYPES: Array<{
  code: string
  label: string
  durationMin: number
}> = [
  { code: 'VACCINATION', label: 'Vaccination', durationMin: 15 },
  { code: 'ENTRETIEN', label: 'Entretien pharmaceutique', durationMin: 30 },
  { code: 'BPM', label: 'Bilan partagé de médication', durationMin: 45 },
  { code: 'TROD', label: 'TROD (test rapide)', durationMin: 15 },
]

const SLOT_HOURS = [9, 10, 11, 14, 15, 16]

/** Types d'actes synthétiques pour une officine (mode démo). */
export function demoAppointmentTypes(pharmacyId: string): AppointmentTypeView[] {
  return DEFAULT_APPOINTMENT_TYPES.map((t) => ({
    id: `${pharmacyId}__${t.code}`,
    code: t.code,
    label: t.label,
    durationMin: t.durationMin,
  }))
}

/** Créneaux synthétiques pour un type (mode démo), à partir d'une date de référence. */
export function demoSlots(typeId: string, from: Date, days = 7): SlotView[] {
  const slots: SlotView[] = []
  for (let d = 0; d <= days; d += 1) {
    const day = new Date(from)
    day.setDate(day.getDate() + d)
    if (day.getDay() === 0) continue // dimanche fermé
    for (const h of SLOT_HOURS) {
      const start = new Date(day)
      start.setHours(h, 0, 0, 0)
      if (start.getTime() <= from.getTime()) continue // pas de créneau passé
      slots.push({ id: `${typeId}__${start.toISOString()}`, appointmentTypeId: typeId, startsAt: start.toISOString() })
    }
  }
  return slots
}
