/**
 * @wellpharma/api — point d'entrée SERVEUR (importe Prisma).
 * Les clients RN doivent importer le TYPE depuis `@wellpharma/api/types`.
 */
export { appRouter, type AppRouter } from './root'
export { createTRPCContext, type Context } from './context'
export { createCallerFactory } from './trpc'
export { createSecureLink, verifySecureLink, type SecureLinkPayload } from './lib/secureLink'
export { notifyUser, type NotifyInput } from './lib/notify'
