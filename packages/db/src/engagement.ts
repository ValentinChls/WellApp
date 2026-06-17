import { PrismaClient } from './generated/engagement'

/**
 * Client Prisma du domaine ENGAGEMENT (infra standard).
 * Singleton pour éviter l'épuisement du pool de connexions en dev (HMR).
 */
const globalForEngagement = globalThis as unknown as {
  engagementDb?: PrismaClient
}

export const engagementDb = globalForEngagement.engagementDb ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForEngagement.engagementDb = engagementDb
}
