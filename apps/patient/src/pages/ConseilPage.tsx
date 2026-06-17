import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adviceStatusLabel } from '@wellpharma/shared'
import { createAdvice, listMyAdvice } from '../data/adviceService'
import { getPharmacy, listAffiliations } from '../data/pharmacyService'
import { ScreenHeader } from '../components/ScreenHeader'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateFormatter.format(d)
}

export function ConseilPage() {
  const qc = useQueryClient()

  const affiliations = useQuery({ queryKey: ['affiliations'], queryFn: listAffiliations })
  const referenceId = affiliations.data?.find((a) => a.type === 'REFERENCE')?.pharmacyId
  const reference = useQuery({
    queryKey: ['pharmacy', referenceId],
    queryFn: () => getPharmacy(referenceId!),
    enabled: Boolean(referenceId),
  })

  const myAdvice = useQuery({ queryKey: ['my-advice'], queryFn: listMyAdvice })

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  const createMut = useMutation({
    mutationFn: () => createAdvice({ pharmacyId: referenceId!, subject: subject.trim(), body: body.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-advice'] })
      setSubject('')
      setBody('')
      setSent(true)
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!referenceId || !subject.trim() || !body.trim()) return
    setSent(false)
    createMut.mutate()
  }

  const canSubmit =
    Boolean(referenceId) && subject.trim().length > 0 && body.trim().length > 0 && !createMut.isPending

  return (
    <div className="page">
      <ScreenHeader
        eyebrow="Avec votre pharmacien"
        title="Demande de conseil"
        back="/soins"
      />
      <p className="muted">
        Poser une question de santé à son pharmacien, en toute confidentialité.
      </p>

      {affiliations.isLoading ? (
        <section className="card">
          <p className="muted">Chargement…</p>
        </section>
      ) : !referenceId ? (
        <section className="card stack">
          <h2>Aucune pharmacie de référence</h2>
          <p className="muted">
            Choisir d’abord une pharmacie de référence pour lui adresser une demande de conseil.
          </p>
          <Link className="btn" to="/pharmacies">
            Choisir une pharmacie
          </Link>
        </section>
      ) : (
        <section className="card stack">
          <h2>Nouvelle demande</h2>
          {reference.data ? (
            <p className="muted">
              Destinataire : <strong>{reference.data.name}</strong>
              {reference.data.city ? ` · ${reference.data.city}` : ''}
            </p>
          ) : null}

          <form className="stack" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="advice-subject">Objet</label>
              <input
                id="advice-subject"
                className="input"
                type="text"
                value={subject}
                maxLength={120}
                placeholder="Ex. : interaction entre deux médicaments"
                onChange={(e) => {
                  setSubject(e.target.value)
                  setSent(false)
                }}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="advice-body">Message</label>
              <textarea
                id="advice-body"
                className="input textarea"
                value={body}
                rows={5}
                placeholder="Décrire la situation ou la question…"
                onChange={(e) => {
                  setBody(e.target.value)
                  setSent(false)
                }}
                required
              />
            </div>

            <p className="muted secure-note">
              🔒 Votre demande est chiffrée et transmise de façon sécurisée à votre pharmacie.
            </p>

            {createMut.isError ? (
              <p className="error" role="alert">
                L’envoi a échoué. Merci de réessayer.
              </p>
            ) : null}
            {sent && !createMut.isPending ? (
              <p className="status-open" role="status">
                ✅ Demande envoyée à votre pharmacie.
              </p>
            ) : null}

            <button type="submit" className="btn" disabled={!canSubmit}>
              {createMut.isPending ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </form>
        </section>
      )}

      <section className="card stack">
        <h2>Mes demandes</h2>
        {myAdvice.isLoading ? (
          <p className="muted">Chargement…</p>
        ) : myAdvice.data && myAdvice.data.length > 0 ? (
          <ul className="record-list">
            {myAdvice.data.map((a) => (
              <li key={a.id} className="record-card">
                <div className="record-head">
                  <strong>{a.subject}</strong>
                  <span className="badge">{adviceStatusLabel(a.status)}</span>
                </div>
                <span className="muted">{formatDate(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Aucune demande pour le moment.</p>
        )}
      </section>
    </div>
  )
}
