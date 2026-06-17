import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, ChevronRight, Download, LogOut, ShieldCheck, Store } from 'lucide-react'
import { ScreenHeader } from '../components/ScreenHeader'
import { WellpharmaLogo } from '../components/WellpharmaLogo'
import { useAuth } from '../providers/AuthProvider'
import { isDemoEnabled } from '../lib/demo'
import { isWebPushSupported, registerWebPush, showLocalNotification } from '../lib/push'
import { getPharmacy, listAffiliations } from '../data/pharmacyService'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

export function ProfilPage() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const affiliations = useQuery({ queryKey: ['affiliations'], queryFn: listAffiliations })
  const referenceId = affiliations.data?.find((a) => a.type === 'REFERENCE')?.pharmacyId
  const reference = useQuery({
    queryKey: ['pharmacy', referenceId],
    queryFn: () => getPharmacy(referenceId!),
    enabled: Boolean(referenceId),
  })

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [notifMsg, setNotifMsg] = useState<string | null>(null)
  const [notifEnabled, setNotifEnabled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function enableNotifs() {
    const sub = await registerWebPush()
    if (sub) {
      setNotifEnabled(true)
      setNotifMsg('Notifications activées ✓')
      await showLocalNotification('Wellpharma', 'Vos notifications sont activées 🔔')
    } else {
      setNotifMsg('Non activées (permission refusée ou non supporté).')
    }
  }

  return (
    <div className="page">
      <ScreenHeader eyebrow="Mon compte" title="Profil" lifeline />

      <div className="card stack">
        <div className="muted" style={{ fontSize: 13 }}>Connecté</div>
        <strong style={{ fontSize: 16 }}>{session?.user.email ?? '—'}</strong>
        <span className="chip">{isDemoEnabled() ? 'Patient · mode démo' : 'Patient'}</span>
      </div>

      <div className="section">
        <h2 className="section-title">Ma pharmacie</h2>
        <button className="list-row" onClick={() => navigate('/pharmacies')}>
          <span className="tile-ico">
            <Store aria-hidden="true" />
          </span>
          <span className="grow">
            <span className="t">{reference.data ? reference.data.name : 'Choisir ma pharmacie'}</span>
            <span className="d">
              {reference.data ? `${reference.data.city} · pharmacie de référence` : 'Aucune pharmacie de référence'}
            </span>
          </span>
          <ChevronRight className="chev" aria-hidden="true" />
        </button>
      </div>

      <div className="section">
        <h2 className="section-title">Préférences</h2>
        {isWebPushSupported() ? (
          <button className="list-row" onClick={enableNotifs}>
            <span className="tile-ico">
              <Bell aria-hidden="true" />
            </span>
            <span className="grow">
              <span className="t">Notifications</span>
              <span className="d">{notifMsg ?? 'Rappels et alertes de votre pharmacie'}</span>
            </span>
            <ChevronRight className="chev" aria-hidden="true" />
          </button>
        ) : null}
        {notifEnabled ? (
          <button
            className="list-row"
            onClick={() => void showLocalNotification('Wellpharma', 'Ceci est une notification de test 🔔')}
          >
            <span className="tile-ico">
              <Bell aria-hidden="true" />
            </span>
            <span className="grow">
              <span className="t">Recevoir une notification de test</span>
              <span className="d">Vérifiez l’affichage des notifications</span>
            </span>
            <ChevronRight className="chev" aria-hidden="true" />
          </button>
        ) : null}
        {installPrompt ? (
          <button className="list-row" onClick={() => void installPrompt.prompt()}>
            <span className="tile-ico">
              <Download aria-hidden="true" />
            </span>
            <span className="grow">
              <span className="t">Installer l’application</span>
              <span className="d">Accès rapide depuis votre écran d’accueil</span>
            </span>
            <ChevronRight className="chev" aria-hidden="true" />
          </button>
        ) : null}
        <div className="list-row" style={{ cursor: 'default' }}>
          <span className="tile-ico">
            <ShieldCheck aria-hidden="true" />
          </span>
          <span className="grow">
            <span className="t">Confidentialité</span>
            <span className="d">Vos données de santé sont chiffrées et chaque accès est tracé.</span>
          </span>
        </div>
      </div>

      <button className="btn btn-outline" onClick={() => void signOut()}>
        <LogOut size={18} aria-hidden="true" /> Se déconnecter
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 8px' }}>
        <WellpharmaLogo height={92} />
      </div>
    </div>
  )
}
