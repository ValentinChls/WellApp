import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb, healthDb, seal, open, writeAudit, hasConsent, Health } from '@wellpharma/db'
import { getInterviewTemplate } from '@wellpharma/shared'
import { notifyUser } from '../lib/notify'
import { resolveScopedPharmacyIds } from '../lib/scope'
import { router, patientProcedure, pharmacyProcedure, protectedProcedure } from '../trpc'

async function assertCanAccessHealth(patientId: string, pharmacyId: string) {
  const [consents, affiliation] = await Promise.all([
    engagementDb.consent.findMany({
      where: { patientId },
      select: { type: true, granted: true, createdAt: true, revokedAt: true },
    }),
    engagementDb.affiliation.findFirst({ where: { patientId, pharmacyId } }),
  ])
  if (!hasConsent(consents, 'HEALTH_DATA')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Consentement « données de santé » requis.' })
  }
  if (!affiliation) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Pharmacie non affiliée au patient.' })
  }
}

function mapType(prismaType: string) {
  switch (prismaType) {
    case 'ASTHME':
      return Health.InterviewType.ASTHME
    case 'AVK':
      return Health.InterviewType.AVK
    case 'AOD':
      return Health.InterviewType.AOD
    case 'ONCOLOGIE':
      return Health.InterviewType.ONCOLOGIE
    default:
      return Health.InterviewType.AUTRE
  }
}

export const interviewsRouter = router({
  /** Entretiens du patient connecté (métadonnées — brouillons + complétés). */
  listMine: patientProcedure.query(async ({ ctx }) => {
    const patientId = ctx.user.patientId
    if (!patientId) return []
    const rows = await healthDb.pharmaceuticalInterview.findMany({
      where: { patientId },
      select: {
        id: true,
        templateCode: true,
        type: true,
        status: true,
        startedAt: true,
        completedAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
    await writeAudit({
      actorUserId: ctx.user.id,
      actorRole: ctx.user.role,
      action: Health.AuditAction.READ,
      entityType: 'PharmaceuticalInterview',
      entityId: 'list',
      patientId,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    })
    return rows
  }),

  /** Crée ou met à jour un brouillon (réponses chiffrées). Consentement requis. */
  saveDraft: patientProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        pharmacyId: z.string().uuid(),
        templateCode: z.string().max(40),
        answers: z.record(z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const patientId = ctx.user.patientId
      if (!patientId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Profil patient manquant.' })
      await assertCanAccessHealth(patientId, input.pharmacyId)
      const template = getInterviewTemplate(input.templateCode)
      if (!template) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Modèle d’entretien inconnu.' })

      const encrypted = new Uint8Array(seal(JSON.stringify(input.answers)))

      if (input.id) {
        const existing = await healthDb.pharmaceuticalInterview.findUnique({
          where: { id: input.id },
          select: { patientId: true, status: true },
        })
        if (!existing || existing.patientId !== patientId) throw new TRPCError({ code: 'NOT_FOUND' })
        if (existing.status === 'COMPLETED') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Entretien déjà finalisé.' })
        }
        return healthDb.$transaction(async (tx) => {
          const row = await tx.pharmaceuticalInterview.update({
            where: { id: input.id },
            data: { answersEncrypted: encrypted, status: 'IN_PROGRESS' },
            select: { id: true, status: true },
          })
          await tx.auditLog.create({
            data: {
              actorUserId: ctx.user.id,
              actorRole: ctx.user.role,
              action: Health.AuditAction.UPDATE,
              entityType: 'PharmaceuticalInterview',
              entityId: row.id,
              patientId,
              ipAddress: ctx.ip,
              userAgent: ctx.userAgent,
            },
          })
          return row
        })
      }

      return healthDb.$transaction(async (tx) => {
        const row = await tx.pharmaceuticalInterview.create({
          data: {
            patientId,
            pharmacyId: input.pharmacyId,
            type: mapType(template.prismaType),
            templateCode: template.code,
            status: 'DRAFT',
            answersEncrypted: encrypted,
            startedAt: new Date(),
          },
          select: { id: true, status: true },
        })
        await tx.auditLog.create({
          data: {
            actorUserId: ctx.user.id,
            actorRole: ctx.user.role,
            action: Health.AuditAction.CREATE,
            entityType: 'PharmaceuticalInterview',
            entityId: row.id,
            patientId,
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
          },
        })
        return row
      })
    }),

  /** Finalise l'entretien + notifie l'officine (alerte générique + lien sécurisé). */
  submit: patientProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const patientId = ctx.user.patientId
    if (!patientId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Profil patient manquant.' })
    const interview = await healthDb.pharmaceuticalInterview.findUnique({
      where: { id: input.id },
      select: { patientId: true, pharmacyId: true },
    })
    if (!interview || interview.patientId !== patientId) throw new TRPCError({ code: 'NOT_FOUND' })

    const completed = await healthDb.$transaction(async (tx) => {
      const row = await tx.pharmaceuticalInterview.update({
        where: { id: input.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
        select: { id: true, status: true },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: ctx.user.id,
          actorRole: ctx.user.role,
          action: Health.AuditAction.UPDATE,
          entityType: 'PharmaceuticalInterview',
          entityId: row.id,
          patientId,
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        },
      })
      return row
    })

    const staff = await engagementDb.user.findMany({
      where: { pharmacyId: interview.pharmacyId, role: 'ADMIN_PHARMACIE' },
      select: { id: true },
    })
    await Promise.all(
      staff.map((u) =>
        notifyUser({
          userId: u.id,
          kind: 'interview_completed',
          title: 'Entretien pharmaceutique complété',
          body: 'Un patient a finalisé un entretien. Connectez-vous à votre espace pour le consulter.',
          secureResource: { resourceType: 'PharmaceuticalInterview', resourceId: completed.id },
        }),
      ),
    )
    return completed
  }),

  /** Détail (réponses déchiffrées) — patient propriétaire OU staff de l'officine. Tracé. */
  get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const row = await healthDb.pharmaceuticalInterview.findUnique({ where: { id: input.id } })
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
    const isOwner = Boolean(ctx.user.patientId && row.patientId === ctx.user.patientId)
    const isStaff =
      ctx.user.role === 'SUPER_ADMIN_GROUPEMENT' ||
      (ctx.user.role === 'ADMIN_PHARMACIE' && ctx.user.pharmacyId === row.pharmacyId)
    if (!isOwner && !isStaff) throw new TRPCError({ code: 'FORBIDDEN' })

    await writeAudit({
      actorUserId: ctx.user.id,
      actorRole: ctx.user.role,
      action: Health.AuditAction.READ,
      entityType: 'PharmaceuticalInterview',
      entityId: row.id,
      patientId: row.patientId,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    })
    return {
      id: row.id,
      templateCode: row.templateCode,
      type: row.type,
      status: row.status,
      answers: JSON.parse(open(row.answersEncrypted)) as Record<string, unknown>,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      pharmacyId: row.pharmacyId,
    }
  }),

  /** Inbox officine : entretiens complétés (métadonnées). Tracé. */
  listForPharmacy: pharmacyProcedure
    .input(z.object({ pharmacyId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      // Périmètre RBAC : admin = sa pharmacie ; super = groupement (filtrable).
      const ids = await resolveScopedPharmacyIds(ctx.user, input?.pharmacyId)
      if (ids.length === 0) return []
      const rows = await healthDb.pharmaceuticalInterview.findMany({
        where: { pharmacyId: { in: ids }, status: 'COMPLETED' },
        select: { id: true, templateCode: true, type: true, status: true, completedAt: true },
        orderBy: { completedAt: 'desc' },
      })
      await writeAudit({
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: Health.AuditAction.READ,
        entityType: 'PharmaceuticalInterview',
        entityId: 'list',
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      })
      return rows
    }),
})
