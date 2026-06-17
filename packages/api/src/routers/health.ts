import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb, healthDb, seal, open, writeAudit, hasConsent, Health } from '@wellpharma/db'
import { notifyUser } from '../lib/notify'
import { interviewsRouter } from './interviews'
import { resolveScopedPharmacyIds } from '../lib/scope'
import { router, patientProcedure, pharmacyProcedure, protectedProcedure } from '../trpc'

/**
 * Domaine SANTÉ — demandes de conseil. Garde-fous appliqués :
 *  - consentement HEALTH_DATA + affiliation avant tout traitement,
 *  - chiffrement at-rest du contenu (`seal`/`open`),
 *  - journal d'audit ATOMIQUE,
 *  - notification pharmacie = alerte générique + lien sécurisé (jamais de contenu).
 */
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

export const healthRouter = router({
  adviceRequests: router({
    /** Demandes du patient connecté (métadonnées uniquement). */
    listMine: patientProcedure.query(async ({ ctx }) => {
      const patientId = ctx.user.patientId
      if (!patientId) return []
      const rows = await healthDb.adviceRequest.findMany({
        where: { patientId },
        select: { id: true, subject: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
      await writeAudit({
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: Health.AuditAction.READ,
        entityType: 'AdviceRequest',
        entityId: 'list',
        patientId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      })
      return rows
    }),

    /** Crée une demande — consentement vérifié, contenu chiffré, audit atomique, notif pharmacie. */
    create: patientProcedure
      .input(
        z.object({
          pharmacyId: z.string().uuid(),
          subject: z.string().min(1).max(120),
          body: z.string().min(1).max(5000),
          attachmentPath: z.string().max(512).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const patientId = ctx.user.patientId
        if (!patientId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Profil patient manquant.' })
        }
        await assertCanAccessHealth(patientId, input.pharmacyId)

        const created = await healthDb.$transaction(async (tx) => {
          const row = await tx.adviceRequest.create({
            data: {
              patientId,
              pharmacyId: input.pharmacyId,
              subject: input.subject,
              bodyEncrypted: new Uint8Array(seal(input.body)),
              attachmentPath: input.attachmentPath ?? null,
            },
            select: { id: true, subject: true, status: true, createdAt: true },
          })
          await tx.auditLog.create({
            data: {
              actorUserId: ctx.user.id,
              actorRole: ctx.user.role,
              action: Health.AuditAction.CREATE,
              entityType: 'AdviceRequest',
              entityId: row.id,
              patientId,
              ipAddress: ctx.ip,
              userAgent: ctx.userAgent,
            },
          })
          return row
        })

        // Notifier le staff de l'officine : alerte générique + lien sécurisé.
        const staff = await engagementDb.user.findMany({
          where: { pharmacyId: input.pharmacyId, role: 'ADMIN_PHARMACIE' },
          select: { id: true },
        })
        await Promise.all(
          staff.map((u) =>
            notifyUser({
              userId: u.id,
              kind: 'advice_request_created',
              title: 'Nouvelle demande de conseil',
              body: 'Un patient vous a adressé une demande. Connectez-vous à votre espace pour la consulter.',
              secureResource: { resourceType: 'AdviceRequest', resourceId: created.id },
            }),
          ),
        )
        return created
      }),

    /** Détail (contenu déchiffré) — patient propriétaire OU staff de l'officine. Accès tracé. */
    get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
      const req = await healthDb.adviceRequest.findUnique({ where: { id: input.id } })
      if (!req) throw new TRPCError({ code: 'NOT_FOUND' })
      const isOwner = Boolean(ctx.user.patientId && req.patientId === ctx.user.patientId)
      const isStaff =
        ctx.user.role === 'SUPER_ADMIN_GROUPEMENT' ||
        (ctx.user.role === 'ADMIN_PHARMACIE' && ctx.user.pharmacyId === req.pharmacyId)
      if (!isOwner && !isStaff) throw new TRPCError({ code: 'FORBIDDEN' })

      await writeAudit({
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: Health.AuditAction.READ,
        entityType: 'AdviceRequest',
        entityId: req.id,
        patientId: req.patientId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      })
      return {
        id: req.id,
        subject: req.subject,
        body: open(req.bodyEncrypted),
        status: req.status,
        attachmentPath: req.attachmentPath,
        createdAt: req.createdAt,
        pharmacyId: req.pharmacyId,
      }
    }),

    /** Inbox officine (métadonnées). Accès tracé. */
    listForPharmacy: pharmacyProcedure
      .input(z.object({ pharmacyId: z.string().uuid().optional() }).optional())
      .query(async ({ ctx, input }) => {
        // Périmètre RBAC : admin = sa pharmacie ; super = groupement (filtrable).
        const ids = await resolveScopedPharmacyIds(ctx.user, input?.pharmacyId)
        if (ids.length === 0) return []
        const rows = await healthDb.adviceRequest.findMany({
          where: { pharmacyId: { in: ids } },
          select: { id: true, subject: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        })
        await writeAudit({
          actorUserId: ctx.user.id,
          actorRole: ctx.user.role,
          action: Health.AuditAction.READ,
          entityType: 'AdviceRequest',
          entityId: 'list',
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        })
        return rows
      }),

    /** Transition de statut (officine) : lue / traitée. */
    setStatus: pharmacyProcedure
      .input(z.object({ id: z.string().uuid(), status: z.enum(['IN_PROGRESS', 'ANSWERED']) }))
      .mutation(async ({ ctx, input }) => {
        const req = await healthDb.adviceRequest.findUnique({
          where: { id: input.id },
          select: { pharmacyId: true, patientId: true },
        })
        if (!req) throw new TRPCError({ code: 'NOT_FOUND' })
        if (ctx.user.role === 'ADMIN_PHARMACIE' && ctx.user.pharmacyId !== req.pharmacyId) {
          throw new TRPCError({ code: 'FORBIDDEN' })
        }
        const updated = await healthDb.adviceRequest.update({
          where: { id: input.id },
          data: {
            status: input.status,
            readAt: input.status === 'IN_PROGRESS' ? new Date() : undefined,
            handledAt: input.status === 'ANSWERED' ? new Date() : undefined,
          },
          select: { id: true, status: true },
        })
        await writeAudit({
          actorUserId: ctx.user.id,
          actorRole: ctx.user.role,
          action: Health.AuditAction.UPDATE,
          entityType: 'AdviceRequest',
          entityId: input.id,
          patientId: req.patientId,
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        })
        return updated
      }),
  }),

  interviews: interviewsRouter,
})
