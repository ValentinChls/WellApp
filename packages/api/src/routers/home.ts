import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb } from '@wellpharma/db'
import { router, patientProcedure, groupementProcedure } from '../trpc'

/**
 * Carrousel d'accueil de l'app patient — contenu piloté par le groupement.
 * Bannières non sensibles (engagement) : image recadrée (data URL) + textes.
 */
const saveInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(160).optional(),
  // data URL JPEG recadrée côté client (1200×675). Requise à la création.
  imageDataUrl: z
    .string()
    .max(3_500_000)
    .regex(/^data:image\//, 'Image invalide')
    .optional(),
  linkUrl: z.string().max(500).optional(),
  active: z.boolean().default(true),
})

async function groupementId(): Promise<string> {
  const g = await engagementDb.groupement.findFirst({ select: { id: true } })
  if (!g) throw new TRPCError({ code: 'NOT_FOUND', message: 'Groupement introuvable.' })
  return g.id
}

export const homeRouter = router({
  // ── Patient : bannières actives (carrousel)
  list: patientProcedure.query(async () => {
    const banners = await engagementDb.homeBanner.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, title: true, subtitle: true, imageDataUrl: true, linkUrl: true },
    })
    return banners
  }),

  // ── Groupement : pilotage
  adminList: groupementProcedure.query(async () => {
    return engagementDb.homeBanner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
  }),

  save: groupementProcedure.input(saveInput).mutation(async ({ input }) => {
    if (input.id) {
      const existing = await engagementDb.homeBanner.findUnique({ where: { id: input.id } })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })
      return engagementDb.homeBanner.update({
        where: { id: input.id },
        data: {
          title: input.title,
          subtitle: input.subtitle ?? null,
          linkUrl: input.linkUrl || null,
          active: input.active,
          // l'image n'est remplacée que si une nouvelle a été fournie
          ...(input.imageDataUrl ? { imageDataUrl: input.imageDataUrl } : {}),
        },
      })
    }
    if (!input.imageDataUrl) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Une image est requise.' })
    }
    const gid = await groupementId()
    const max = await engagementDb.homeBanner.aggregate({ _max: { sortOrder: true } })
    return engagementDb.homeBanner.create({
      data: {
        groupementId: gid,
        title: input.title,
        subtitle: input.subtitle ?? null,
        imageDataUrl: input.imageDataUrl,
        linkUrl: input.linkUrl || null,
        active: input.active,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    })
  }),

  remove: groupementProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await engagementDb.homeBanner.delete({ where: { id: input.id } })
      return { ok: true }
    }),

  // Réordonne en échangeant le sortOrder avec le voisin (haut/bas).
  move: groupementProcedure
    .input(z.object({ id: z.string().uuid(), direction: z.enum(['up', 'down']) }))
    .mutation(async ({ input }) => {
      const all = await engagementDb.homeBanner.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, sortOrder: true },
      })
      const i = all.findIndex((b) => b.id === input.id)
      if (i < 0) throw new TRPCError({ code: 'NOT_FOUND' })
      const j = input.direction === 'up' ? i - 1 : i + 1
      if (j < 0 || j >= all.length) return { ok: true }
      const a = all[i]!
      const b = all[j]!
      await engagementDb.$transaction([
        engagementDb.homeBanner.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
        engagementDb.homeBanner.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
      ])
      return { ok: true }
    }),
})
