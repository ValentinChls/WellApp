import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb } from '@wellpharma/db'
import { router, pharmacyProcedure } from '../trpc'
import {
  assertPharmacyInScope,
  isGroupementRole,
  resolveOwnerPharmacyId,
  resolveScopedPharmacyIds,
} from '../lib/scope'

async function getOwnedPromotion(
  ctx: { user: { role: 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE' | 'PATIENT'; pharmacyId: string | null } },
  id: string,
) {
  const p = await engagementDb.promotion.findUnique({ where: { id } })
  if (!p) throw new TRPCError({ code: 'NOT_FOUND' })
  assertPharmacyInScope(ctx.user, p.pharmacyId)
  return p
}

/**
 * Promotions / offres (non-santé). RBAC : admin_pharmacie = sa pharmacie ;
 * super_admin = groupement (promotions pharmacyId=null incluses).
 */
export const promotionsRouter = router({
  list: pharmacyProcedure.query(async ({ ctx }) => {
    if (isGroupementRole(ctx.user.role)) {
      return engagementDb.promotion.findMany({ orderBy: { createdAt: 'desc' } })
    }
    const ids = await resolveScopedPharmacyIds(ctx.user)
    return engagementDb.promotion.findMany({
      where: { pharmacyId: { in: ids } },
      orderBy: { createdAt: 'desc' },
    })
  }),

  create: pharmacyProcedure
    .input(
      z.object({
        title: z.string().min(1).max(120),
        description: z.string().max(500).optional(),
        imageUrl: z.string().url().max(500).optional(),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),
        pharmacyId: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pharmacyId = resolveOwnerPharmacyId(ctx.user, input.pharmacyId)
      return engagementDb.promotion.create({
        data: {
          pharmacyId,
          title: input.title,
          description: input.description ?? null,
          imageUrl: input.imageUrl ?? null,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          isActive: true,
        },
      })
    }),

  update: pharmacyProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(120).optional(),
        description: z.string().max(500).nullish(),
        imageUrl: z.string().url().max(500).nullish(),
        startsAt: z.date().nullish(),
        endsAt: z.date().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOwnedPromotion(ctx, input.id)
      return engagementDb.promotion.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
        },
      })
    }),

  toggle: pharmacyProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const p = await getOwnedPromotion(ctx, input.id)
    return engagementDb.promotion.update({
      where: { id: input.id },
      data: { isActive: !p.isActive },
    })
  }),

  remove: pharmacyProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await getOwnedPromotion(ctx, input.id)
    await engagementDb.promotion.delete({ where: { id: input.id } })
    return { ok: true }
  }),
})
