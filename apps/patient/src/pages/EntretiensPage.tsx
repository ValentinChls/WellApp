import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInterviewTemplate } from '@wellpharma/shared'
import { getConsents, setConsent } from '../data/consentService'
import { listMyInterviews, listTemplates } from '../data/interviewService'
import { ScreenHeader } from '../components/ScreenHeader'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  IN_PROGRESS: 'Brouillon',
  COMPLETED: 'Terminé',
}

export function EntretiensPage() {
  const qc = useQueryClient()
  const consents = useQuery({ queryKey: ['consents'], queryFn: getConsents })
  const hasHealth = consents.data?.HEALTH_DATA === true
  const grant = useMutation({
    mutationFn: () => setConsent('HEALTH_DATA', true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consents'] }),
  })
  const mine = useQuery({ queryKey: ['my-interviews'], queryFn: listMyInterviews, enabled: hasHealth })

  return (
    <div className="page">
      <ScreenHeader eyebrow="Avec votre pharmacien" title="Entretiens" back="/soins" />
      <p className="muted">Un échange structuré avec son pharmacien, en toute confidentialité.</p>

      {consents.isLoading ? (
        <p className="muted">Chargement…</p>
      ) : !hasHealth ? (
        <section className="card stack">
          <h2>Consentement requis</h2>
          <p className="muted">
            L’entretien recueille des données de santé. Le consentement est nécessaire avant
            d’ouvrir le formulaire. Les réponses sont chiffrées et chaque accès est tracé.
          </p>
          <button className="btn" disabled={grant.isPending} onClick={() => grant.mutate()}>
            {grant.isPending ? 'Enregistrement…' : 'Donner mon consentement'}
          </button>
        </section>
      ) : (
        <>
          <section className="card stack">
            <h2>Nouvel entretien</h2>
            {listTemplates().map((t) => (
              <Link key={t.code} className="btn btn-outline" to={`/entretiens/nouveau/${t.code}`}>
                {t.label}
              </Link>
            ))}
          </section>

          <section className="card stack">
            <h2>Mes entretiens</h2>
            {mine.isLoading ? (
              <p className="muted">Chargement…</p>
            ) : (mine.data ?? []).length === 0 ? (
              <p className="muted">Aucun entretien pour le moment.</p>
            ) : (
              (mine.data ?? []).map((i) => {
                const tpl = i.templateCode ? getInterviewTemplate(i.templateCode) : undefined
                return (
                  <Link key={i.id} className="pharma-card" to={`/entretiens/${i.id}`}>
                    <div className="pharma-card-head">
                      <strong>{tpl?.label ?? i.type}</strong>
                      <span className="badge">{STATUS_LABEL[i.status] ?? i.status}</span>
                    </div>
                    <div className="muted">
                      {i.completedAt
                        ? `Terminé le ${new Date(i.completedAt).toLocaleDateString('fr-FR')}`
                        : i.startedAt
                          ? `Débuté le ${new Date(i.startedAt).toLocaleDateString('fr-FR')}`
                          : 'Brouillon'}
                    </div>
                  </Link>
                )
              })
            )}
          </section>
        </>
      )}
    </div>
  )
}
