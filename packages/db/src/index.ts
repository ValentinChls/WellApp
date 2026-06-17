/**
 * Point d'entrée du package @wellpharma/db.
 * ⚠️ Code SERVEUR uniquement (Prisma). Ne jamais importer depuis le client RN.
 */
export { engagementDb } from './engagement'
export { healthDb } from './health'

export * from './crypto'
export * from './consent'
export * from './audit'
export * from './kpi'

// Types & enums Prisma générés, namespacés pour éviter la collision `PrismaClient`.
export * as Engagement from './generated/engagement'
export * as Health from './generated/health'
