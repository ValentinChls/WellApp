/**
 * Couche d'accès « gamification & prévention » (engagement, déclaratif).
 * DÉMO : scoring local + profil localStorage. RÉEL : tRPC (scoring serveur).
 */
import {
  PREVENTION_TIPS,
  QUIZZES,
  answersAreValid,
  earnedBadges,
  getQuiz,
  scoreQuiz,
  type PreventionTip,
  type Quiz,
} from '@wellpharma/shared'
import { isDemoEnabled } from '../lib/demo'
import { trpc } from '../lib/trpcVanilla'

export interface GamProfile {
  points: number
  badges: string[]
  quizzesDone: number
}

export interface QuizResult {
  correct: number
  total: number
  earned: number
  points: number
  badges: string[]
}

export interface LeaderRow {
  rank: number
  points: number
  isMe: boolean
}

export interface MyResult {
  quizId: string
  score: number
  total: number
}

const KEY = 'wp-demo-gamification'

type DemoStore = Record<string, { score: number; total: number; points: number }>

function readDemo(): DemoStore {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as DemoStore
    // tolère l'ancien format { quizId: points }
    const out: DemoStore = {}
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'number') out[k] = { score: 0, total: 0, points: v }
      else if (v && typeof v === 'object') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}
function demoPoints(store: DemoStore): number {
  return Object.values(store).reduce((a, b) => a + b.points, 0)
}
function demoRecords(store: DemoStore) {
  return Object.entries(store).map(([quizId, v]) => ({ quizId, score: v.score, total: v.total }))
}

export function listQuizzes(): Quiz[] {
  return QUIZZES
}
export function listTips(): PreventionTip[] {
  return PREVENTION_TIPS
}

export async function getProfile(): Promise<GamProfile> {
  if (isDemoEnabled()) {
    const store = readDemo()
    const points = demoPoints(store)
    return {
      points,
      badges: earnedBadges(points, demoRecords(store)),
      quizzesDone: Object.keys(store).length,
    }
  }
  return trpc.gamification.getProfile.query()
}

export async function myResults(): Promise<MyResult[]> {
  if (isDemoEnabled()) {
    return demoRecords(readDemo())
  }
  return trpc.gamification.myResults.query()
}

export async function submitQuiz(quizId: string, answers: number[]): Promise<QuizResult> {
  if (isDemoEnabled()) {
    const quiz = getQuiz(quizId)
    if (!quiz) throw new Error('Quiz inconnu')
    if (!answersAreValid(quiz, answers)) throw new Error('Réponses invalides')
    const r = scoreQuiz(quiz, answers)
    const store = readDemo()
    const prev = store[quizId]
    // meilleur score conservé (par points)
    store[quizId] =
      prev && prev.points >= r.points ? prev : { score: r.correct, total: r.total, points: r.points }
    localStorage.setItem(KEY, JSON.stringify(store))
    const points = demoPoints(store)
    return {
      correct: r.correct,
      total: r.total,
      earned: r.points,
      points,
      badges: earnedBadges(points, demoRecords(store)),
    }
  }
  return trpc.gamification.submitQuiz.mutate({ quizId, answers })
}

export async function getLeaderboard(): Promise<LeaderRow[]> {
  if (isDemoEnabled()) {
    const points = demoPoints(readDemo())
    const sample = [{ points: 120, me: false }, { points: 80, me: false }, { points: 40, me: false }, { points, me: true }]
    return sample
      .sort((a, b) => b.points - a.points)
      .map((row, i) => ({ rank: i + 1, points: row.points, isMe: row.me }))
  }
  return trpc.gamification.leaderboard.query()
}
