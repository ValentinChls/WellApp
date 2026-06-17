import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb } from '@wellpharma/db'
import type { Role } from '../context'
import { router, pharmacyProcedure } from '../trpc'
import { assertPharmacyInScope, resolveScopedPharmacyIds } from '../lib/scope'

/** pharmacyId effectif : admin = sa pharmacie ; super = pharmacyId fourni (requis). */
function effectivePharmacyId(
  user: { role: Role; pharmacyId: string | null },
  inputPharmacyId?: string,
): string {
  if (user.role === 'ADMIN_PHARMACIE') {
    if (!user.pharmacyId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Pharmacie absente.' })
    return user.pharmacyId
  }
  if (!inputPharmacyId) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'pharmacyId requis pour le groupement.' })
  }
  return inputPharmacyId
}

/**
 * Configuration des actes (AppointmentType) et génération de créneaux
 * (AppointmentSlot, domaine engagement = disponibilité, non sensible).
 */
export const appointmentTypesRouter = router({
  list: pharmacyProcedure
    .input(z.object({ pharmacyId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      // Lecture : périmètre RBAC (admin = sa pharmacie ; super = groupement,
      // filtrable). effectivePharmacyId reste réservé aux mutations (cible unique).
      const ids = await resolveScopedPharmacyIds(ctx.user, input?.pharmacyId)
      if (ids.length === 0) return []
      const types = await engagementDb.appointmentType.findMany({
        where: { pharmacyId: { in: ids } },
        orderBy: [{ pharmacyId: 'asc' }, { label: 'asc' }],
      })
      const now = new Date()
      const free = await engagementDb.appointmentSlot.groupBy({
        by: ['appointmentTypeId'],
        where: { pharmacyId: { in: ids }, status: 'FREE', startsAt: { gte: now } },
        _count: { _all: true },
      })
      const freeByType = new Map(free.map((r) => [r.appointmentTypeId, r._count._all]))
      return types.map((t) => ({ ...t, freeSlots: freeByType.get(t.id) ?? 0 }))
    }),

  create: pharmacyProcedure
    .input(
      z.object({
        pharmacyId: z.string().optional(),
        code: z
          .string()
          .min(2)
          .max(40)
          .regex(/^[A-Z0-9_]+$/, 'Code en MAJUSCULES (A-Z, 0-9, _).'),
        label: z.string().min(1).max(80),
        durationMin: z.number().int().min(5).max(180).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pharmacyId = effectivePharmacyId(ctx.user, input.pharmacyId)
      const exists = await engagementDb.appointmentType.findUnique({
        where: { pharmacyId_code: { pharmacyId, code: input.code } },
      })
      if (exists) throw new TRPCError({ code: 'CONFLICT', message: 'Code déjà utilisé pour cette pharmacie.' })
      return engagementDb.appointmentType.create({
        data: { pharmacyId, code: input.code, label: input.label, durationMin: input.durationMin ?? 20 },
      })
    }),

  update: pharmacyProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).max(80).optional(),
        durationMin: z.number().int().min(5).max(180).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const type = await engagementDb.appointmentType.findUnique({ where: { id: input.id } })
      if (!type) throw new TRPCError({ code: 'NOT_FOUND' })
      assertPharmacyInScope(ctx.user, type.pharmacyId)
      return engagementDb.appointmentType.update({
        where: { id: input.id },
        data: { label: input.label, durationMin: input.durationMin },
      })
    }),

  toggle: pharmacyProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const type = await engagementDb.appointmentType.findUnique({ where: { id: input.id } })
    if (!type) throw new TRPCError({ code: 'NOT_FOUND' })
    assertPharmacyInScope(ctx.user, type.pharmacyId)
    return engagementDb.appointmentType.update({
      where: { id: input.id },
      data: { active: !type.active },
    })
  }),

  /** Régénère les créneaux FUTURS libres d'un acte sur les prochains jours. */
  generateSlots: pharmacyProcedure
    .input(
      z.object({
        appointmentTypeId: z.string(),
        days: z.number().int().min(1).max(30).default(7),
        hours: z.array(z.number().int().min(0).max(23)).min(1).max(24),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const type = await engagementDb.appointmentType.findUnique({
        where: { id: input.appointmentTypeId },
      })
      if (!type) throw new TRPCError({ code: 'NOT_FOUND' })
      assertPharmacyInScope(ctx.user, type.pharmacyId)

      const now = new Date()
      // Créneaux construits en HEURE LOCALE du serveur. En prod, épingler le
      // fuseau du process à Europe/Paris (TZ=Europe/Paris) pour des heures justes.
      const data: Array<{ pharmacyId: string; appointmentTypeId: string; startsAt: Date }> = []
      for (let d = 0; d < input.days; d++) {
        for (const h of input.hours) {
          const dt = new Date(now)
          dt.setHours(0, 0, 0, 0)
          dt.setDate(dt.getDate() + d)
          dt.setHours(h, 0, 0, 0)
          if (dt.getTime() > now.getTime()) {
            data.push({ pharmacyId: type.pharmacyId, appointmentTypeId: type.id, startsAt: dt })
          }
        }
      }

      // On remplace les créneaux libres futurs (les créneaux RÉSERVÉS sont préservés).
      await engagementDb.appointmentSlot.deleteMany({
        where: { appointmentTypeId: type.id, status: 'FREE', startsAt: { gte: now } },
      })
      await engagementDb.appointmentSlot.createMany({ data })
      return { created: data.length }
    }),
})
