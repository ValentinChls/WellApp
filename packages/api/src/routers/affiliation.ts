import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb, writeKpi } from '@wellpharma/db'
import { router, patientProcedure } from '../trpc'

const pharmacyInput = z.object({ pharmacyId: z.string().uuid() })

/**
 * Affiliations patient ↔ pharmacies.
 * - UNE pharmacie de référence (REFERENCE) au plus.
 * - N pharmacies consultées (CONSULTEE) en déplacement.
 */
export const affiliationRouter = router({
  list: patientProcedure.query(({ ctx }) => {
    const patientId = ctx.user.patientId
    if (!patientId) return []
    return engagementDb.affiliation.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    })
  }),

  /** Définit la pharmacie de référence (rétrograde l'ancienne en CONSULTEE). */
  setReference: patientProcedure.input(pharmacyInput).mutation(async ({ ctx, input }) => {
    const patientId = ctx.user.patientId
    if (!patientId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Profil patient manquant.' })

    const result = await engagementDb.$transaction(async (tx) => {
      await tx.affiliation.updateMany({
        where: { patientId, type: 'REFERENCE' },
        data: { type: 'CONSULTEE' },
      })
      return tx.affiliation.upsert({
        where: { patientId_pharmacyId: { patientId, pharmacyId: input.pharmacyId } },
        update: { type: 'REFERENCE' },
        create: { patientId, pharmacyId: input.pharmacyId, type: 'REFERENCE' },
      })
    })

    await writeKpi({
      name: 'affiliation_set_reference',
      pharmacyId: input.pharmacyId,
      subjectId: patientId,
    })
    return result
  }),

  /** Ajoute une pharmacie consultée (sans toucher à la référence existante). */
  addConsulted: patientProcedure.input(pharmacyInput).mutation(async ({ ctx, input }) => {
    const patientId = ctx.user.patientId
    if (!patientId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Profil patient manquant.' })

    const existing = await engagementDb.affiliation.findUnique({
      where: { patientId_pharmacyId: { patientId, pharmacyId: input.pharmacyId } },
    })
    if (existing) return existing // ne pas rétrograder une éventuelle REFERENCE

    const created = await engagementDb.affiliation.create({
      data: { patientId, pharmacyId: input.pharmacyId, type: 'CONSULTEE' },
    })
    await writeKpi({
      name: 'affiliation_add_consulted',
      pharmacyId: input.pharmacyId,
      subjectId: patientId,
    })
    return created
  }),

  /** Retire une affiliation. */
  remove: patientProcedure.input(pharmacyInput).mutation(async ({ ctx, input }) => {
    const patientId = ctx.user.patientId
    if (!patientId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Profil patient manquant.' })
    await engagementDb.affiliation.deleteMany({ where: { patientId, pharmacyId: input.pharmacyId } })
    return { ok: true }
  }),
})
