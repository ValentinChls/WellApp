import { healthDb } from './health'
import type { AuditAction } from './generated/health'

/**
 * Écriture du journal d'audit santé (NON NÉGOCIABLE #4).
 * À appeler systématiquement depuis la couche API à chaque accès/modif
 * d'une donnée santé (AdviceRequest, PharmaceuticalInterview, Appointment).
 */
export interface AuditInput {
  actorUserId: string
  actorRole: string
  action: AuditAction
  entityType: 'AdviceRequest' | 'PharmaceuticalInterview' | 'Appointment' | 'MissionResponse'
  entityId: string
  patientId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}

export function writeAudit(input: AuditInput) {
  return healthDb.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      patientId: input.patientId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: (input.metadata ?? undefined) as object | undefined,
    },
  })
}
