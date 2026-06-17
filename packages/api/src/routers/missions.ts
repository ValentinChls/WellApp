import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb, healthDb, seal, open, writeAudit, Health } from '@wellpharma/db'
import {
  MISSION_TEMPLATES,
  computeAge,
  computeAttentionPoints,
  evaluateEligibility,
  getMissionTemplate,
  isMissionComplete,
  type MissionConfig,
} from '@wellpharma/shared'

/** Validation de la personnalisation d'une mission (config groupement). */
const missionConfigSchema = z.object({
  patientMessage: z.string().max(280).optional(),
  relanceDays: z.number().int().min(0).max(90).optional(),
  channel: z.enum(['PUSH', 'SMS', 'QR', 'TABLET']).optional(),
})

/** Lit la personnalisation groupement d'une mission (canal, message, relances). */
async function getMissionConfig(missionCode: string): Promise<MissionConfig | null> {
  const groupement = await engagementDb.groupement.findFirst({ select: { id: true } })
  if (!groupement) return null
  const a = await engagementDb.missionActivation.findUnique({
    where: { groupementId_missionCode: { groupementId: groupement.id, missionCode } },
    select: { config: true },
  })
  return (a?.config as MissionConfig | null) ?? null
}
import { notifyUser } from '../lib/notify'
import { assertPharmacyInScope, resolveScopedPharmacyIds } from '../lib/scope'
import { router, patientProcedure, pharmacyProcedure, groupementProcedure } from '../trpc'

const PHARMACIEN_TODO_STATES = ['COMPLETEE', 'A_VALIDER'] as const

/**
 * Moteur de missions — pilotage (groupement + pharmacien) & parcours patient.
 * Réponses patient = SANTÉ (chiffrées at-rest, tracées). Métadonnées d'état =
 * ENGAGEMENT. Refs patient/pharmacie = UUID opaques (pas de FK inter-domaine).
 */
export const missionsRouter = router({
  // ───────────────────────── GROUPEMENT : catalogue & activation
  catalog: groupementProcedure.query(async () => {
    const groupement = await engagementDb.groupement.findFirst({ select: { id: true } })
    const activations = groupement
      ? await engagementDb.missionActivation.findMany({ where: { groupementId: groupement.id } })
      : []
    const byCode = new Map(activations.map((a) => [a.missionCode, a.active]))
    const configByCode = new Map(activations.map((a) => [a.missionCode, a.config]))
    // Funnel par mission (proposées → complétées → validées) pour le pilotage + CA.
    const rows = await engagementDb.missionAssignment.groupBy({
      by: ['missionCode', 'state'],
      _count: { _all: true },
    })
    const funnelByCode = new Map<string, { total: number; completees: number; validees: number }>()
    for (const r of rows) {
      const f = funnelByCode.get(r.missionCode) ?? { total: 0, completees: 0, validees: 0 }
      f.total += r._count._all
      if (r.state === 'COMPLETEE' || r.state === 'A_VALIDER') f.completees += r._count._all
      if (r.state === 'VALIDEE' || r.state === 'FACTUREE') f.validees += r._count._all
      funnelByCode.set(r.missionCode, f)
    }
    return MISSION_TEMPLATES.map((t) => {
      const f = funnelByCode.get(t.code) ?? { total: 0, completees: 0, validees: 0 }
      return {
        code: t.code,
        type: t.type,
        shortTitle: t.shortTitle,
        title: t.title,
        estimatedMin: t.estimatedMin,
        accent: t.accent,
        icon: t.icon,
        recurrence: t.recurrence,
        remuneration: t.remuneration ?? null,
        eligibility: t.eligibility,
        active: byCode.get(t.code) ?? false,
        config: (configByCode.get(t.code) as MissionConfig | null | undefined) ?? null,
        assignmentCount: f.total,
        completees: f.completees,
        validees: f.validees,
        // CA Ameli généré = missions validées × forfait.
        caEur: t.remuneration ? Math.round(f.validees * t.remuneration.amountEur) : 0,
      }
    })
  }),

  setActivation: groupementProcedure
    .input(
      z.object({
        missionCode: z.string().max(60),
        active: z.boolean(),
        config: missionConfigSchema.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!getMissionTemplate(input.missionCode)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mission inconnue.' })
      }
      const groupement = await engagementDb.groupement.findFirst({ select: { id: true } })
      if (!groupement) throw new TRPCError({ code: 'NOT_FOUND', message: 'Groupement introuvable.' })
      // config absent = on ne touche pas à la personnalisation existante.
      const configPatch = input.config !== undefined ? { config: input.config } : {}
      await engagementDb.missionActivation.upsert({
        where: { groupementId_missionCode: { groupementId: groupement.id, missionCode: input.missionCode } },
        update: { active: input.active, ...configPatch },
        create: {
          groupementId: groupement.id,
          missionCode: input.missionCode,
          active: input.active,
          ...configPatch,
        },
      })
      return { ok: true }
    }),

  /** Benchmark + activité par officine (groupement) — alimente carte & classement. */
  networkStats: groupementProcedure.query(async () => {
    const [byPharmacy, pharmacies] = await Promise.all([
      engagementDb.missionAssignment.groupBy({ by: ['pharmacyId', 'state'], _count: { _all: true } }),
      engagementDb.pharmacy.findMany({ select: { id: true, cip: true, name: true, city: true } }),
    ])
    const metaById = new Map(pharmacies.map((p) => [p.id, p]))
    const agg = new Map<string, { total: number; validees: number }>()
    for (const r of byPharmacy) {
      const a = agg.get(r.pharmacyId) ?? { total: 0, validees: 0 }
      a.total += r._count._all
      if (r.state === 'VALIDEE' || r.state === 'FACTUREE') a.validees += r._count._all
      agg.set(r.pharmacyId, a)
    }
    // Activité par officine (clé cip → drill-down carte réseau).
    const activity = [...agg.entries()].map(([id, a]) => {
      const m = metaById.get(id)
      return {
        pharmacyId: id,
        cip: m?.cip ?? '',
        name: m?.name ?? 'Officine',
        city: m?.city ?? '',
        total: a.total,
        validees: a.validees,
        completion: a.total ? Math.round((a.validees / a.total) * 100) : 0,
      }
    })
    const ranking = [...activity]
      .map((a) => ({
        pharmacyId: a.pharmacyId,
        name: `${a.name}${a.city ? ` — ${a.city}` : ''}`,
        total: a.total,
        validees: a.validees,
        completion: a.completion,
      }))
      .sort((x, y) => y.validees - x.validees)
      .slice(0, 10)
    return { ranking, activity }
  }),

  // ───────────────────────── PHARMACIEN : file & validation
  inbox: pharmacyProcedure
    .input(z.object({ pharmacyId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const ids = await resolveScopedPharmacyIds(ctx.user, input?.pharmacyId)
      if (ids.length === 0) return { items: [], counts: { aValider: 0, enCours: 0, validees: 0 } }

      const rows = await engagementDb.missionAssignment.findMany({
        where: { pharmacyId: { in: ids } },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      })
      const patientIds = [...new Set(rows.map((r) => r.patientId))]
      const assignmentIds = rows.map((r) => r.id)
      const [patients, responses] = await Promise.all([
        engagementDb.patient.findMany({
          where: { id: { in: patientIds } },
          select: { id: true, firstName: true, lastName: true },
        }),
        healthDb.missionResponse.findMany({
          where: { assignmentId: { in: assignmentIds } },
          select: { assignmentId: true, attentionPoints: true },
        }),
      ])
      const nameById = new Map(
        patients.map((p) => [p.id, `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Patient']),
      )
      const attnById = new Map(responses.map((r) => [r.assignmentId, r.attentionPoints.length]))

      const items = rows.map((r) => {
        const tpl = getMissionTemplate(r.missionCode)
        return {
          id: r.id,
          missionCode: r.missionCode,
          title: tpl?.shortTitle ?? r.missionCode,
          accent: tpl?.accent ?? '#009dc5',
          state: r.state as string,
          patientName: nameById.get(r.patientId) ?? 'Patient',
          attentionCount: attnById.get(r.id) ?? 0,
          remuneration: tpl?.remuneration?.amountEur ?? null,
          proposedAt: r.proposedAt,
          completedAt: r.completedAt,
        }
      })
      const counts = {
        aValider: items.filter((i) => PHARMACIEN_TODO_STATES.includes(i.state as never)).length,
        enCours: items.filter((i) => i.state === 'EN_COURS' || i.state === 'PROPOSEE').length,
        validees: items.filter((i) => i.state === 'VALIDEE' || i.state === 'FACTUREE').length,
      }
      return { items, counts }
    }),

  /** Détail à valider : réponses DÉCHIFFRÉES + points d'attention. Tracé. */
  assignment: pharmacyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const a = await engagementDb.missionAssignment.findUnique({ where: { id: input.id } })
      if (!a) throw new TRPCError({ code: 'NOT_FOUND' })
      assertPharmacyInScope(ctx.user, a.pharmacyId)

      const response = await healthDb.missionResponse.findUnique({ where: { assignmentId: a.id } })
      const patient = await engagementDb.patient.findUnique({
        where: { id: a.patientId },
        select: { firstName: true, lastName: true, birthDate: true },
      })

      let answers: Record<string, unknown> = {}
      let note: string | null = null
      if (response) {
        answers = JSON.parse(open(response.answersEncrypted)) as Record<string, unknown>
        if (response.validationNoteEncrypted) note = open(response.validationNoteEncrypted)
        await writeAudit({
          actorUserId: ctx.user.id,
          actorRole: ctx.user.role,
          action: Health.AuditAction.READ,
          entityType: 'MissionResponse',
          entityId: a.id,
          patientId: a.patientId,
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        })
      }
      return {
        id: a.id,
        missionCode: a.missionCode,
        state: a.state as string,
        patientName: `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim() || 'Patient',
        completedAt: a.completedAt,
        validatedAt: a.validatedAt,
        answers,
        attentionPoints: response?.attentionPoints ?? [],
        note,
        signedOff: response?.signedOff ?? false,
      }
    }),

  /** Validation pharmacien : sign-off → VALIDEE (+ note chiffrée). Tracé + KPI. */
  validate: pharmacyProcedure
    .input(z.object({ id: z.string().uuid(), note: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const a = await engagementDb.missionAssignment.findUnique({ where: { id: input.id } })
      if (!a) throw new TRPCError({ code: 'NOT_FOUND' })
      assertPharmacyInScope(ctx.user, a.pharmacyId)

      await engagementDb.missionAssignment.update({
        where: { id: a.id },
        data: { state: 'VALIDEE', validatedAt: new Date(), validatedByUserId: ctx.user.id },
      })
      const noteData = input.note ? new Uint8Array(seal(input.note)) : undefined
      await healthDb.missionResponse.updateMany({
        where: { assignmentId: a.id },
        data: { signedOff: true, ...(noteData ? { validationNoteEncrypted: noteData } : {}) },
      })
      await Promise.all([
        writeAudit({
          actorUserId: ctx.user.id,
          actorRole: ctx.user.role,
          action: Health.AuditAction.UPDATE,
          entityType: 'MissionResponse',
          entityId: a.id,
          patientId: a.patientId,
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        }),
        engagementDb.kpiEvent.create({ data: { name: 'mission_validated', pharmacyId: a.pharmacyId } }),
      ])
      return { ok: true }
    }),

  /** Missions actives (activées par le groupement) — proposables par l'officine. */
  activeForPharmacy: pharmacyProcedure.query(async () => {
    const groupement = await engagementDb.groupement.findFirst({ select: { id: true } })
    const activations = groupement
      ? await engagementDb.missionActivation.findMany({
          where: { groupementId: groupement.id, active: true },
          select: { missionCode: true },
        })
      : []
    const active = new Set(activations.map((a) => a.missionCode))
    return MISSION_TEMPLATES.filter((t) => active.has(t.code)).map((t) => ({
      code: t.code,
      shortTitle: t.shortTitle,
      accent: t.accent,
      estimatedMin: t.estimatedMin,
      remuneration: t.remuneration?.amountEur ?? null,
    }))
  }),

  /** Proposer une mission à un patient (crée une affectation). */
  propose: pharmacyProcedure
    .input(z.object({ patientId: z.string().uuid(), missionCode: z.string().max(60), channel: z.string().max(20).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!getMissionTemplate(input.missionCode)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mission inconnue.' })
      }
      const pharmacyId = ctx.user.role === 'ADMIN_PHARMACIE' ? ctx.user.pharmacyId : null
      if (!pharmacyId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pharmacie absente.' })
      const cfg = await getMissionConfig(input.missionCode)
      const a = await engagementDb.missionAssignment.create({
        data: {
          missionCode: input.missionCode,
          pharmacyId,
          patientId: input.patientId,
          channel: input.channel ?? cfg?.channel ?? 'PUSH',
          state: 'PROPOSEE',
        },
        select: { id: true },
      })
      await engagementDb.kpiEvent.create({ data: { name: 'mission_proposed', pharmacyId } })
      return a
    }),

  /** Relancer un patient sur une mission en cours (incrément + notification douce). */
  relance: pharmacyProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const a = await engagementDb.missionAssignment.findUnique({ where: { id: input.id } })
    if (!a) throw new TRPCError({ code: 'NOT_FOUND' })
    assertPharmacyInScope(ctx.user, a.pharmacyId)
    await engagementDb.missionAssignment.update({
      where: { id: a.id },
      data: { relanceCount: { increment: 1 } },
    })
    const patientUser = await engagementDb.user.findFirst({
      where: { patientId: a.patientId },
      select: { id: true },
    })
    if (patientUser) {
      const cfg = await getMissionConfig(a.missionCode)
      await notifyUser({
        userId: patientUser.id,
        kind: 'mission_relance',
        title: 'Un rappel de votre pharmacien',
        body:
          cfg?.patientMessage ||
          'Votre pharmacien vous invite à compléter votre mission quand vous le pourrez.',
      }).catch(() => undefined)
    }
    await engagementDb.kpiEvent.create({ data: { name: 'mission_relance', pharmacyId: a.pharmacyId } })
    return { ok: true }
  }),

  /** Relance EN LOT : relance plusieurs affectations d'un coup (cockpit). */
  relanceBatch: pharmacyProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const scoped = await resolveScopedPharmacyIds(ctx.user)
      const assignments = await engagementDb.missionAssignment.findMany({
        where: { id: { in: input.ids }, pharmacyId: { in: scoped } },
        select: { id: true, patientId: true, pharmacyId: true },
      })
      if (assignments.length === 0) return { relanced: 0 }
      await engagementDb.missionAssignment.updateMany({
        where: { id: { in: assignments.map((a) => a.id) } },
        data: { relanceCount: { increment: 1 } },
      })
      const patientIds = [...new Set(assignments.map((a) => a.patientId))]
      const users = await engagementDb.user.findMany({
        where: { patientId: { in: patientIds } },
        select: { id: true },
      })
      await Promise.all(
        users.map((u) =>
          notifyUser({
            userId: u.id,
            kind: 'mission_relance',
            title: 'Un rappel de votre pharmacien',
            body: 'Votre pharmacien vous invite à compléter votre mission quand vous le pourrez.',
          }).catch(() => undefined),
        ),
      )
      await engagementDb.kpiEvent.createMany({
        data: assignments.map((a) => ({ name: 'mission_relance', pharmacyId: a.pharmacyId })),
      })
      return { relanced: assignments.length }
    }),

  /**
   * Éligibles : moteur de ciblage. Patients référence SANS affectation active,
   * évalués contre la règle machine de la mission (âge/sexe — données engagement,
   * RGPD-clean). Les missions « requiresTreatment » renvoient des candidats
   * PROBABLES (needsLgo=true) : le traitement sera confirmé via le connecteur LGO.
   */
  eligible: pharmacyProcedure
    .input(z.object({ missionCode: z.string().max(60) }))
    .query(async ({ ctx, input }) => {
      const template = getMissionTemplate(input.missionCode)
      if (!template) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mission inconnue.' })
      const ids = await resolveScopedPharmacyIds(ctx.user)
      if (ids.length === 0) return { eligible: [], needsLgo: [], excluded: 0 }
      const affs = await engagementDb.affiliation.findMany({
        where: { pharmacyId: { in: ids }, type: 'REFERENCE' },
        select: { patientId: true },
      })
      const patientIds = [...new Set(affs.map((a) => a.patientId))]
      if (patientIds.length === 0) return { eligible: [], needsLgo: [], excluded: 0 }
      const existing = await engagementDb.missionAssignment.findMany({
        where: {
          patientId: { in: patientIds },
          missionCode: input.missionCode,
          state: { notIn: ['ANNULEE', 'REFUSEE', 'EXPIREE'] },
        },
        select: { patientId: true },
      })
      const has = new Set(existing.map((e) => e.patientId))
      const candidateIds = patientIds.filter((pid) => !has.has(pid))
      const patients = await engagementDb.patient.findMany({
        where: { id: { in: candidateIds } },
        select: { id: true, firstName: true, lastName: true, birthDate: true, sex: true },
      })
      const now = new Date()
      type Row = { id: string; name: string; age: number | null; reasons: string[] }
      const eligible: Row[] = []
      const needsLgo: Row[] = []
      let excluded = 0
      for (const p of patients) {
        const age = computeAge(p.birthDate, now)
        const verdict = evaluateEligibility(template, { age, sex: p.sex ?? null })
        if (!verdict.eligible) {
          excluded += 1
          continue
        }
        const row: Row = {
          id: p.id,
          name: `${p.lastName ?? ''} ${p.firstName ?? ''}`.trim() || 'Patient',
          age,
          reasons: verdict.reasons,
        }
        if (verdict.needsLgo) needsLgo.push(row)
        else eligible.push(row)
      }
      const byName = (a: Row, b: Row) => a.name.localeCompare(b.name, 'fr')
      eligible.sort(byName)
      needsLgo.sort(byName)
      return { eligible, needsLgo, excluded }
    }),

  /** Proposer une mission à plusieurs patients d'un coup (ciblage en lot). */
  proposeBatch: pharmacyProcedure
    .input(
      z.object({
        patientIds: z.array(z.string().uuid()).min(1).max(100),
        missionCode: z.string().max(60),
        channel: z.string().max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!getMissionTemplate(input.missionCode)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mission inconnue.' })
      }
      const pharmacyId = ctx.user.role === 'ADMIN_PHARMACIE' ? ctx.user.pharmacyId : null
      if (!pharmacyId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pharmacie absente.' })
      // Idempotent : on ignore les patients déjà ciblés (affectation active).
      const existing = await engagementDb.missionAssignment.findMany({
        where: {
          patientId: { in: input.patientIds },
          missionCode: input.missionCode,
          state: { notIn: ['ANNULEE', 'REFUSEE', 'EXPIREE'] },
        },
        select: { patientId: true },
      })
      const has = new Set(existing.map((e) => e.patientId))
      const toCreate = input.patientIds.filter((pid) => !has.has(pid))
      if (toCreate.length === 0) return { created: 0 }
      const cfg = await getMissionConfig(input.missionCode)
      const channel = input.channel ?? cfg?.channel ?? 'PUSH'
      await engagementDb.missionAssignment.createMany({
        data: toCreate.map((pid) => ({
          missionCode: input.missionCode,
          pharmacyId,
          patientId: pid,
          channel,
        })),
      })
      await engagementDb.kpiEvent.createMany({
        data: toCreate.map(() => ({ name: 'mission_proposed', pharmacyId })),
      })
      return { created: toCreate.length }
    }),

  // ───────────────────────── PATIENT : parcours (réel)
  mine: patientProcedure.query(async ({ ctx }) => {
    const patientId = ctx.user.patientId
    if (!patientId) return []
    const rows = await engagementDb.missionAssignment.findMany({
      where: { patientId },
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map((r) => ({ id: r.id, missionCode: r.missionCode, state: r.state as string }))
  }),

  getMine: patientProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const patientId = ctx.user.patientId
    const a = await engagementDb.missionAssignment.findUnique({ where: { id: input.id } })
    if (!a || a.patientId !== patientId) throw new TRPCError({ code: 'NOT_FOUND' })
    const response = await healthDb.missionResponse.findUnique({ where: { assignmentId: a.id } })
    return {
      id: a.id,
      missionCode: a.missionCode,
      state: a.state as string,
      answers: response ? (JSON.parse(open(response.answersEncrypted)) as Record<string, unknown>) : {},
    }
  }),

  saveAnswers: patientProcedure
    .input(z.object({ id: z.string().uuid(), answers: z.record(z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const patientId = ctx.user.patientId
      const a = await engagementDb.missionAssignment.findUnique({ where: { id: input.id } })
      if (!a || a.patientId !== patientId) throw new TRPCError({ code: 'NOT_FOUND' })
      const enc = new Uint8Array(seal(JSON.stringify(input.answers)))
      await healthDb.missionResponse.upsert({
        where: { assignmentId: a.id },
        update: { answersEncrypted: enc },
        create: {
          assignmentId: a.id,
          patientId: a.patientId,
          pharmacyId: a.pharmacyId,
          missionCode: a.missionCode,
          answersEncrypted: enc,
        },
      })
      if (a.state === 'PROPOSEE' || a.state === 'OUVERTE') {
        await engagementDb.missionAssignment.update({ where: { id: a.id }, data: { state: 'EN_COURS' } })
      }
      return { ok: true }
    }),

  submitMine: patientProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const patientId = ctx.user.patientId
    const a = await engagementDb.missionAssignment.findUnique({ where: { id: input.id } })
    if (!a || a.patientId !== patientId) throw new TRPCError({ code: 'NOT_FOUND' })
    const template = getMissionTemplate(a.missionCode)
    const response = await healthDb.missionResponse.findUnique({ where: { assignmentId: a.id } })
    if (!template || !response) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Réponses manquantes.' })
    const answers = JSON.parse(open(response.answersEncrypted)) as Record<string, unknown>
    if (!isMissionComplete(template, answers)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mission incomplète.' })
    }
    const attention = computeAttentionPoints(template, answers)
    await healthDb.missionResponse.update({
      where: { assignmentId: a.id },
      data: { attentionPoints: attention, submittedAt: new Date() },
    })
    await engagementDb.missionAssignment.update({
      where: { id: a.id },
      data: { state: 'A_VALIDER', completedAt: new Date() },
    })
    const staff = await engagementDb.user.findMany({
      where: { pharmacyId: a.pharmacyId, role: 'ADMIN_PHARMACIE' },
      select: { id: true },
    })
    await Promise.all(
      staff.map((u) =>
        notifyUser({
          userId: u.id,
          kind: 'mission_completed',
          title: 'Mission patient complétée',
          body: 'Un patient a complété une mission. Connectez-vous pour la valider.',
          secureResource: { resourceType: 'MissionResponse', resourceId: a.id },
        }),
      ),
    )
    return { ok: true }
  }),
})
