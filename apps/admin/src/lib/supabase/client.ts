import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase côté navigateur (composants 'use client').
 * Utilise les clés publiques NEXT_PUBLIC_*. Robuste si les variables sont
 * absentes au build : on passe des chaînes vides plutôt que de jeter, afin de
 * ne pas casser la compilation (les appels réseau échoueront proprement à
 * l'exécution si la configuration est incomplète).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return createBrowserClient(url, anonKey)
}
