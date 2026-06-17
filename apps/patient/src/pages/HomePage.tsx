import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarPlus,
  ChevronRight,
  ClipboardList,
  CreditCard,
  MessageCircle,
  Search,
  ShieldPlus,
} from 'lucide-react'
import { CARE_EVENT_CATEGORY_LABELS, MONTH_LABELS, PATIENT_ACTIONABLE } from '@wellpharma/shared'
import { LigneDeVieAnimee } from '../components/LigneDeVieAnimee'
import { Reveal } from '../components/Reveal'
import { BouclierPrevention } from '../components/BouclierPrevention'
import { ReseauVivant } from '../components/ReseauVivant'
import { listAffiliations, getPharmacy } from '../data/pharmacyService'
import { listCareEvents } from '../data/careEventService'
import { listMissions } from '../data/missionService'
import { getLoyalty } from '../data/loyaltyService'
import { getHomeBanners } from '../data/homeService'
import { HomeCarousel } from '../components/HomeCarousel'

const TILES = [
  { to: '/conseil', Icon: MessageCircle, label: 'Conseil' },
  { to: '/rendez-vous', Icon: CalendarPlus, label: 'Rendez-vous' },
  { to: '/entretiens', Icon: ClipboardList, label: 'Entretiens' },
  { to: '/prevention', Icon: ShieldPlus, label: 'Prévention' },
]

const PREVENTION_ITEMS = [
  { id: 'grippe', label: 'Vaccin antigrippal', done: true },
  { id: 'entretien', label: 'Entretien pharmaceutique annuel', done: true },
  { id: 'depistage', label: 'Dépistage selon votre profil', done: false },
]

function todayLabel(): string {
  const s = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(),
  )
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function HomePage() {
  const navigate = useNavigate()

  const affiliations = useQuery({ queryKey: ['affiliations'], queryFn: listAffiliations })
  const referenceId = affiliations.data?.find((a) => a.type === 'REFERENCE')?.pharmacyId
  const reference = useQuery({
    queryKey: ['pharmacy', referenceId],
    queryFn: () => getPharmacy(referenceId!),
    enabled: Boolean(referenceId),
  })

  const missions = useQuery({ queryKey: ['missions'], queryFn: listMissions })
  const missionsTodo = (missions.data ?? []).filter((m) => PATIENT_ACTIONABLE.includes(m.state)).length

  const loyalty = useQuery({ queryKey: ['loyalty'], queryFn: getLoyalty })
  const banners = useQuery({ queryKey: ['home-banners'], queryFn: getHomeBanners })

  const events = useQuery({ queryKey: ['care-events'], queryFn: listCareEvents })
  const month = new Date().getMonth() + 1
  const monthEvents = (events.data ?? []).filter((e) => e.month === month)
  const highlight =
    monthEvents.find((e) => e.category === 'VACCINATION') ?? monthEvents[0] ?? (events.data ?? [])[0]

  return (
    <div className="page">
      <header className="screen-head">
        <LigneDeVieAnimee width={150} />
        <h1>Bonjour</h1>
        <span className="eyebrow">{todayLabel()}</span>
      </header>

      {banners.data && banners.data.length > 0 ? <HomeCarousel banners={banners.data} /> : null}

      {reference.data ? (
        <button
          className="hero"
          style={{ textAlign: 'left', border: 0, cursor: 'pointer', width: '100%' }}
          onClick={() => navigate(`/pharmacies/${reference.data!.id}`)}
        >
          <div className="label">Ma pharmacie</div>
          <div className="value">{reference.data.name}</div>
          <div className="sub">
            <span className={`status-dot${reference.data.isOpen ? '' : ' closed'}`} aria-hidden="true" />
            {reference.data.city} · {reference.data.isOpen ? 'Ouverte' : 'Fermée'}
          </div>
        </button>
      ) : (
        <div className="card stack">
          <strong>Choisissez votre pharmacie</strong>
          <p className="muted">Affiliez-vous à votre officine pour accéder à tous les services.</p>
          <button className="btn" onClick={() => navigate('/pharmacies')}>
            <Search size={18} aria-hidden="true" /> Trouver une pharmacie
          </button>
        </div>
      )}

      <Reveal delay={0.02}>
        <div className="section">
          <h2 className="section-title">Mes missions</h2>
          <button className="list-row" onClick={() => navigate('/missions')}>
            <span className="tile-ico">
              <ClipboardList aria-hidden="true" />
            </span>
            <span className="grow">
              <span className="t">
                {missionsTodo > 0
                  ? `${missionsTodo} mission${missionsTodo > 1 ? 's' : ''} à faire`
                  : 'Vous êtes à jour'}
              </span>
              <span className="d">Proposées par votre pharmacien · à votre rythme</span>
            </span>
            <ChevronRight className="chev" aria-hidden="true" />
          </button>
        </div>
      </Reveal>

      {loyalty.data ? (
        <Reveal delay={0.04}>
          <div className="section">
            <h2 className="section-title">Ma carte de fidélité</h2>
            <button className="list-row" onClick={() => navigate('/fidelite')}>
              <span className="tile-ico">
                <CreditCard aria-hidden="true" />
              </span>
              <span className="grow">
                <span className="t">{loyalty.data.points.toLocaleString('fr-FR')} points</span>
                <span className="d">
                  {loyalty.data.tier ? `Niveau ${loyalty.data.tier} · ` : ''}Voir mes avantages
                </span>
              </span>
              <ChevronRight className="chev" aria-hidden="true" />
            </button>
          </div>
        </Reveal>
      ) : null}

      <Reveal delay={0.06}>
        <div className="section">
          <h2 className="section-title">Ma prévention</h2>
          <BouclierPrevention items={PREVENTION_ITEMS} />
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="section">
          <h2 className="section-title">Services</h2>
          <div className="tiles">
            {TILES.map((t) => {
              const Icon = t.Icon
              return (
                <button key={t.to} className="tile" onClick={() => navigate(t.to)}>
                  <span className="tile-ico">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="t">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </Reveal>

      {highlight ? (
        <Reveal delay={0.12}>
          <div className="section">
            <h2 className="section-title">Temps fort prévention</h2>
            <button className="list-row" onClick={() => navigate('/prevention')}>
            <span className="tile-ico">
              <ShieldPlus aria-hidden="true" />
            </span>
            <span className="grow">
              <span className="t">{highlight.title}</span>
              <span className="d">
                {CARE_EVENT_CATEGORY_LABELS[highlight.category]} · {MONTH_LABELS[highlight.month - 1]}
              </span>
            </span>
            <ChevronRight className="chev" aria-hidden="true" />
          </button>
          </div>
        </Reveal>
      ) : null}

      <Reveal delay={0.16}>
        <div className="section">
          <ReseauVivant />
        </div>
      </Reveal>
    </div>
  )
}
