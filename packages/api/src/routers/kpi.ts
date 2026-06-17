import { z } from 'zod'
import { engagementDb, healthDb } from '@wellpharma/db'
import { router, pharmacyProcedure, groupementProcedure } from '../trpc'
import { isGroupementRole, resolveScopedPharmacyIds } from '../lib/scope'

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 } as const

/**
 * Pilotage back-office. Toutes les lectures santé sont des COMPTES agrégés
 * (jamais de contenu, jamais de déchiffrement) et scopées par pharmacyId opaque.
 * RBAC : ADMIN_PHARMACIE → sa pharmacie ; SUPER_ADMIN_GROUPEMENT → le groupement.
 */
export const kpiRouter = router({
  // Liste des pharmacies pour le filtre (groupement uniquement).
  scopePharmacies: groupementProcedure.query(async () => {
    return engagementDb.pharmacy.findMany({
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    })
  }),

  dashboard: pharmacyProcedure
    .input(
      z.object({
        period: z.enum(['7d', '30d', '90d', '365d']).default('30d'),
        pharmacyId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ids = await resolveScopedPharmacyIds(ctx.user, input.pharmacyId)
      const isGroupement = isGroupementRole(ctx.user.role)
      const since = new Date(Date.now() - PERIOD_DAYS[input.period] * 86_400_000)
      const now = new Date()
      const inIds = { in: ids }

      const [
        patients,
        consultations,
        campaignsSent,
        promosActive,
        reminders,
        adviceByStatusRaw,
        apptByStatusRaw,
        apptUpcoming,
        interviewsCompleted,
        kpiByNameRaw,
        chatTotal,
        chatRedirected,
        chatByIntentRaw,
        kpiTimelineRaw,
        missionsToValidate,
      ] = await Promise.all([
        engagementDb.affiliation.count({ where: { pharmacyId: inIds, type: 'REFERENCE' } }),
        engagementDb.affiliation.count({ where: { pharmacyId: inIds, type: 'CONSULTEE' } }),
        engagementDb.pushCampaign.count({
          where: { status: 'SENT', ...(isGroupement ? {} : { pharmacyId: inIds }) },
        }),
        engagementDb.promotion.count({
          where: { isActive: true, ...(isGroupement ? {} : { pharmacyId: inIds }) },
        }),
        isGroupement
          ? engagementDb.careEventReminder.count()
          : Promise.resolve<number | null>(null),
        healthDb.adviceRequest.groupBy({
          by: ['status'],
          where: { pharmacyId: inIds },
          _count: { _all: true },
        }),
        healthDb.appointment.groupBy({
          by: ['status'],
          where: { pharmacyId: inIds },
          _count: { _all: true },
        }),
        healthDb.appointment.count({
          where: { pharmacyId: inIds, status: 'CONFIRMED', scheduledAt: { gte: now } },
        }),
        healthDb.pharmaceuticalInterview.count({
          where: { pharmacyId: inIds, status: 'COMPLETED' },
        }),
        engagementDb.kpiEvent.groupBy({
          by: ['name'],
          where: { pharmacyId: inIds, occurredAt: { gte: since } },
          _count: { _all: true },
        }),
        engagementDb.chatLog.count({ where: { pharmacyId: inIds, createdAt: { gte: since } } }),
        engagementDb.chatLog.count({
          where: { pharmacyId: inIds, createdAt: { gte: since }, redirected: true },
        }),
        engagementDb.chatLog.groupBy({
          by: ['intent'],
          where: { pharmacyId: inIds, createdAt: { gte: since }, redirected: false },
          _count: { _all: true },
        }),
        engagementDb.kpiEvent.findMany({
          where: { pharmacyId: inIds, occurredAt: { gte: since } },
          select: { occurredAt: true },
        }),
        engagementDb.missionAssignment.count({
          where: { pharmacyId: inIds, state: { in: ['COMPLETEE', 'A_VALIDER'] } },
        }),
      ])

      // Série journalière (activité dans le temps) — comptes KpiEvent par jour.
      const dayMs = 86_400_000
      const buckets = new Map<string, number>()
      for (let i = PERIOD_DAYS[input.period] - 1; i >= 0; i -= 1) {
        buckets.set(new Date(now.getTime() - i * dayMs).toISOString().slice(0, 10), 0)
      }
      for (const e of kpiTimelineRaw) {
        const k = e.occurredAt.toISOString().slice(0, 10)
        const cur = buckets.get(k)
        if (cur !== undefined) buckets.set(k, cur + 1)
      }
      const timeline = [...buckets.entries()].map(([date, count]) => ({ date, count }))

      return {
        scope: { isGroupement, pharmacyCount: ids.length },
        period: input.period,
        totals: {
          patients,
          consultations,
          campaignsSent,
          promosActive,
          reminders,
          interviewsCompleted,
          apptUpcoming,
          chatTotal,
          chatRedirected,
          missionsToValidate,
        },
        adviceByStatus: adviceByStatusRaw.map((r) => ({ key: r.status as string, count: r._count._all })),
        apptByStatus: apptByStatusRaw.map((r) => ({ key: r.status as string, count: r._count._all })),
        kpiByName: kpiByNameRaw.map((r) => ({ key: r.name, count: r._count._all })),
        chatByIntent: chatByIntentRaw.map((r) => ({ key: r.intent ?? 'autre', count: r._count._all })),
        timeline,
      }
    }),

  // Audit chatbot : derniers échanges (MÉTADONNÉES uniquement, jamais de texte).
  recentChatLogs: pharmacyProcedure
    .input(
      z.object({
        pharmacyId: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ids = await resolveScopedPharmacyIds(ctx.user, input.pharmacyId)
      return engagementDb.chatLog.findMany({
        where: { pharmacyId: { in: ids } },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        select: { id: true, redirected: true, intent: true, pharmacyId: true, createdAt: true },
      })
    }),
})
