/**
 * Couche d'accès « rendez-vous ». DÉMO : types/créneaux synthétiques
 * (@wellpharma/shared) + réservations en localStorage. RÉEL : tRPC (réservation
 * cross-domaine atomique + audit + KPI côté serveur).
 */
import {
  demoAppointmentTypes,
  demoSlots,
  type AppointmentTypeView,
  type SlotView,
} from '@wellpharma/shared'
import { isDemoEnabled } from '../lib/demo'
import { trpc } from '../lib/trpcVanilla'

export interface MyAppointment {
  id: string
  appointmentTypeCode: string | null
  scheduledAt: string
  status: string
  pharmacyId: string
}

const APPT_KEY = 'wp-demo-appointments'
const BOOKED_KEY = 'wp-demo-booked-slots'

function readAppts(): MyAppointment[] {
  try {
    return JSON.parse(localStorage.getItem(APPT_KEY) ?? '[]') as MyAppointment[]
  } catch {
    return []
  }
}
function writeAppts(list: MyAppointment[]) {
  localStorage.setItem(APPT_KEY, JSON.stringify(list))
}
function readBooked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKED_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}
function writeBooked(list: string[]) {
  localStorage.setItem(BOOKED_KEY, JSON.stringify(list))
}

export async function listAppointmentTypes(pharmacyId: string): Promise<AppointmentTypeView[]> {
  if (isDemoEnabled()) return demoAppointmentTypes(pharmacyId)
  return trpc.appointments.listTypes.query({ pharmacyId })
}

export async function listSlots(appointmentTypeId: string): Promise<SlotView[]> {
  if (isDemoEnabled()) {
    const booked = new Set(readBooked())
    return demoSlots(appointmentTypeId, new Date()).filter((s) => !booked.has(s.id))
  }
  const rows = await trpc.appointments.listSlots.query({ appointmentTypeId })
  return rows.map((r) => ({
    id: r.id,
    appointmentTypeId: r.appointmentTypeId,
    startsAt: r.startsAt.toISOString(),
  }))
}

export async function bookSlot(
  slot: SlotView,
  meta: { pharmacyId: string; code: string },
): Promise<void> {
  if (isDemoEnabled()) {
    const appts = readAppts()
    appts.unshift({
      id: `demo-appt-${Date.now()}`,
      appointmentTypeCode: meta.code,
      scheduledAt: slot.startsAt,
      status: 'CONFIRMED',
      pharmacyId: meta.pharmacyId,
    })
    writeAppts(appts)
    writeBooked([...readBooked(), slot.id])
    return
  }
  await trpc.appointments.book.mutate({ slotId: slot.id })
}

export async function listMyAppointments(): Promise<MyAppointment[]> {
  if (isDemoEnabled()) return readAppts()
  const rows = await trpc.appointments.listMine.query()
  return rows.map((r) => ({
    id: r.id,
    appointmentTypeCode: r.appointmentTypeCode,
    scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : '',
    status: r.status,
    pharmacyId: r.pharmacyId,
  }))
}

export async function cancelAppointment(id: string): Promise<void> {
  if (isDemoEnabled()) {
    writeAppts(readAppts().map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a)))
    return
  }
  await trpc.appointments.cancel.mutate({ appointmentId: id })
}
