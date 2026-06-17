import { engagementDb, healthDb } from '@wellpharma/db'
import { getMissionTemplate } from '@wellpharma/shared'
import { resolveScopedPharmacyIds } from '../lib/scope'
import { router, pharmacyProcedure } from '../trpc'

/**
 * Cockpit « Aujourd'hui » du pharmacien : agrégateur LECTURE SEULE de ce qui
 * attend une action. Aucune donnée de santé en clair (alertes génériques +
 * comptes + libellés non sensibles). Les détails restent derrière les pages
 * tracées existantes.
 */
const TO_VALIDATE = ['COMPLETEE', 'A_VALIDER'] as const
const PENDING = ['PROPOSEE', 'EN_COURS'] as const

const forfait = (code: string) => getMissionTemplate(code)?.remuneration?.amountEur ?? 0

function empty() {
  return {
    counts: { aTraiter: 0, missionsToValidate: 0, conseils: 0, relances: 0 },
    caAmeliToday: 0,
    missions: { count: 0, caPending: 0, sample: null as null | { id: string; patientName: string; title: string; attentionCount: number } },
    conseils: { count: 0, sample: null as null | { subject: string; at: Date } },
    relances: { count: 0, ids: [] as string[] },
    rdv: { count: 0, nextAt: null as Date | null },
  }
}

export const cockpitRouter = router({
  today: pharmacyProcedure.query(async ({ ctx }) => {
    const ids = await resolveScopedPharmacyIds(ctx.user)
    if (ids.length === 0) return empty()
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay.getTime() + 86_400_000)
    const fiveDaysAgo = new Date(now.getTime() - 5 * 86_400_000)
    const inIds = { in: ids }

    const [toValidateGroups, validatedTodayGroups, pendingStale, conseilsCount, conseilSample, rdvCount, rdvNext, sampleAssign] =
      await Promise.all([
        engagementDb.missionAssignment.groupBy({
          by: ['missionCode'],
          where: { pharmacyId: inIds, state: { in: [...TO_VALIDATE] } },
          _count: { _all: true },
        }),
        engagementDb.missionAssignment.groupBy({
          by: ['missionCode'],
          where: { pharmacyId: inIds, state: { in: ['VALIDEE', 'FACTUREE'] }, validatedAt: { gte: startOfDay, lt: endOfDay } },
          _count: { _all: true },
        }),
        engagementDb.missionAssignment.findMany({
          where: { pharmacyId: inIds, state: { in: [...PENDING] }, updatedAt: { lt: fiveDaysAgo } },
          select: { id: true },
          take: 200,
        }),
        healthDb.adviceRequest.count({ where: { pharmacyId: inIds, status: 'OPEN' } }),
        healthDb.adviceRequest.findFirst({
          where: { pharmacyId: inIds, status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
          select: { subject: true, createdAt: true },
        }),
        healthDb.appointment.count({
          where: { pharmacyId: inIds, status: 'CONFIRMED', scheduledAt: { gte: startOfDay, lt: endOfDay } },
        }),
        healthDb.appointment.findFirst({
          where: { pharmacyId: inIds, status: 'CONFIRMED', scheduledAt: { gte: now, lt: endOfDay } },
          orderBy: { scheduledAt: 'asc' },
          select: { scheduledAt: true },
        }),
        engagementDb.missionAssignment.findFirst({
          where: { pharmacyId: inIds, state: { in: [...TO_VALIDATE] } },
          orderBy: { completedAt: 'desc' },
          select: { id: true, patientId: true, missionCode: true },
        }),
      ])

    const missionsToValidate = toValidateGroups.reduce((s, g) => s + g._count._all, 0)
    const caPending = Math.round(toValidateGroups.reduce((s, g) => s + g._count._all * forfait(g.missionCode), 0))
    const caAmeliToday = Math.round(validatedTodayGroups.reduce((s, g) => s + g._count._all * forfait(g.missionCode), 0))

    let sample: { id: string; patientName: string; title: string; attentionCount: number } | null = null
    if (sampleAssign) {
      const [patient, response] = await Promise.all([
        engagementDb.patient.findUnique({
          where: { id: sampleAssign.patientId },
          select: { firstName: true, lastName: true },
        }),
        healthDb.missionResponse.findUnique({
          where: { assignmentId: sampleAssign.id },
          select: { attentionPoints: true },
        }),
      ])
      sample = {
        id: sampleAssign.id,
        patientName: `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim() || 'Patient',
        title: getMissionTemplate(sampleAssign.missionCode)?.shortTitle ?? sampleAssign.missionCode,
        attentionCount: response?.attentionPoints.length ?? 0,
      }
    }

    const relanceIds = pendingStale.map((p) => p.id)
    const aTraiter = missionsToValidate + conseilsCount + relanceIds.length
    return {
      counts: { aTraiter, missionsToValidate, conseils: conseilsCount, relances: relanceIds.length },
      caAmeliToday,
      missions: { count: missionsToValidate, caPending, sample },
      conseils: {
        count: conseilsCount,
        sample: conseilSample ? { subject: conseilSample.subject, at: conseilSample.createdAt } : null,
      },
      relances: { count: relanceIds.length, ids: relanceIds },
      rdv: { count: rdvCount, nextAt: rdvNext?.scheduledAt ?? null },
    }
  }),
})
