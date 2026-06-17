import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Trophy, X } from 'lucide-react'
import {
  BADGES,
  BADGE_BY_ID,
  PREVENTION_THEME_COLORS,
  PREVENTION_THEME_LABELS,
  levelForPoints,
  type Quiz,
} from '@wellpharma/shared'
import { ScreenHeader } from '../components/ScreenHeader'
import { PreventionTabs } from '../components/PreventionTabs'
import { CountUp } from '../components/CountUp'
import {
  getLeaderboard,
  getProfile,
  listQuizzes,
  listTips,
  myResults,
  submitQuiz,
  type QuizResult,
} from '../data/gamificationService'

const SPRING = { type: 'spring' as const, stiffness: 320, damping: 26 }

function Confetti() {
  const pieces = Array.from({ length: 36 }, (_, i) => i)
  const colors = ['#009dc5', '#37bac9', '#2bad70', '#e8902b', '#7c6cdb']
  return (
    <div aria-hidden="true" className="confetti">
      {pieces.map((i) => {
        const left = Math.round(Math.random() * 100)
        const delay = Math.random() * 0.3
        const dur = 0.9 + Math.random() * 0.7
        const color = colors[i % colors.length]
        return (
          <motion.span
            key={i}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{ y: 260, x: (Math.random() - 0.5) * 60, opacity: 0, rotate: Math.random() * 360 }}
            transition={{ duration: dur, delay, ease: 'easeIn' }}
            style={{ left: `${left}%`, background: color }}
          />
        )
      })}
    </div>
  )
}

export function PreventionPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const profile = useQuery({ queryKey: ['gam-profile'], queryFn: getProfile })
  const results = useQuery({ queryKey: ['gam-results'], queryFn: myResults })
  const leaderboard = useQuery({ queryKey: ['gam-leaderboard'], queryFn: getLeaderboard })

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [prevBadges, setPrevBadges] = useState<string[]>([])

  const submit = useMutation({
    mutationFn: (vars: { quizId: string; answers: number[] }) => submitQuiz(vars.quizId, vars.answers),
    onSuccess: (r) => {
      setResult(r)
      void qc.invalidateQueries({ queryKey: ['gam-profile'] })
      void qc.invalidateQueries({ queryKey: ['gam-results'] })
      void qc.invalidateQueries({ queryKey: ['gam-leaderboard'] })
    },
  })

  const tips = listTips()
  const quizzes = listQuizzes()
  const resultByQuiz = new Map((results.data ?? []).map((r) => [r.quizId, r]))

  function openQuiz(q: Quiz) {
    setQuiz(q)
    setQIndex(0)
    setAnswers([])
    setSelected(null)
    setRevealed(false)
    setResult(null)
    setPrevBadges(profile.data?.badges ?? [])
  }
  function closeQuiz() {
    setQuiz(null)
  }
  function choose(optIndex: number) {
    if (revealed) return
    setSelected(optIndex)
    setRevealed(true)
    setAnswers((a) => {
      const next = [...a]
      next[qIndex] = optIndex
      return next
    })
  }
  function nextQuestion() {
    if (!quiz) return
    if (qIndex + 1 < quiz.questions.length) {
      setQIndex((i) => i + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      submit.mutate({ quizId: quiz.id, answers })
    }
  }

  // ─────────────────────── Lecteur de quiz
  if (quiz) {
    const accent = PREVENTION_THEME_COLORS[quiz.theme]
    const q = quiz.questions[qIndex]!
    const total = quiz.questions.length
    const newBadges = result ? result.badges.filter((b) => !prevBadges.includes(b)) : []

    return (
      <div className="page">
        <button className="head-back" onClick={closeQuiz}>
          <ArrowLeft size={18} aria-hidden="true" /> Défis
        </button>

        {result ? (
          <motion.div
            className="quiz-result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING}
          >
            <Confetti />
            <span className="quiz-result-emoji">{result.correct === result.total ? '🏆' : '🎉'}</span>
            <h2 className="quiz-result-score">
              {result.correct}/{result.total}
            </h2>
            <p className="quiz-result-pts">+{result.earned} points</p>
            {newBadges.length ? (
              <div className="badge-row" style={{ justifyContent: 'center' }}>
                {newBadges.map((id) => {
                  const b = BADGE_BY_ID.get(id)
                  return b ? (
                    <motion.span
                      key={id}
                      className="badge-chip"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...SPRING, delay: 0.2 }}
                    >
                      {b.emoji} {b.label}
                    </motion.span>
                  ) : null
                })}
              </div>
            ) : null}
            <div className="stack" style={{ width: '100%', marginTop: 8 }}>
              {quiz.ctaTo ? (
                <button className="btn" onClick={() => navigate(quiz.ctaTo!)}>
                  {quiz.ctaLabel ?? 'Continuer'}
                </button>
              ) : null}
              <button className="btn btn-outline" onClick={closeQuiz}>
                Retour aux défis
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="quiz-top">
              <span className="chip" style={{ background: `${accent}1a`, color: accent, borderColor: 'transparent' }}>
                {quiz.title}
              </span>
              <span className="muted" style={{ fontSize: 14 }}>
                {qIndex + 1} / {total}
              </span>
            </div>
            <div className="quiz-progress">
              <motion.div
                className="quiz-progress-fill"
                style={{ background: accent }}
                animate={{ width: `${((qIndex + (revealed ? 1 : 0)) / total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="stack"
              >
                <h2 className="quiz-question">{q.prompt}</h2>
                <div className="quiz-options">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === q.correctIndex
                    const isChosen = selected === oi
                    const state = !revealed
                      ? ''
                      : isCorrect
                        ? ' opt-correct'
                        : isChosen
                          ? ' opt-wrong'
                          : ' opt-dim'
                    return (
                      <button
                        key={oi}
                        className={`quiz-opt${state}`}
                        onClick={() => choose(oi)}
                        disabled={revealed}
                      >
                        <span>{opt}</span>
                        {revealed && isCorrect ? <Check size={18} aria-hidden="true" /> : null}
                        {revealed && isChosen && !isCorrect ? <X size={18} aria-hidden="true" /> : null}
                      </button>
                    )
                  })}
                </div>

                <AnimatePresence>
                  {revealed ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="quiz-explain"
                    >
                      {q.explanation}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {revealed ? (
                  <button className="btn" onClick={nextQuestion} disabled={submit.isPending}>
                    {qIndex + 1 < total ? (
                      <>
                        Question suivante <ArrowRight size={18} aria-hidden="true" />
                      </>
                    ) : (
                      'Voir mon résultat'
                    )}
                  </button>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    )
  }

  // ─────────────────────── Accueil Défis
  const lvl = levelForPoints(profile.data?.points ?? 0)
  const earned = new Set(profile.data?.badges ?? [])

  return (
    <div className="page">
      <ScreenHeader eyebrow="Rester en forme" title="Prévention" />
      <PreventionTabs active="defis" />

      <motion.div className="level-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="level-top">
          <div>
            <div className="level-label">{lvl.current.label}</div>
            <div className="level-pts">
              <CountUp value={profile.data?.points ?? 0} /> points
              {lvl.next ? <span className="muted"> · {lvl.next.min - (profile.data?.points ?? 0)} pts vers {lvl.next.label}</span> : ' · niveau max'}
            </div>
          </div>
          <Trophy size={28} aria-hidden="true" />
        </div>
        <div className="level-bar">
          <motion.div
            className="level-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(lvl.progress * 100)}%` }}
            transition={SPRING}
          />
        </div>
      </motion.div>

      <div className="badge-row">
        {BADGES.map((b) => (
          <span key={b.id} className={`badge-chip${earned.has(b.id) ? '' : ' badge-locked'}`} title={b.hint}>
            {b.emoji} {b.label}
          </span>
        ))}
      </div>

      <section className="section">
        <h2 className="section-title">Défis</h2>
        {quizzes.map((quizItem) => {
          const r = resultByQuiz.get(quizItem.id)
          const accent = PREVENTION_THEME_COLORS[quizItem.theme]
          return (
            <button key={quizItem.id} className="quiz-card" onClick={() => openQuiz(quizItem)}>
              <span className="quiz-card-bar" style={{ background: accent }} />
              <span className="grow">
                <span className="chip" style={{ background: `${accent}1a`, color: accent, borderColor: 'transparent' }}>
                  {PREVENTION_THEME_LABELS[quizItem.theme]}
                </span>
                <span className="t">{quizItem.title}</span>
                <span className="d">{quizItem.description}</span>
              </span>
              <span className="quiz-card-state">
                {r ? (
                  <span className="quiz-done">
                    <Check size={14} aria-hidden="true" /> {r.score}/{r.total}
                  </span>
                ) : (
                  <span className="quiz-new">Nouveau</span>
                )}
              </span>
            </button>
          )
        })}
      </section>

      <section className="section">
        <h2 className="section-title">Conseils prévention</h2>
        {tips.map((t) => (
          <div key={t.id} className="card stack">
            <span className="chip">{PREVENTION_THEME_LABELS[t.theme]}</span>
            <strong>{t.title}</strong>
            <p className="muted">{t.body}</p>
            {t.ctaTo ? (
              <button className="btn btn-outline btn-sm" onClick={() => navigate(t.ctaTo!)}>
                {t.ctaLabel ?? 'En savoir plus'}
              </button>
            ) : null}
          </div>
        ))}
      </section>

      <section className="section">
        <h2 className="section-title">Classement</h2>
        <div className="card">
          {leaderboard.data && leaderboard.data.length ? (
            leaderboard.data.map((row) => (
              <div key={row.rank} className={`leader-row${row.isMe ? ' is-me' : ''}`}>
                <span>
                  #{row.rank} {row.isMe ? 'Vous' : 'Joueur'}
                </span>
                <span className="leader-pts">{row.points} pts</span>
              </div>
            ))
          ) : (
            <p className="muted">Pas encore de classement.</p>
          )}
        </div>
      </section>
    </div>
  )
}
