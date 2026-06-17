import { useQuery } from '@tanstack/react-query'
import { Gift, Sparkles, TrendingUp } from 'lucide-react'
import { ScreenHeader } from '../components/ScreenHeader'
import { Reveal } from '../components/Reveal'
import { getLoyalty } from '../data/loyaltyService'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

export function FidelitePage() {
  const loyalty = useQuery({ queryKey: ['loyalty'], queryFn: getLoyalty })
  const card = loyalty.data

  return (
    <div className="page">
      <ScreenHeader eyebrow="Avantages" title="Ma carte de fidélité" />

      {loyalty.isLoading ? (
        <p className="muted">Chargement…</p>
      ) : !card ? (
        <div className="card stack">
          <strong>Pas encore de carte</strong>
          <p className="muted">
            Demandez votre carte de fidélité Wellpharma à votre pharmacien pour cumuler des points.
          </p>
        </div>
      ) : (
        <>
          <Reveal>
            <div className="loyalty-card">
              <div className="loyalty-top">
                <span className="loyalty-brand">wellpharma</span>
                {card.tier ? <span className="loyalty-tier">{card.tier}</span> : null}
              </div>
              <div className="loyalty-points">
                <span className="loyalty-points-val">{card.points.toLocaleString('fr-FR')}</span>
                <span className="loyalty-points-lbl">points</span>
              </div>
              {card.cardNumber ? <span className="loyalty-num">{card.cardNumber}</span> : null}
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="card loyalty-hint">
              <span className="tile-ico">
                <Sparkles aria-hidden="true" />
              </span>
              <p className="muted" style={{ margin: 0 }}>
                Gagnez des points à chaque entretien, vaccination ou achat, et transformez-les en
                avantages en pharmacie.
              </p>
            </div>
          </Reveal>

          {card.transactions.length > 0 ? (
            <div className="section">
              <h2 className="section-title">Historique</h2>
              {card.transactions.map((t, i) => (
                <Reveal key={t.id} delay={0.04 * i}>
                  <div className="loyalty-row">
                    <span className={`loyalty-row-ico${t.points < 0 ? ' minus' : ''}`}>
                      {t.points < 0 ? <Gift aria-hidden="true" /> : <TrendingUp aria-hidden="true" />}
                    </span>
                    <span className="grow">
                      <span className="t">{t.label}</span>
                      <span className="d">{formatDate(t.createdAt)}</span>
                    </span>
                    <span className={`loyalty-delta${t.points < 0 ? ' minus' : ''}`}>
                      {t.points > 0 ? '+' : ''}
                      {t.points.toLocaleString('fr-FR')}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
