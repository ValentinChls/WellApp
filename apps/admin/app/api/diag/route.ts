import { NextResponse } from 'next/server'
import { existsSync, readdirSync } from 'node:fs'

/**
 * Endpoint de diagnostic TEMPORAIRE (à retirer après mise en prod).
 * Surface l'erreur Prisma réelle (normalement avalée par le layout) + montre
 * où le moteur de requêtes existe réellement sur le disque de la fonction.
 * Aucune donnée sensible : seulement un compte + des chemins.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function look(rel: string): unknown {
  try {
    return existsSync(rel) ? readdirSync(rel) : 'ABSENT'
  } catch (e) {
    return 'ERR:' + (e instanceof Error ? e.message : String(e))
  }
}

export async function GET() {
  const diag: Record<string, unknown> = {
    cwd: process.cwd(),
    paths: {
      a: look('packages/db/src/generated/engagement'),
      b: look('../../packages/db/src/generated/engagement'),
      c: look('node_modules/@wellpharma/db/src/generated/engagement'),
    },
  }
  try {
    const { engagementDb } = await import('@wellpharma/db')
    diag.users = await engagementDb.user.count()
    diag.ok = true
  } catch (e) {
    diag.ok = false
    diag.error = e instanceof Error ? e.message : String(e)
  }
  return NextResponse.json(diag)
}
