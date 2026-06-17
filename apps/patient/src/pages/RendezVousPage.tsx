import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DEFAULT_APPOINTMENT_TYPES,
  appointmentStatusLabel,
  type AppointmentTypeView,
  type SlotView,
} from '@wellpharma/shared'
import {
  bookSlot,
  cancelAppointment,
  listAppointmentTypes,
  listMyAppointments,
  listSlots,
} from '../data/appointmentService'
import { getPharmacy, listAffiliations } from '../data/pharmacyService'
import { ScreenHeader } from '../components/ScreenHeader'
import { SuccessBurst } from '../components/SuccessBurst'

const dayFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
})
const fullFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
})

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function appointmentTypeLabel(code: string | null): string {
  if (!code) return 'Rendez-vous'
  return DEFAULT_APPOINTMENT_TYPES.find((t) => t.code === code)?.label ?? code
}

interface DayGroup {
  key: string
  label: string
  slots: SlotView[]
}

function groupSlotsByDay(slots: SlotView[]): DayGroup[] {
  const groups = new Map<string, DayGroup>()
  for (const slot of slots) {
    const key = dayKey(slot.startsAt)
    let group = groups.get(key)
    if (!group) {
      group = { key, label: capitalize(dayFormatter.format(new Date(slot.startsAt))), slots: [] }
      groups.set(key, group)
    }
    group.slots.push(slot)
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key))
}

export function RendezVousPage() {
  const qc = useQueryClient()

  const affiliations = useQuery({ queryKey: ['affiliations'], queryFn: listAffiliations })
  const referenceId = affiliations.data?.find((a) => a.type === 'REFERENCE')?.pharmacyId
  const reference = useQuery({
    queryKey: ['pharmacy', referenceId],
    queryFn: () => getPharmacy(referenceId!),
    enabled: Boolean(referenceId),
  })

  const [selectedType, setSelectedType] = useState<AppointmentTypeView | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const types = useQuery({
    queryKey: ['appt-types', referenceId],
    queryFn: () => listAppointmentTypes(referenceId!),
    enabled: Boolean(referenceId),
  })

  const slots = useQuery({
    queryKey: ['slots', selectedType?.id],
    queryFn: () => listSlots(selectedType!.id),
    enabled: Boolean(selectedType),
  })

  const myAppointments = useQuery({ queryKey: ['my-appointments'], queryFn: listMyAppointments })

  const bookMut = useMutation({
    mutationFn: (slot: SlotView) =>
      bookSlot(slot, { pharmacyId: referenceId!, code: selectedType!.code }),
    onSuccess: (_data, slot) => {
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
      qc.invalidateQueries({ queryKey: ['slots', selectedType?.id] })
      setConfirmation(`Rendez-vous confirmé le ${fullFormatter.format(new Date(slot.startsAt))}.`)
    },
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-appointments'] }),
  })

  function chooseType(type: AppointmentTypeView) {
    setSelectedType(type)
    setConfirmation(null)
  }

  return (
    <div className="page">
      {confirmation ? (
        <SuccessBurst
          title="Rendez-vous confirmé"
          subtitle={confirmation}
          onClose={() => setConfirmation(null)}
        />
      ) : null}
      <ScreenHeader eyebrow="Avec votre pharmacien" title="Prendre rendez-vous" back="/soins" />
      <p className="muted">Réserver un créneau auprès de sa pharmacie de référence.</p>

      {affiliations.isLoading ? (
        <section className="card">
          <p className="muted">Chargement…</p>
        </section>
      ) : !referenceId ? (
        <section className="card stack">
          <h2>Aucune pharmacie de référence</h2>
          <p className="muted">
            Choisir d’abord une pharmacie de référence pour prendre rendez-vous.
          </p>
          <Link className="btn" to="/pharmacies">
            Choisir une pharmacie
          </Link>
        </section>
      ) : (
        <>
          <section className="card stack">
            <h2>1. Choisir un acte</h2>
            {reference.data ? (
              <p className="muted">
                Pharmacie : <strong>{reference.data.name}</strong>
                {reference.data.city ? ` · ${reference.data.city}` : ''}
              </p>
            ) : null}
            {types.isLoading ? (
              <p className="muted">Chargement des actes…</p>
            ) : types.data && types.data.length > 0 ? (
              <div className="chips" role="group" aria-label="Choisir un acte">
                {types.data.map((t) => {
                  const active = selectedType?.id === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`chip chip-action${active ? ' is-active' : ''}`}
                      aria-pressed={active}
                      onClick={() => chooseType(t)}
                    >
                      {t.label} · {t.durationMin} min
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="muted">Aucun acte proposé par cette pharmacie.</p>
            )}
          </section>

          {selectedType ? (
            <section className="card stack">
              <h2>2. Choisir un créneau</h2>
              <p className="muted">
                {selectedType.label} · {selectedType.durationMin} min
              </p>
              {confirmation ? (
                <p className="status-open" role="status">
                  ✅ {confirmation}
                </p>
              ) : null}
              {bookMut.isError ? (
                <p className="error" role="alert">
                  La réservation a échoué. Merci de réessayer.
                </p>
              ) : null}
              {slots.isLoading ? (
                <p className="muted">Chargement des créneaux…</p>
              ) : slots.data && slots.data.length > 0 ? (
                <div className="stack">
                  {groupSlotsByDay(slots.data).map((group) => (
                    <div key={group.key}>
                      <h3 className="slot-day">{group.label}</h3>
                      <div className="slot-grid">
                        {group.slots.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            className="slot-btn"
                            disabled={bookMut.isPending}
                            onClick={() => bookMut.mutate(slot)}
                          >
                            {timeFormatter.format(new Date(slot.startsAt))}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Aucun créneau disponible pour cet acte.</p>
              )}
            </section>
          ) : null}
        </>
      )}

      <section className="card stack">
        <h2>Mes rendez-vous</h2>
        {myAppointments.isLoading ? (
          <p className="muted">Chargement…</p>
        ) : myAppointments.data && myAppointments.data.length > 0 ? (
          <ul className="record-list">
            {myAppointments.data.map((appt) => (
              <li key={appt.id} className="record-card">
                <div className="record-head">
                  <strong>{appointmentTypeLabel(appt.appointmentTypeCode)}</strong>
                  <span className="badge">{appointmentStatusLabel(appt.status)}</span>
                </div>
                <span className="muted">
                  {appt.scheduledAt ? fullFormatter.format(new Date(appt.scheduledAt)) : '—'}
                </span>
                {appt.status === 'CONFIRMED' ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={cancelMut.isPending}
                    onClick={() => cancelMut.mutate(appt.id)}
                  >
                    Annuler
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Aucun rendez-vous pour le moment.</p>
        )}
      </section>
    </div>
  )
}
