import { PrismaClient } from './generated/health'

/**
 * Client Prisma du domaine SANTÉ (chiffré, journalisé, HDS-ready).
 * Connexion SÉPARÉE du domaine engagement (URL distincte → split HDS trivial).
 */
const globalForHealth = globalThis as unknown as {
  healthDb?: PrismaClient
}

export const healthDb = globalForHealth.healthDb ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForHealth.healthDb = healthDb
}
