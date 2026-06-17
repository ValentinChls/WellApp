/**
 * Export TYPE-ONLY de l'AppRouter pour les clients (notamment l'app patient
 * Expo/RN) : aucun code serveur (Prisma) n'est embarqué dans le bundle.
 */
export type { AppRouter } from './root'
