import { useNavigate } from 'react-router-dom'
import { CalendarPlus, ChevronRight, ClipboardList, MessageCircle } from 'lucide-react'
import { ScreenHeader } from '../components/ScreenHeader'

const ITEMS = [
  {
    to: '/conseil',
    Icon: MessageCircle,
    t: 'Demander un conseil',
    d: 'Une question santé ? Votre pharmacien vous répond, en toute confidentialité.',
  },
  {
    to: '/rendez-vous',
    Icon: CalendarPlus,
    t: 'Prendre rendez-vous',
    d: 'Vaccination, entretien, test rapide…',
  },
  {
    to: '/entretiens',
    Icon: ClipboardList,
    t: 'Entretiens pharmaceutiques',
    d: 'Votre suivi personnalisé, étape par étape.',
  },
]

export function SoinsPage() {
  const navigate = useNavigate()
  return (
    <div className="page">
      <ScreenHeader eyebrow="Avec votre pharmacien" title="Mes soins" />
      <div className="section">
        {ITEMS.map((it) => {
          const Icon = it.Icon
          return (
            <button key={it.to} className="list-row" onClick={() => navigate(it.to)}>
              <span className="tile-ico">
                <Icon aria-hidden="true" />
              </span>
              <span className="grow">
                <span className="t">{it.t}</span>
                <span className="d">{it.d}</span>
              </span>
              <ChevronRight className="chev" aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
