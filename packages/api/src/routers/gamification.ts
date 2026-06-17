import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb } from '@wellpharma/db'
import { answersAreValid, earnedBadges, getQuiz, scoreQuiz } from '@wellpharma/shared'
import { router, patientProcedure } from '../trpc'

/**
 * Gamification de prévention (engagement, déclaratif). Le scoring est fait
 * côté serveur depuis le contenu canonique partagé. Points = somme des MEILLEURS
 * scores par quiz (idempotent). Badges dérivés des points + résultats par quiz.
 * Classement pseudonymisé.
 */
export const gamificationRouter = router({
  getProfile: patientProcedure.query(async ({ ctx }) => {
    const [profile, quizzesDone] = await Promise.all([
      engagementDb.gamificationProfile.findUnique({ where: { userId: ctx.user.id } }),
      engagementDb.quizAttempt.count({ where: { userId: ctx.user.id } }),
    ])
    return { points: profile?.points ?? 0, badges: profile?.badges ?? [], quizzesDone }
  }),

  /** Meilleurs résultats par quiz (pour afficher l'état « terminé / score »). */
  myResults: patientProcedure.query(async ({ ctx }) => {
    const rows = await engagementDb.quizAttempt.findMany({
      where: { userId: ctx.user.id },
      select: { quizId: true, score: true, total: true },
    })
    return rows
  }),

  submitQuiz: patientProcedure
    .input(
      z.object({
        quizId: z.string(),
        answers: z.array(z.number().int().min(0).max(10)).min(1).max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const quiz = getQuiz(input.quizId)
      if (!quiz) throw new TRPCError({ code: 'NOT_FOUND', message: 'Quiz inconnu.' })
      if (!answersAreValid(quiz, input.answers)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Réponses invalides.' })
      }
      const result = scoreQuiz(quiz, input.answers)

      const { totalPoints, badges } = await engagementDb.$transaction(async (tx) => {
        const existing = await tx.quizAttempt.findUnique({
          where: { userId_quizId: { userId: ctx.user.id, quizId: input.quizId } },
        })
        // On conserve la MEILLEURE tentative (par points).
        const best =
          existing && existing.points >= result.points
            ? { score: existing.score, total: existing.total, points: existing.points }
            : { score: result.correct, total: result.total, points: result.points }
        await tx.quizAttempt.upsert({
          where: { userId_quizId: { userId: ctx.user.id, quizId: input.quizId } },
          update: { ...best, completedAt: new Date() },
          create: {
            userId: ctx.user.id,
            quizId: input.quizId,
            score: result.correct,
            total: result.total,
            points: result.points,
          },
        })

        const all = await tx.quizAttempt.findMany({
          where: { userId: ctx.user.id },
          select: { quizId: true, score: true, total: true, points: true },
        })
        const total = all.reduce((s, a) => s + a.points, 0)
        const records = all.map((a) => ({ quizId: a.quizId, score: a.score, total: a.total }))
        const badgeIds = earnedBadges(total, records)
        await tx.gamificationProfile.upsert({
          where: { userId: ctx.user.id },
          update: { points: total, badges: badgeIds },
          create: { userId: ctx.user.id, points: total, badges: badgeIds },
        })
        return { totalPoints: total, badges: badgeIds }
      })

      return {
        correct: result.correct,
        total: result.total,
        earned: result.points,
        points: totalPoints,
        badges,
      }
    }),

  leaderboard: patientProcedure.query(async ({ ctx }) => {
    const top = await engagementDb.gamificationProfile.findMany({
      orderBy: { points: 'desc' },
      take: 10,
    })
    return top.map((t, i) => ({ rank: i + 1, points: t.points, isMe: t.userId === ctx.user.id }))
  }),
})
