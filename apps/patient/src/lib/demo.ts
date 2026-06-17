/**
 * Mode DÉMO — permet de tester l'app sans Supabase (session patient factice).
 * Isolé derrière un flag, réversible. ⚠️ À RETIRER avant la mise en production.
 * Activation : bouton « Entrer en démo » (localStorage) ou VITE_DEMO_MODE=true.
 */
const DEMO_KEY = 'wp-demo-session'

export function isDemoEnabled(): boolean {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return true
  return typeof localStorage !== 'undefined' && localStorage.getItem(DEMO_KEY) === '1'
}

export function enableDemo(): void {
  try {
    localStorage.setItem(DEMO_KEY, '1')
  } catch {
    /* stockage indisponible : ignoré */
  }
}

export function disableDemo(): void {
  try {
    localStorage.removeItem(DEMO_KEY)
  } catch {
    /* stockage indisponible : ignoré */
  }
}

/** Session factice minimale (compatible avec l'usage `session.user.email`). */
export const DEMO_SESSION = {
  access_token: 'demo-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 4102444800,
  refresh_token: 'demo-refresh-token',
  user: {
    id: 'demo-patient',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'patient.demo@wellpharma.test',
    app_metadata: { provider: 'demo' },
    user_metadata: { role: 'PATIENT', full_name: 'Camille Martin (démo)' },
    created_at: '2026-01-01T00:00:00.000Z',
  },
}
