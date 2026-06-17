/**
 * Carte de fidélité Wellpharma — suivi des points côté patient.
 * Mode démo : données locales. Mode réel : tRPC `loyalty.mine`.
 */
import { isDemoEnabled } from '../lib/demo'
import { trpc } from '../lib/trpcVanilla'

export interface LoyaltyTransaction {
  id: string
  label: string
  points: number
  createdAt: string
}

export interface LoyaltyCard {
  cardNumber: string | null
  points: number
  tier: string | null
  transactions: LoyaltyTransaction[]
}

const DEMO_CARD: LoyaltyCard = {
  cardNumber: 'WP-2026-004821',
  points: 340,
  tier: 'Fidèle',
  transactions: [
    { id: 't1', label: 'Entretien pharmaceutique réalisé', points: 50, createdAt: '2026-06-10' },
    { id: 't2', label: 'Achat parapharmacie', points: 30, createdAt: '2026-05-28' },
    { id: 't3', label: 'Vaccination grippe', points: 20, createdAt: '2026-05-12' },
    { id: 't4', label: 'Bon de réduction utilisé', points: -100, createdAt: '2026-04-30' },
    { id: 't5', label: 'Adhésion programme fidélité', points: 340, createdAt: '2026-01-15' },
  ],
}

export async function getLoyalty(): Promise<LoyaltyCard | null> {
  if (isDemoEnabled()) return DEMO_CARD
  const data = (await trpc.loyalty.mine.query()) as LoyaltyCard | null
  if (!data) return null
  return {
    ...data,
    transactions: data.transactions.map((t) => ({
      ...t,
      createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date(t.createdAt).toISOString(),
    })),
  }
}
