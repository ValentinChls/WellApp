import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { Context, Role } from './context'

const t = initTRPC.context<Context>().create({ transformer: superjson })

export const router = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure

/** Exige une session authentifiée. Restreint `ctx.user` à non-null en aval. */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, user: ctx.user } })
})

/** Exige l'un des rôles autorisés. */
const enforceRoles = (allowed: Role[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
    if (!allowed.includes(ctx.user.role)) throw new TRPCError({ code: 'FORBIDDEN' })
    return next({ ctx: { ...ctx, user: ctx.user } })
  })

export const protectedProcedure = t.procedure.use(enforceAuth)

/** Staff officine ou groupement. */
export const pharmacyProcedure = t.procedure.use(
  enforceRoles(['ADMIN_PHARMACIE', 'SUPER_ADMIN_GROUPEMENT']),
)

/** Administration groupement uniquement. */
export const groupementProcedure = t.procedure.use(enforceRoles(['SUPER_ADMIN_GROUPEMENT']))

/** Patient uniquement. */
export const patientProcedure = t.procedure.use(enforceRoles(['PATIENT']))
