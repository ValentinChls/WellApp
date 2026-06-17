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

const channel = z.enum(['EXPO_PUSH', 'WEB_PUSH'])
const targetSex = z.enum(['ALL', 'MALE', 'FEMALE'])

async function getOwnedCampaign(
  ctx: { user: { role: 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE' | 'PATIENT'; pharmacyId: string | null } },
  id: string,
) {
  const c = await engagementDb.pushCampaign.findUnique({ where: { id } })
  if (!c) throw new TRPCError({ code: 'NOT_FOUND' })
  assertPharmacyInScope(ctx.user, c.pharmacyId)
  return c
}

/**
 * Campagnes push (contenu GÉNÉRIQUE, non-santé). Consentement PUSH_NOTIFICATIONS
 * vérifié au dispatch (job à venir). RBAC : admin_pharmacie = sa pharmacie ;
 * super_admin = groupement (campagnes pharmacyId=null incluses).
 */
export const campaignsRouter = router({
  list: pharmacyProcedure.query(async ({ ctx }) => {
    if (isGroupementRole(ctx.user.role)) {
      return engagementDb.pushCampaign.findMany({ orderBy: { createdAt: 'desc' } })
    }
    const ids = await resolveScopedPharmacyIds(ctx.user)
    return engagementDb.pushCampaign.findMany({
      where: { pharmacyId: { in: ids } },
      orderBy: { createdAt: 'desc' },
    })
  }),

  create: pharmacyProcedure
    .input(
      z.object({
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(500),
        channels: z.array(channel).min(1),
        pharmacyId: z.string().nullish(),
        targetAgeMin: z.number().int().min(0).max(120).optional(),
        targetAgeMax: z.number().int().min(0).max(120).optional(),
        targetSex: targetSex.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pharmacyId = resolveOwnerPharmacyId(ctx.user, input.pharmacyId)
      return engagementDb.pushCampaign.create({
        data: {
          pharmacyId,
          title: input.title,
          body: input.body,
          channels: input.channels,
          targetAgeMin: input.targetAgeMin ?? null,
          targetAgeMax: input.targetAgeMax ?? null,
          targetSex: input.targetSex ?? 'ALL',
          status: 'DRAFT',
        },
      })
    }),

  update: pharmacyProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(120).optional(),
        body: z.string().min(1).max(500).optional(),
        channels: z.array(channel).min(1).optional(),
        targetAgeMin: z.number().int().min(0).max(120).nullish(),
        targetAgeMax: z.number().int().min(0).max(120).nullish(),
        targetSex: targetSex.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const c = await getOwnedCampaign(ctx, input.id)
      if (c.status !== 'DRAFT') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Seuls les brouillons sont modifiables.' })
      }
      return engagementDb.pushCampaign.update({
        where: { id: input.id },
        data: {
          title: input.title,
          body: input.body,
          targetSex: input.targetSex,
          targetAgeMin: input.targetAgeMin === undefined ? undefined : input.targetAgeMin,
          targetAgeMax: input.targetAgeMax === undefined ? undefined : input.targetAgeMax,
          ...(input.channels ? { channels: { set: input.channels } } : {}),
        },
      })
    }),

  cancel: pharmacyProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const c = await getOwnedCampaign(ctx, input.id)
    if (c.status === 'SENT') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Campagne déjà envoyée.' })
    }
    return engagementDb.pushCampaign.update({ where: { id: input.id }, data: { status: 'CANCELLED' } })
  }),

  send: pharmacyProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const c = await getOwnedCampaign(ctx, input.id)
    if (c.status !== 'DRAFT' && c.status !== 'SCHEDULED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Campagne non envoyable.' })
    }
    // BORNE : le dispatch effectif vers les appareils (Web Push, gated par le
    // consentement PUSH_NOTIFICATIONS de chaque patient ciblé) est un job de
    // diffusion à venir. Ici on acte l'état « envoyée ».
    return engagementDb.pushCampaign.update({
      where: { id: input.id },
      data: { status: 'SENT', sentAt: new Date() },
    })
  }),
})
