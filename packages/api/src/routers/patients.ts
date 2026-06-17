import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb } from '@wellpharma/db'
import { router, pharmacyProcedure } from '../trpc'
import { resolveScopedPharmacyIds } from '../lib/scope'

/**
 * Gestion patients côté back-office — DOMAINE ENGAGEMENT UNIQUEMENT.
 * Identité minimale + affiliations + consentements courants. AUCUNE donnée de
 * santé (conseils, RDV, entretiens) n'est exposée ici. Accès borné aux patients
 * affiliés aux pharmacies du périmètre du staff.
 */
export const patientsRouter = router({
  list: pharmacyProcedure
    .input(z.object({ q: z.string().max(80).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const ids = await resolveScopedPharmacyIds(ctx.user)
      const affs = await engagementDb.affiliation.findMany({
        where: { pharmacyId: { in: ids } },
        select: { patientId: true, type: true },
      })
      const refByPatient = new Map<string, boolean>()
      for (const a of affs) {
        if (a.type === 'REFERENCE') refByPatient.set(a.patientId, true)
        else if (!refByPatient.has(a.patientId)) refByPatient.set(a.patientId, false)
      }
      const patientIds = [...refByPatient.keys()]
      if (patientIds.length === 0) return []

      const q = input?.q?.trim()
      const patients = await engagementDb.patient.findMany({
        where: {
          id: { in: patientIds },
          ...(q
            ? {
                OR: [
                  { firstName: { contains: q, mode: 'insensitive' } },
                  { lastName: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: { id: true, firstName: true, lastName: true, birthDate: true, sex: true },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        take: 200,
      })
      return patients.map((p) => ({ ...p, isReference: refByPatient.get(p.id) ?? false }))
    }),

  get: pharmacyProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ids = await resolveScopedPharmacyIds(ctx.user)
      // Le patient doit être affilié à une pharmacie du périmètre.
      const inScope = await engagementDb.affiliation.findFirst({
        where: { patientId: input.patientId, pharmacyId: { in: ids } },
        select: { id: true },
      })
      if (!inScope) throw new TRPCError({ code: 'FORBIDDEN', message: 'Patient hors périmètre.' })

      const [patient, affiliations, consentRows] = await Promise.all([
        engagementDb.patient.findUnique({
          where: { id: input.patientId },
          select: { id: true, firstName: true, lastName: true, birthDate: true, sex: true, phone: true },
        }),
        engagementDb.affiliation.findMany({
          where: { patientId: input.patientId, pharmacyId: { in: ids } },
          select: { type: true, pharmacyId: true },
        }),
        engagementDb.consent.findMany({
          where: { patientId: input.patientId },
          select: { type: true, granted: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
      ])
      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' })

      // Consentement courant = dernière ligne par type (append-only).
      const current: Record<string, boolean> = {}
      for (const c of consentRows) {
        if (!(c.type in current)) current[c.type] = c.granted
      }

      return { patient, affiliations, consents: current }
    }),
})
