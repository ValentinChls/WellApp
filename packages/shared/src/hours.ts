import { WEEKDAYS, type OpeningHours, type Weekday } from './pharmacy'

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':')
  return Number(h) * 60 + Number(m)
}

/** Jour de la semaine (clé `Weekday`) pour une date donnée. */
export function weekdayOf(date: Date): Weekday {
  // Date.getDay : 0 = dimanche … 6 = samedi. WEEKDAYS commence au lundi.
  return WEEKDAYS[(date.getDay() + 6) % 7]!
}

/** Vrai si l'officine est ouverte à l'instant `now`. */
export function isOpenNow(hours: OpeningHours, now: Date): boolean {
  const intervals = hours[weekdayOf(now)] ?? []
  const current = now.getHours() * 60 + now.getMinutes()
  return intervals.some((i) => current >= toMinutes(i.open) && current < toMinutes(i.close))
}

/** Libellé compact des horaires d'un jour (ex. "08:30–12:30, 14:00–19:30" ou "Fermé"). */
export function formatDayHours(hours: OpeningHours, day: Weekday): string {
  const intervals = hours[day] ?? []
  if (intervals.length === 0) return 'Fermé'
  return intervals.map((i) => `${i.open}–${i.close}`).join(', ')
}
