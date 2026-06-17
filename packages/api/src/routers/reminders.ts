import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb, hasConsent } from '@wellpharma/db'
import { router, patientProcedure } from '../trpc'

/** Rappels push sur les événements marronnier. Consentement notifications requis. */
export const remindersRouter = router({
  listMine: patientProcedure.query(async ({ ctx }) => {
    const rows = await engagementDb.careEventReminder.findMany({
      where: { userId: ctx.user.id },
      select: { careEventId: true },
    })
    return rows.map((r) => r.careEventId)
  }),

  toggle: patientProcedure
    .input(z.object({ careEventId: z.string().max(80) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.patientId) {
        const consents = await engagementDb.consent.findMany({
          where: { patientId: ctx.user.patientId },
          select: { type: true, granted: true, createdAt: true, revokedAt: true },
        })
        if (!hasConsent(consents, 'PUSH_NOTIFICATIONS')) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Consentement notifications requis.' })
        }
      }
      const existing = await engagementDb.careEventReminder.findUnique({
        where: { userId_careEventId: { userId: ctx.user.id, careEventId: input.careEventId } },
      })
      if (existing) {
        await engagementDb.careEventReminder.delete({ where: { id: existing.id } })
        return { active: false }
      }
      await engagementDb.careEventReminder.create({
        data: { userId: ctx.user.id, careEventId: input.careEventId },
      })
      return { active: true }
    }),
})
