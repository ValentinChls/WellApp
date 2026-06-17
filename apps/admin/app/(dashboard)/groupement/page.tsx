import Link from 'next/link'
import { BarChart3, Database, Megaphone, Store } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const LINKS = [
  { href: '/', icon: BarChart3, title: 'Tableau de bord', desc: 'Indicateurs du groupement et par officine.' },
  { href: '/pharmacies', icon: Store, title: 'Pharmacies', desc: 'Les officines du groupement.' },
  { href: '/campagnes', icon: Megaphone, title: 'Campagnes', desc: 'Notifications génériques aux patients.' },
  { href: '/donnees', icon: Database, title: 'Données & conformité', desc: 'Audit, marronnier, protection des données.' },
]

export default function GroupementPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">Groupement</h1>
        <p className="text-sm text-muted-foreground">
          Pilotage de l’ensemble du réseau Wellpharma.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LINKS.map((l) => {
          const Icon = l.icon
          return (
            <Link key={l.href} href={l.href} className="group">
              <Card className="transition-colors group-hover:bg-accent/5">
                <CardHeader className="flex flex-row items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">{l.title}</CardTitle>
                    <CardDescription>{l.desc}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
