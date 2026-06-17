import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Droplet,
  Droplets,
  Leaf,
  PackageCheck,
  ScanLine,
  Syringe,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import {
  MISSION_STATE_LABELS,
  PATIENT_ACTIONABLE,
  answeredCount,
  missionInputSteps,
} from '@wellpharma/shared'
import { ScreenHeader } from '../components/ScreenHeader'
import { Reveal } from '../components/Reveal'
import { listMissions, type MissionWithTemplate } from '../data/missionService'

const ICONS: Record<string, LucideIcon> = {
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

function ctaLabel(m: MissionWithTemplate): string {
  if (m.state === 'EN_COURS') return 'Reprendre'
  if (m.state === 'A_RENOUVELER') return 'Renouveler'
  if (DONE_STATES.includes(m.state)) return 'Voir'
  return 'Commencer'
}

export function MissionsPage() {
  const navigate = useNavigate()
  const missions = useQuery({ queryKey: ['missions'], queryFn: listMissions })
  const list = missions.data ?? []

  const aFaire = list.filter((m) => PATIENT_ACTIONABLE.includes(m.state) && m.state !== 'EN_COURS')
  const enCours = list.filter((m) => m.state === 'EN_COURS')
  const terminees = list.filter((m) => DONE_STATES.includes(m.state))

  const done = terminees.length
  const total = list.length
  const pct = total ? Math.round((done / total) * 100) : 0
  const parcoursNote =
    aFaire.length + enCours.length > 0
      ? `Il reste ${aFaire.length + enCours.length} action${aFaire.length + enCours.length > 1 ? 's' : ''} à votre rythme — chaque pas compte.`
      : done > 0
        ? 'Votre parcours est à jour. Merci pour votre implication.'
        : 'Votre pharmacien vous proposera des actions utiles à votre santé.'

  function Card({ m, index }: { m: MissionWithTemplate; index: number }) {
    const Icon = ICONS[m.template.icon] ?? ClipboardList
    const total = missionInputSteps(m.template).length
    const done = answeredCount(m.template, m.answers)
    const pct = total ? Math.round((done / total) * 100) : 0
    const isDone = DONE_STATES.includes(m.state)
    return (
      <Reveal delay={index * 0.05}>
        <button className="mission-card" onClick={() => navigate(`/missions/${m.id}`)}>
          <span className="mission-ico" style={{ background: `${m.template.accent}1a`, color: m.template.accent }}>
            <Icon aria-hidden="true" />
          </span>
          <span className="grow">
            <span className="t">{m.template.title}</span>
            <span className="d">
              {isDone ? MISSION_STATE_LABELS[m.state] : `${m.template.shortTitle} · ~${m.template.estimatedMin} min`}
            </span>
            {m.state === 'EN_COURS' ? (
              <span className="mission-prog">
                <span className="mission-prog-fill" style={{ width: `${pct}%`, background: m.template.accent }} />
              </span>
            ) : null}
          </span>
          <span className={`mission-cta${isDone ? ' is-done' : ''}`}>
            {ctaLabel(m)}
            <ChevronRight size={16} aria-hidden="true" />
          </span>
        </button>
      </Reveal>
    )
  }

  return (
    <div className="page">
      <ScreenHeader eyebrow="Avec votre pharmacien" title="Mes missions" />
      <p className="muted">Des actions simples, proposées par votre pharmacien, à faire à votre rythme.</p>

      {missions.isLoading ? (
        <p className="muted">Chargement…</p>
      ) : list.length === 0 ? (
        <div className="card stack">
          <strong>Aucune mission pour le moment</strong>
          <p className="muted">Votre pharmacien vous en proposera lorsque ce sera utile.</p>
        </div>
      ) : (
        <>
          <Reveal>
            <div className="card parcours">
              <div className="parcours-head">
                <div>
                  <span className="parcours-eyebrow">Parcours santé</span>
                  <strong className="parcours-count">
                    {done} mission{done > 1 ? 's' : ''} accomplie{done > 1 ? 's' : ''}
                    {total > 0 ? <span className="parcours-total"> sur {total}</span> : null}
                  </strong>
                </div>
                <span className="parcours-pct">{pct}%</span>
              </div>
              <span className="mission-prog">
                <span className="mission-prog-fill" style={{ width: `${pct}%` }} />
              </span>
              <p className="muted parcours-note">{parcoursNote}</p>
            </div>
          </Reveal>

          {aFaire.length > 0 ? (
            <section className="section">
              <h2 className="section-title">À faire</h2>
              {aFaire.map((m, i) => (
                <Card key={m.id} m={m} index={i} />
              ))}
            </section>
          ) : null}

          {enCours.length > 0 ? (
            <section className="section">
              <h2 className="section-title">En cours</h2>
              {enCours.map((m, i) => (
                <Card key={m.id} m={m} index={i} />
              ))}
            </section>
          ) : null}

          {terminees.length > 0 ? (
            <section className="section">
              <h2 className="section-title">Terminées</h2>
              {terminees.map((m, i) => (
                <Card key={m.id} m={m} index={i} />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
