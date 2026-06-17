import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Droplet,
  Droplets,
  Leaf,
  PackageCheck,
  ScanLine,
  ShieldPlus,
  Sparkles,
  Syringe,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import {
  CARE_EVENT_CATEGORY_LABELS,
  MONTH_LABELS,
  PATIENT_ACTIONABLE,
} from '@wellpharma/shared'
import { ScreenHeader } from '../components/ScreenHeader'
import { LigneDeVieAnimee } from '../components/LigneDeVieAnimee'
import { Reveal } from '../components/Reveal'
import { listMissions } from '../data/missionService'
import { listCareEvents } from '../data/careEventService'
import { getLoyalty } from '../data/loyaltyService'

const MISSION_ICONS: Record<string, LucideIcon> = {
  Droplet,
  Droplets,
  Wind,
  ClipboardList,
  CalendarCheck,
  Syringe,
  PackageCheck,
  ScanLine,
  Leaf,
}
const DONE_STATES = ['COMPLETEE', 'A_VALIDER', 'VALIDEE', 'FACTUREE']

type Tone = 'done' | 'next' | 'upcoming'
interface TimelineEvent {
  id: string
  title: string
  subtitle: string
  Icon: LucideIcon
  tone: Tone
  accent: string
}

function careIcon(category: string): LucideIcon {
  if (category === 'VACCINATION') return Syringe
  if (category === 'DEPISTAGE') return ScanLine
  return ShieldPlus
}
function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

export function MaSantePage() {
  const navigate = useNavigate()
  const missions = useQuery({ queryKey: ['missions'], queryFn: listMissions })
  const events = useQuery({ queryKey: ['care-events'], queryFn: listCareEvents })
  const loyalty = useQuery({ queryKey: ['loyalty'], queryFn: getLoyalty })

  const list = missions.data ?? []
  const done = list.filter((m) => DONE_STATES.includes(m.state))
  const todo = list.filter((m) => PATIENT_ACTIONABLE.includes(m.state))
  const total = done.length + todo.length
  const score = total ? Math.round((done.length / total) * 100) : 100

  const month = new Date().getMonth() + 1
  const upcoming = (events.data ?? []).filter((e) => e.month >= month).slice(0, 2)

  // Construction de la ligne de vie : prochaines actions → prévention → historique.
  const timeline: TimelineEvent[] = []
  todo.forEach((m, i) => {
    timeline.push({
      id: `todo-${m.id}`,
      title: m.template.shortTitle,
      subtitle: i === 0 ? 'Votre prochaine action' : 'Recommandé par votre pharmacien',
      Icon: MISSION_ICONS[m.template.icon] ?? ClipboardList,
      tone: i === 0 ? 'next' : 'upcoming',
      accent: m.template.accent,
    })
  })
  upcoming.forEach((e) => {
    timeline.push({
      id: `event-${e.id}`,
      title: e.title,
      subtitle: `Prévention · ${CARE_EVENT_CATEGORY_LABELS[e.category]} · ${MONTH_LABELS[e.month - 1]}`,
      Icon: careIcon(e.category),
      tone: 'upcoming',
      accent: '#37bac9',
    })
  })
  done
    .slice()
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .forEach((m) => {
      timeline.push({
        id: `done-${m.id}`,
        title: m.template.shortTitle,
        subtitle: m.completedAt ? `Réalisé le ${fmtDate(m.completedAt)}` : 'Réalisé',
        Icon: MISSION_ICONS[m.template.icon] ?? ClipboardList,
        tone: 'done',
        accent: m.template.accent,
      })
    })

  // Anneau de score animé au montage.
  const R = 52
  const C = 2 * Math.PI * R
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setShown(score), 150)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div className="page">
      <ScreenHeader eyebrow="Votre parcours" title="Ma santé" />

      <Reveal>
        <div className="sante-hero">
          <div className="sante-ring" role="img" aria-label={`Parcours santé ${score} %`}>
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r={R} className="sante-ring-bg" />
              <circle
                cx="60"
                cy="60"
                r={R}
                className="sante-ring-fill"
                strokeDasharray={C}
                strokeDashoffset={C - (C * shown) / 100}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="sante-ring-label">
              <span className="sante-ring-val">{score}%</span>
              <span className="sante-ring-cap">à jour</span>
            </div>
          </div>
          <div className="sante-hero-text">
            <LigneDeVieAnimee width={130} />
            <p>
              {todo.length > 0
                ? `Il vous reste ${todo.length} action${todo.length > 1 ? 's' : ''} pour être pleinement à jour.`
                : 'Vous êtes à jour sur votre suivi. Bravo !'}
            </p>
            {loyalty.data ? (
              <span className="sante-points">
                <Sparkles size={14} aria-hidden="true" /> {loyalty.data.points.toLocaleString('fr-FR')} points fidélité
              </span>
            ) : null}
          </div>
        </div>
      </Reveal>

      {timeline.length === 0 ? (
        <div className="card stack">
          <strong>Votre parcours démarre ici</strong>
          <p className="muted">Vos actions de santé apparaîtront sur cette ligne de vie.</p>
        </div>
      ) : (
        <div className="sante-timeline">
          {timeline.map((ev, i) => {
            const Icon = ev.Icon
            return (
              <Reveal key={ev.id} delay={0.05 * i}>
                <div className={`sante-node sante-node-${ev.tone}`}>
                  <span className="sante-node-line" aria-hidden="true" />
                  <span
                    className="sante-node-dot"
                    style={{ background: `${ev.accent}1a`, color: ev.accent, borderColor: ev.accent }}
                  >
                    {ev.tone === 'done' ? <CheckCircle2 aria-hidden="true" /> : <Icon aria-hidden="true" />}
                  </span>
                  <button
                    className="sante-node-card"
                    onClick={() => navigate(ev.tone === 'done' ? '/ma-sante' : '/missions')}
                  >
                    <span className="t">{ev.title}</span>
                    <span className="d">{ev.subtitle}</span>
                  </button>
                </div>
              </Reveal>
            )
          })}
        </div>
      )}
    </div>
  )
}
