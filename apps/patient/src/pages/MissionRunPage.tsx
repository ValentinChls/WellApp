import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Check, Clock, Pencil, Type, Users, Volume2, X } from 'lucide-react'
import {
  answeredCount,
  isAnswered,
  missionInputSteps,
  type MissionStep,
} from '@wellpharma/shared'
import { LigneDeVieAnimee } from '../components/LigneDeVieAnimee'
import { Confetti } from '../components/Confetti'
import { getMission, saveAnswer, submitMission } from '../data/missionService'

const DONE_STATES = ['COMPLETEE', 'A_VALIDER', 'VALIDEE', 'FACTUREE']
const SCALE_KEY = 'wp-mission-textscale'

function speak(text: string) {
  try {
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'fr-FR'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {
    /* lecture vocale indisponible */
  }
}

/** Réponse lisible pour le récap. */
function formatAnswer(v: unknown): string {
  if (v === true) return 'Oui'
  if (v === false) return 'Non'
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  if (v === '' || v === null || v === undefined) return '—'
  return String(v)
}

export function MissionRunPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const reduce = useReducedMotion()

  const mission = useQuery({ queryKey: ['mission', id], queryFn: () => getMission(id as string), enabled: Boolean(id) })
  const template = mission.data?.template

  const [phase, setPhase] = useState<'accueil' | 'run' | 'recap' | 'fin'>('accueil')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [saved, setSaved] = useState(false)
  const [large, setLarge] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SCALE_KEY) === 'large'
    } catch {
      return false
    }
  })
  const [aidant, setAidant] = useState(false)

  useEffect(() => {
    if (mission.data) setAnswers(mission.data.answers ?? {})
  }, [mission.data])

  function toggleScale() {
    setLarge((v) => {
      const next = !v
      try {
        localStorage.setItem(SCALE_KEY, next ? 'large' : 'normal')
      } catch {
        /* stockage indisponible */
      }
      return next
    })
  }

  const isDone = mission.data ? DONE_STATES.includes(mission.data.state) : false

  const resumeIndex = useMemo(() => {
    if (!template) return 0
    const answered = template.steps.filter((s) => s.kind !== 'info' && isAnswered(answers[s.id])).length
    if (answered === 0) return 0
    const i = template.steps.findIndex((s) => s.kind !== 'info' && !isAnswered(answers[s.id]))
    return i === -1 ? 0 : i
  }, [template, answers])

  const rootClass = `mission-run${large ? ' scale-lg' : ''}`

  if (mission.isLoading) {
    return <div className="mission-run"><div className="mission-run-body"><p className="muted">Chargement…</p></div></div>
  }
  if (!mission.data || !template) {
    return (
      <div className="mission-run">
        <div className="mission-run-body">
          <p className="muted">Mission introuvable.</p>
          <button className="btn" onClick={() => navigate('/missions')}>Retour</button>
        </div>
      </div>
    )
  }

  const steps = template.steps
  const total = steps.length
  const inputTotal = missionInputSteps(template).length
  const progressPct = Math.round((answeredCount(template, answers) / Math.max(1, inputTotal)) * 100)

  async function persist(stepId: string, value: unknown) {
    setAnswers((a) => ({ ...a, [stepId]: value }))
    setSaved(false)
    await saveAnswer(mission.data!.id, stepId, value)
    setSaved(true)
  }

  function goNext() {
    if (stepIndex + 1 < total) {
      setStepIndex((i) => i + 1)
      setSaved(false)
    } else {
      setPhase('recap') // récap avant envoi
    }
  }

  function goBack() {
    if (stepIndex === 0) setPhase('accueil')
    else setStepIndex((i) => i - 1)
  }

  async function commit(stepId: string, value: unknown, advance = true) {
    await persist(stepId, value)
    if (advance) goNext()
  }

  async function finish() {
    const res = await submitMission(mission.data!.id)
    if (res.ok) {
      void qc.invalidateQueries({ queryKey: ['missions'] })
      setPhase('fin')
    }
  }

  const ScaleButton = (
    <button
      className={`mission-scale-toggle${large ? ' is-on' : ''}`}
      aria-label="Agrandir le texte"
      aria-pressed={large}
      onClick={toggleScale}
    >
      <Type size={16} aria-hidden="true" /> {large ? 'A' : 'A+'}
    </button>
  )

  // ─────────────────────────── Écran d'accueil
  if (phase === 'accueil') {
    return (
      <div className={rootClass}>
        <header className="mission-run-top">
          <button className="mission-x" aria-label="Fermer" onClick={() => navigate('/missions')}>
            <X size={20} aria-hidden="true" />
          </button>
          <span className="grow" />
          {ScaleButton}
        </header>
        <div className="mission-run-body mission-intro">
          <LigneDeVieAnimee width={150} />
          <span className="mission-intro-ico" style={{ background: `${template.accent}1a`, color: template.accent }}>
            <Clock aria-hidden="true" />
          </span>
          <span className="eyebrow">{mission.data.pharmacistName} · votre pharmacien</span>
          <h1>{template.title}</h1>
          <p className="mission-intro-pitch">{template.pitch}</p>
          <ul className="mission-reassure">
            <li>⏱ Environ {template.estimatedMin} minutes</li>
            <li>⏸ Vous pouvez faire une pause et reprendre</li>
            <li>🔒 Vos réponses restent confidentielles</li>
          </ul>
          {!isDone ? (
            <button className={`mission-aidant${aidant ? ' is-on' : ''}`} onClick={() => setAidant((v) => !v)}>
              <Users size={16} aria-hidden="true" />
              {aidant ? 'Vous aidez un proche ✓' : 'Je remplis pour un proche'}
            </button>
          ) : null}
        </div>
        <footer className="mission-run-foot">
          {isDone ? (
            <button className="btn btn-lg" onClick={() => navigate('/missions')}>Retour</button>
          ) : (
            <button
              className="btn btn-lg"
              onClick={() => {
                setStepIndex(resumeIndex)
                setPhase('run')
              }}
            >
              {answeredCount(template, answers) > 0 ? 'Reprendre' : 'Commencer'}
            </button>
          )}
        </footer>
      </div>
    )
  }

  // ─────────────────────────── Récap avant envoi
  if (phase === 'recap') {
    const inputSteps = missionInputSteps(template).filter((s) => s.kind !== 'consent')
    return (
      <div className={rootClass}>
        <header className="mission-run-top">
          <button className="mission-x" aria-label="Retour" onClick={() => { setStepIndex(total - 1); setPhase('run') }}>
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <span className="grow" />
          {ScaleButton}
        </header>
        <div className="mission-run-body">
          <h1 className="mission-q">Vérifiez vos réponses</h1>
          <p className="mission-help">Vous pouvez modifier avant d’envoyer à votre pharmacien.</p>
          {aidant ? <div className="mission-aidant-banner"><Users size={15} aria-hidden="true" /> Réponses saisies avec un proche</div> : null}
          <dl className="mission-recap">
            {inputSteps.map((s) => {
              const idx = steps.findIndex((x) => x.id === s.id)
              return (
                <div key={s.id} className="mission-recap-row">
                  <div className="grow">
                    <dt>{s.prompt}</dt>
                    <dd>{formatAnswer(answers[s.id])}</dd>
                  </div>
                  <button className="mission-recap-edit" aria-label="Modifier" onClick={() => { setStepIndex(idx); setPhase('run') }}>
                    <Pencil size={15} aria-hidden="true" /> Modifier
                  </button>
                </div>
              )
            })}
          </dl>
        </div>
        <footer className="mission-run-foot">
          <button className="btn btn-lg" onClick={() => void finish()}>
            <Check size={18} aria-hidden="true" /> Confirmer et envoyer
          </button>
        </footer>
      </div>
    )
  }

  // ─────────────────────────── Écran de fin
  if (phase === 'fin') {
    return (
      <div className={`${rootClass} mission-done`}>
        <Confetti count={42} />
        <div className="mission-run-body mission-intro">
          <motion.span
            className="mission-done-check"
            initial={reduce ? false : { scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 16 }}
          >
            <Check size={40} aria-hidden="true" />
          </motion.span>
          <h1>{template.doneTitle}</h1>
          <p className="mission-intro-pitch">{template.doneBody}</p>
          <LigneDeVieAnimee width={170} loop={false} />
        </div>
        <footer className="mission-run-foot">
          <button className="btn btn-lg" onClick={() => navigate('/missions')}>Terminé</button>
        </footer>
      </div>
    )
  }

  // ─────────────────────────── Parcours (1 question / écran)
  const step = steps[stepIndex]!

  return (
    <div className={rootClass}>
      <header className="mission-run-top">
        <button className="mission-x" aria-label="Précédent" onClick={goBack}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div className="mission-progress" aria-hidden="true">
          <motion.div
            className="mission-progress-fill"
            style={{ background: template.accent }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {ScaleButton}
        <button className="mission-x" aria-label="Fermer" onClick={() => navigate('/missions')}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      {aidant ? <div className="mission-aidant-banner"><Users size={15} aria-hidden="true" /> Vous remplissez pour un proche</div> : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          className="mission-run-body"
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.22 }}
        >
          <div className="mission-q-head">
            <h1 className="mission-q">{step.prompt}</h1>
            <button className="mission-speak" aria-label="Écouter la question" onClick={() => speak(step.prompt)}>
              <Volume2 size={18} aria-hidden="true" />
            </button>
          </div>
          {step.help ? <p className="mission-help">{step.help}</p> : null}

          <StepInput step={step} value={answers[step.id]} accent={template.accent} onCommit={commit} onChange={persist} />
        </motion.div>
      </AnimatePresence>

      <footer className="mission-run-foot mission-run-foot-row">
        <button className="mission-prev" onClick={goBack}>
          <ArrowLeft size={16} aria-hidden="true" /> Précédent
        </button>
        <span className={`mission-saved${saved ? ' is-on' : ''}`}>
          {saved ? '✓ enregistré' : ''}
        </span>
      </footer>
    </div>
  )
}

// ─────────────────────────── Rendu d'une étape selon son type
function StepInput({
  step,
  value,
  accent,
  onCommit,
  onChange,
}: {
  step: MissionStep
  value: unknown
  accent: string
  onCommit: (stepId: string, value: unknown, advance?: boolean) => void | Promise<void>
  onChange: (stepId: string, value: unknown) => void | Promise<void>
}) {
  const [draft, setDraft] = useState<string>(typeof value === 'string' ? value : '')
  const [multi, setMulti] = useState<string[]>(Array.isArray(value) ? (value as string[]) : [])

  switch (step.kind) {
    case 'info':
      return (
        <button className="btn btn-lg" style={{ marginTop: 8 }} onClick={() => onCommit(step.id, true, true)}>
          Continuer
        </button>
      )

    case 'single':
      return (
        <div className="mission-opts">
          {step.options.map((opt) => (
            <button
              key={opt}
              className={`mission-opt${value === opt ? ' is-sel' : ''}`}
              style={value === opt ? { borderColor: accent, color: accent } : undefined}
              onClick={() => onCommit(step.id, opt, true)}
            >
              {opt}
            </button>
          ))}
        </div>
      )

    case 'boolean':
      return (
        <div className="mission-opts mission-opts-row">
          <button className="mission-opt" onClick={() => onCommit(step.id, true, true)}>Oui</button>
          <button className="mission-opt" onClick={() => onCommit(step.id, false, true)}>Non</button>
        </div>
      )

    case 'multi':
      return (
        <div className="stack">
          <div className="mission-opts">
            {step.options.map((opt) => {
              const sel = multi.includes(opt)
              return (
                <button
                  key={opt}
                  className={`mission-opt${sel ? ' is-sel' : ''}`}
                  style={sel ? { borderColor: accent, color: accent } : undefined}
                  onClick={() => {
                    const next = sel ? multi.filter((x) => x !== opt) : [...multi, opt]
                    setMulti(next)
                    void onChange(step.id, next)
                  }}
                >
                  {sel ? '✓ ' : ''}{opt}
                </button>
              )
            })}
          </div>
          <button className="btn btn-lg" disabled={step.required && multi.length === 0} onClick={() => onCommit(step.id, multi, true)}>
            Continuer
          </button>
        </div>
      )

    case 'scale': {
      const nums = Array.from({ length: step.max - step.min + 1 }, (_, i) => step.min + i)
      return (
        <div className="stack">
          <div className="mission-scale">
            {nums.map((n) => (
              <button
                key={n}
                className={`mission-scale-n${value === n ? ' is-sel' : ''}`}
                style={value === n ? { background: accent, borderColor: accent, color: '#fff' } : undefined}
                onClick={() => onCommit(step.id, n, true)}
              >
                {n}
              </button>
            ))}
          </div>
          {step.minLabel || step.maxLabel ? (
            <div className="mission-scale-labels">
              <span>{step.minLabel}</span>
              <span>{step.maxLabel}</span>
            </div>
          ) : null}
        </div>
      )
    }

    case 'number':
      return (
        <div className="stack">
          <input
            className="input mission-input"
            type="number"
            inputMode="numeric"
            value={draft}
            placeholder="0"
            onChange={(e) => setDraft(e.target.value)}
          />
          {step.unit ? <span className="muted">{step.unit}</span> : null}
          <button
            className="btn btn-lg"
            disabled={step.required && draft === ''}
            onClick={() => onCommit(step.id, Number(draft), true)}
          >
            Continuer
          </button>
        </div>
      )

    case 'text':
      return (
        <div className="stack">
          <textarea
            className="input mission-input"
            rows={4}
            value={draft}
            placeholder="Votre réponse (facultatif)…"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn btn-lg" onClick={() => onCommit(step.id, draft, true)}>
            Continuer
          </button>
        </div>
      )

    case 'consent':
      return (
        <div className="stack">
          <label className="mission-consent">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(step.id, e.target.checked)}
            />
            <span>{step.statement}</span>
          </label>
          <button className="btn btn-lg" disabled={value !== true} onClick={() => onCommit(step.id, true, true)}>
            Continuer
          </button>
        </div>
      )

    default:
      return null
  }
}
