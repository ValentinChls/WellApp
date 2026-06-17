import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { engagementDb, healthDb, writeAudit, writeKpi, hasConsent, Health } from '@wellpharma/db'
import { notifyUser } from '../lib/notify'
import { router, publicProcedure, patientProcedure } from '../trpc'

/** Code d'acte (config engagement) → catégorie de l'enum santé. */
function codeToEnum(code: string): Health.AppointmentType {
  if (code === 'VACCINATION') return Health.AppointmentType.VACCINATION
  if (code === 'ENTRETIEN' || code === 'BPM') return Health.AppointmentType.PHARMACEUTICAL_INTERVIEW
  return Health.AppointmentType.OTHER
}

async function assertHealthConsent(patientId: string, pharmacyId: string) {
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

export const appointmentsRouter = router({
  /** Types d'actes proposés par une officine. */
  listTypes: publicProcedure
    .input(z.object({ pharmacyId: z.string().uuid() }))
    .query(({ input }) =>
      engagementDb.appointmentType.findMany({
        where: { pharmacyId: input.pharmacyId, active: true },
        select: { id: true, code: true, label: true, durationMin: true },
        orderBy: { label: 'asc' },
      }),
    ),

  /** Créneaux libres à venir pour un type d'acte. */
  listSlots: publicProcedure
    .input(z.object({ appointmentTypeId: z.string().uuid() }))
    .query(({ input }) =>
      engagementDb.appointmentSlot.findMany({
        where: { appointmentTypeId: input.appointmentTypeId, status: 'FREE', startsAt: { gt: new Date() } },
        select: { id: true, appointmentTypeId: true, startsAt: true },
        orderBy: { startsAt: 'asc' },
        take: 60,
      }),
    ),

  /** Rendez-vous du patient connecté. Accès tracé. */
  listMine: patientProcedure.query(async ({ ctx }) => {
    const patientId = ctx.user.patientId
    if (!patientId) return []
    const rows = await healthDb.appointment.findMany({
      where: { patientId },
      select: {
        id: true,
        appointmentTypeCode: true,
        scheduledAt: true,
        status: true,
        pharmacyId: true,
      },
      orderBy: { scheduledAt: 'desc' },
    })
    await writeAudit({
      actorUserId: ctx.user.id,
      actorRole: ctx.user.role,
      action: Health.AuditAction.READ,
      entityType: 'Appointment',
      entityId: 'list',
      patientId,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    })
    return rows
  }),

  /** Réserve un créneau : revendication atomique (engagement) + RDV santé + audit. */
  book: patientProcedure
    .input(z.object({ slotId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const patientId = ctx.user.patientId
      if (!patientId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Profil patient manquant.' })

      const slot = await engagementDb.appointmentSlot.findUnique({
        where: { id: input.slotId },
        include: { appointmentType: true },
      })
      if (!slot || slot.status !== 'FREE' || slot.startsAt <= new Date()) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Créneau indisponible.' })
      }
      await assertHealthConsent(patientId, slot.pharmacyId)

      // Revendication atomique du créneau (FREE → BOOKED).
      const claim = await engagementDb.appointmentSlot.updateMany({
        where: { id: slot.id, status: 'FREE' },
        data: { status: 'BOOKED' },
      })
      if (claim.count === 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Créneau déjà réservé.' })
      }

      let appointment: { id: string; scheduledAt: Date | null; status: string; appointmentTypeCode: string | null }
      try {
        appointment = await healthDb.$transaction(async (tx) => {
          const a = await tx.appointment.create({
            data: {
              patientId,
              pharmacyId: slot.pharmacyId,
              type: codeToEnum(slot.appointmentType.code),
              slotId: slot.id,
              appointmentTypeCode: slot.appointmentType.code,
              status: Health.AppointmentStatus.CONFIRMED,
              scheduledAt: slot.startsAt,
            },
            select: { id: true, scheduledAt: true, status: true, appointmentTypeCode: true },
          })
          await tx.auditLog.create({
            data: {
              actorUserId: ctx.user.id,
              actorRole: ctx.user.role,
              action: Health.AuditAction.CREATE,
              entityType: 'Appointment',
              entityId: a.id,
              patientId,
              ipAddress: ctx.ip,
              userAgent: ctx.userAgent,
            },
          })
          return a
        })
      } catch (error) {
        // Compensation : libérer le créneau si la création santé échoue.
        await engagementDb.appointmentSlot
          .updateMany({ where: { id: slot.id }, data: { status: 'FREE', bookedAppointmentId: null } })
          .catch(() => undefined)
        throw error
      }

      await engagementDb.appointmentSlot
        .update({ where: { id: slot.id }, data: { bookedAppointmentId: appointment.id } })
        .catch(() => undefined)

      // KPI : on NE met PAS le type d'acte (donnée de santé) dans le domaine
      // engagement. Comptage de réservation uniquement (pharmacie + sujet pseudonymisé).
      await writeKpi({
        name: 'appointment_booked',
        pharmacyId: slot.pharmacyId,
        subjectId: patientId,
      })

      const when = slot.startsAt.toISOString().slice(0, 16).replace('T', ' à ')
      await notifyUser({
        userId: ctx.user.id,
        kind: 'appointment_confirmed',
        title: 'Rendez-vous confirmé',
        body: `Votre rendez-vous est confirmé pour le ${when}.`,
      })
      return appointment
    }),

  /** Annule un rendez-vous (propriétaire) + libère le créneau. */
  cancel: patientProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const patientId = ctx.user.patientId
      if (!patientId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Profil patient manquant.' })
      const appt = await healthDb.appointment.findUnique({
        where: { id: input.appointmentId },
        select: { id: true, patientId: true, slotId: true, pharmacyId: true },
      })
      if (!appt || appt.patientId !== patientId) throw new TRPCError({ code: 'NOT_FOUND' })

      await healthDb.appointment.update({
        where: { id: appt.id },
        data: { status: Health.AppointmentStatus.CANCELLED },
      })
      await writeAudit({
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: Health.AuditAction.UPDATE,
        entityType: 'Appointment',
        entityId: appt.id,
        patientId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      })
      if (appt.slotId) {
        await engagementDb.appointmentSlot.updateMany({
          where: { id: appt.slotId },
          data: { status: 'FREE', bookedAppointmentId: null },
        })
      }
      await writeKpi({ name: 'appointment_cancelled', pharmacyId: appt.pharmacyId, subjectId: patientId })
      return { ok: true }
    }),
})
