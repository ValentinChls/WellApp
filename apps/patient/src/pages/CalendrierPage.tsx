import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CARE_EVENT_CATEGORY_LABELS, MONTH_LABELS, type CareEventCategory } from '@wellpharma/shared'
import { type CareEventView, listCareEvents, listReminders, toggleReminder } from '../data/careEventService'
import { getConsents, setConsent } from '../data/consentService'
import { ScreenHeader } from '../components/ScreenHeader'
import { PreventionTabs } from '../components/PreventionTabs'

const THEMES: Array<{ key: CareEventCategory | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'Tous' },
  { key: 'VACCINATION', label: 'Vaccination' },
  { key: 'PREVENTION', label: 'Prévention' },
  { key: 'DEPISTAGE', label: 'Dépistage' },
  { key: 'SENSIBILISATION', label: 'Sensibilisation' },
]

export function CalendrierPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [view, setView] = useState<'mois' | 'liste'>('mois')
  const [theme, setTheme] = useState<CareEventCategory | 'ALL'>('ALL')

  const events = useQuery({ queryKey: ['care-events'], queryFn: listCareEvents })
  const reminders = useQuery({ queryKey: ['reminders'], queryFn: listReminders })
  const consents = useQuery({ queryKey: ['consents'], queryFn: getConsents })
  const notifOn = consents.data?.PUSH_NOTIFICATIONS === true

  const grantNotif = useMutation({
    mutationFn: () => setConsent('PUSH_NOTIFICATIONS', true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consents'] }),
  })
  const toggle = useMutation({
    mutationFn: (id: string) => toggleReminder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })

  const all = events.data ?? []
  const sorted = [...(theme === 'ALL' ? all : all.filter((e) => e.category === theme))].sort(
    (a, b) => a.month - b.month,
  )
  const reminderSet = new Set(reminders.data ?? [])

  function renderEvent(e: CareEventView) {
    const isVaccination = e.category === 'VACCINATION'
    const active = reminderSet.has(e.id)
    return (
      <div key={e.id} className={`event-card${isVaccination ? ' is-vaccination' : ''}`}>
        <div className="event-head">
          <span className={`chip${isVaccination ? ' chip-vacc' : ''}`}>
            {CARE_EVENT_CATEGORY_LABELS[e.category]}
          </span>
          <button
            type="button"
            className={`bell${active ? ' is-on' : ''}`}
            disabled={!notifOn || toggle.isPending}
            onClick={() => toggle.mutate(e.id)}
            aria-pressed={active}
            title={notifOn ? 'Activer / retirer le rappel' : 'Activez d’abord les notifications'}
          >
            {active ? '🔔' : '🔕'}
          </button>
        </div>
        <strong>{e.title}</strong>
        {e.description ? <p className="muted">{e.description}</p> : null}
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/rendez-vous')}>
          Prendre rendez-vous
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <ScreenHeader eyebrow="Temps forts de l’année" title="Prévention" />
      <PreventionTabs active="calendrier" />

      {!notifOn ? (
        <div className="card stack">
          <p className="muted">
            🔔 Activez les notifications pour recevoir un rappel avant chaque temps fort.
          </p>
          <button
            className="btn btn-outline btn-sm"
            disabled={grantNotif.isPending}
            onClick={() => grantNotif.mutate()}
          >
            Activer les rappels
          </button>
        </div>
      ) : null}

      <div className="cal-toggle" role="group" aria-label="Affichage">
        <button className={view === 'mois' ? 'is-active' : ''} onClick={() => setView('mois')}>
          Mois
        </button>
        <button className={view === 'liste' ? 'is-active' : ''} onClick={() => setView('liste')}>
          Liste
        </button>
      </div>

      <div className="chips" role="group" aria-label="Filtrer par thème">
        {THEMES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`chip chip-filter${theme === t.key ? ' is-active' : ''}`}
            aria-pressed={theme === t.key}
            onClick={() => setTheme(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {events.isLoading ? (
        <p className="muted">Chargement…</p>
      ) : sorted.length === 0 ? (
        <p className="muted">Aucun événement pour ce filtre.</p>
      ) : view === 'liste' ? (
        <div className="stack">{sorted.map(renderEvent)}</div>
      ) : (
        <div className="stack">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const monthEvents = sorted.filter((e) => e.month === m)
            if (monthEvents.length === 0) return null
            return (
              <section key={m} className="cal-month">
                <h2 className="cal-month-title">{MONTH_LABELS[m - 1]}</h2>
                <div className="stack">{monthEvents.map(renderEvent)}</div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
