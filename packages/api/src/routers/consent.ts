import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb } from '@wellpharma/db'
import { router, patientProcedure } from '../trpc'

const CONSENT_TYPES = [
  'HEALTH_DATA',
  'MARKETING',
  'PUSH_NOTIFICATIONS',
  'DATA_SHARING_PHARMACY',
] as const

const CURRENT_POLICY_VERSION = 'v1.0'

/**
 * Consentement granulaire, APPEND-ONLY : chaque changement INSÈRE une nouvelle
 * ligne immuable et horodatée. On ne fait JAMAIS d'UPDATE/DELETE sur Consent.
 * Le consentement « courant » se résout côté lecture (dernier par type).
 */
export const consentRouter = router({
  /** Historique des consentements du patient connecté. */
  list: patientProcedure.query(({ ctx }) => {
    const patientId = ctx.user.patientId
    if (!patientId) return []
    return engagementDb.consent.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    })
  }),

  /** Accorde ou révoque un consentement (nouvelle ligne append-only). */
  set: patientProcedure
    .input(
      z.object({
        type: z.enum(CONSENT_TYPES),
        granted: z.boolean(),
        policyVersion: z.string().default(CURRENT_POLICY_VERSION),
      }),
    )
    .mutation(({ ctx, input }) => {
      const patientId = ctx.user.patientId
      if (!patientId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Profil patient manquant.' })
      }
      const now = new Date()
      return engagementDb.consent.create({
        data: {
          patientId,
          type: input.type,
          granted: input.granted,
          policyVersion: input.policyVersion,
          source: 'APP_PATIENT',
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
          grantedAt: input.granted ? now : null,
          revokedAt: input.granted ? null : now,
        },
      })
    }),
})
