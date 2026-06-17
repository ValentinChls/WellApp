import { router, publicProcedure, protectedProcedure } from '../trpc'

export const authRouter = router({
  /** Statut de session léger (public) — utilisé pour le routage par rôle. */
  whoami: publicProcedure.query(({ ctx }) => ({
    authenticated: ctx.user !== null,
    role: ctx.user?.role ?? null,
  })),

  /** Profil de l'utilisateur authentifié. */
  me: protectedProcedure.query(({ ctx }) => ({
    id: ctx.user.id,
    email: ctx.user.email,
    role: ctx.user.role,
    pharmacyId: ctx.user.pharmacyId,
    patientId: ctx.user.patientId,
  })),
})
