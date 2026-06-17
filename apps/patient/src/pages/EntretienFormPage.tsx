import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getInterviewTemplate } from '@wellpharma/shared'
import { getInterview, saveDraft, submitInterview } from '../data/interviewService'
import { listAffiliations } from '../data/pharmacyService'
import { InterviewForm } from '../components/InterviewForm'
import { ScreenHeader } from '../components/ScreenHeader'
import { SuccessBurst } from '../components/SuccessBurst'

export function EntretienFormPage() {
  const { templateCode, id } = useParams()
  const navigate = useNavigate()

  const affiliations = useQuery({ queryKey: ['affiliations'], queryFn: listAffiliations })
  const refId = affiliations.data?.find((a) => a.type === 'REFERENCE')?.pharmacyId

  const existing = useQuery({
    queryKey: ['interview', id],
    queryFn: () => getInterview(id as string),
    enabled: Boolean(id),
  })

  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [currentId, setCurrentId] = useState<string | undefined>(id)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => {
    if (existing.data) setAnswers(existing.data.answers ?? {})
  }, [existing.data])

  const tplCode = id ? (existing.data?.templateCode ?? undefined) : templateCode
  const template = tplCode ? getInterviewTemplate(tplCode) : undefined
  const readOnly = existing.data?.status === 'COMPLETED'

  async function save(thenSubmit: boolean) {
    if (!template) return
    const pharmacyId = refId
    if (!pharmacyId && !currentId) {
      setMessage('Choisissez d’abord une pharmacie de référence.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await saveDraft({
        id: currentId,
        pharmacyId: pharmacyId ?? '',
        templateCode: template.code,
        answers,
      })
      setCurrentId(res.id)
      if (thenSubmit) {
        await submitInterview(res.id)
        setCelebrate(true)
        return
      }
      setMessage('Brouillon enregistré ✅')
    } catch {
      setMessage('Une erreur est survenue lors de l’enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  if (id && existing.isLoading) {
    return (
      <div className="page">
        <p className="muted">Chargement…</p>
      </div>
    )
  }
  if (!template) {
    return (
      <div className="page">
        <ScreenHeader title="Entretien" back="/entretiens" />
        <p className="muted">Modèle d’entretien introuvable.</p>
      </div>
    )
  }
  if (!refId && !id) {
    return (
      <div className="page">
        <ScreenHeader title="Entretien" back="/entretiens" />
        <p className="muted">Choisissez d’abord une pharmacie de référence depuis l’accueil.</p>
      </div>
    )
  }

  return (
    <div className="page">
      {celebrate ? (
        <SuccessBurst
          title="Entretien finalisé"
          subtitle="Votre pharmacien en est informé."
          onClose={() => navigate('/entretiens')}
        />
      ) : null}
      <ScreenHeader title={template.label} back="/entretiens" />
      {template.description ? <p className="muted">{template.description}</p> : null}

      <InterviewForm
        template={template}
        answers={answers}
        onChange={(fieldId, value) => setAnswers((a) => ({ ...a, [fieldId]: value }))}
        readOnly={readOnly}
      />

      {readOnly ? (
        <p className="muted">Entretien finalisé — lecture seule.</p>
      ) : (
        <div className="stack">
          {message ? (
            <p className="muted" role="status">
              {message}
            </p>
          ) : null}
          <button className="btn btn-outline" disabled={saving} onClick={() => save(false)}>
            Enregistrer le brouillon
          </button>
          <button className="btn" disabled={saving} onClick={() => save(true)}>
            Finaliser l’entretien
          </button>
          <p className="secure-note">
            Réponses chiffrées · la pharmacie est notifiée par lien sécurisé à la finalisation.
          </p>
        </div>
      )}
    </div>
  )
}
