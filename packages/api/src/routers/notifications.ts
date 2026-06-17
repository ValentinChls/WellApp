import { z } from 'zod'
import { engagementDb } from '@wellpharma/db'
import { isPushConfigured, sendPush } from '../lib/webpush'
import { router, protectedProcedure } from '../trpc'

/** Socle Web Push : abonnement des appareils + test. */
export const notificationsRouter = router({
  /** Clé publique VAPID + état de configuration serveur. */
  publicKey: protectedProcedure.query(() => ({
    key: process.env.VAPID_PUBLIC_KEY ?? null,
    configured: isPushConfigured(),
  })),

  /** Enregistre (ou met à jour) l'abonnement push de l'appareil courant. */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        keys: z.object({ p256dh: z.string(), auth: z.string() }),
        userAgent: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      engagementDb.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        update: {
          userId: ctx.user.id,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          userAgent: input.userAgent,
          lastUsedAt: new Date(),
        },
        create: {
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          userAgent: input.userAgent,
        },
        select: { id: true },
      }),
    ),

  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Scopé au propriétaire : on ne supprime que SES abonnements.
      await engagementDb.pushSubscription.deleteMany({
        where: { endpoint: input.endpoint, userId: ctx.user.id },
      })
      return { ok: true }
    }),

  /** Envoie une notification de test aux appareils de l'utilisateur. */
  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    const subs = await engagementDb.pushSubscription.findMany({ where: { userId: ctx.user.id } })
    let sent = 0
    for (const s of subs) {
      const res = await sendPush(
        { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
        { title: 'Wellpharma', body: 'Notification de test ✅', url: '/' },
      )
      if (res.ok) sent += 1
    }
    return { subscriptions: subs.length, sent }
  }),
})
