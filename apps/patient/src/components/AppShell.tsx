import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Bot, HeartHandshake, Home, ShieldPlus, User } from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { WellpharmaLogo } from './WellpharmaLogo'

interface Tab {
  to: string
  label: string
  Icon: typeof Home
  match: (path: string) => boolean
}

const TABS: Tab[] = [
  { to: '/', label: 'Accueil', Icon: Home, match: (p) => p === '/' || p.startsWith('/pharmacies') },
  {
    to: '/soins',
    label: 'Mes soins',
    Icon: HeartHandshake,
    match: (p) => ['/soins', '/conseil', '/rendez-vous', '/entretiens'].some((x) => p.startsWith(x)),
  },
  {
    to: '/prevention',
    label: 'Prévention',
    Icon: ShieldPlus,
    match: (p) => p.startsWith('/prevention') || p.startsWith('/calendrier'),
  },
  { to: '/profil', label: 'Profil', Icon: User, match: (p) => p.startsWith('/profil') },
]

/**
 * Coquille de l'application patient : contenu animé (transition d'onglet),
 * barre de navigation basse persistante (4 onglets) et FAB Assistant.
 * `reducedMotion="user"` neutralise les animations si l'utilisateur le demande.
 */
export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const onAssistant = path.startsWith('/assistant')

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <header className="app-bar">
          <Link to="/" className="app-bar-logo" aria-label="Accueil Wellpharma">
            <WellpharmaLogo height={34} />
          </Link>
        </header>

        <div className="app-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {!onAssistant ? (
          <button className="fab" aria-label="Assistant pratique" onClick={() => navigate('/assistant')}>
            <Bot aria-hidden="true" />
          </button>
        ) : null}

        <nav className="bottom-nav" aria-label="Navigation principale">
          {TABS.map((t) => {
            const active = t.match(path)
            const Icon = t.Icon
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`nav-item${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="navBlob"
                    className="nav-blob"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="nav-ico">
                  <Icon aria-hidden="true" />
                </span>
                {t.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </MotionConfig>
  )
}
