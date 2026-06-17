import { engagementDb } from '@wellpharma/db'
import { router, patientProcedure } from '../trpc'

/**
 * Carte de fidélité Wellpharma (programme commercial — domaine engagement, non
 * sensible). Le patient suit son solde de points et l'historique. Les points
 * sont crédités/débités par l'officine (LGO / caisse) — ici lecture seule côté
 * patient.
 */
export const loyaltyRouter = router({
  mine: patientProcedure.query(async ({ ctx }) => {
    const patientId = ctx.user.patientId
    if (!patientId) return null
    const account = await engagementDb.loyaltyAccount.findUnique({
      where: { patientId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })
    if (!account) return null
    return {
      cardNumber: account.cardNumber,
      points: account.points,
      tier: account.tier,
      transactions: account.transactions.map((t) => ({
        id: t.id,
        label: t.label,
        points: t.points,
        createdAt: t.createdAt,
      })),
    }
  }),
})
