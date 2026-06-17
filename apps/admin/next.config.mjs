// @ts-check
import { fileURLToPath } from 'node:url'
// eslint-disable-next-line
// @ts-ignore — le plugin ne fournit pas de déclarations TypeScript.
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin'

/**
 * Configuration Next.js de l'app d'administration Wellpharma.
 * - transpilePackages : les packages internes sont publiés en TypeScript brut
 *   (pas de build préalable), Next doit donc les transpiler à la volée.
 * - outputFileTracingIncludes : le moteur de requêtes Prisma (`*.so.node`) est
 *   chargé DYNAMIQUEMENT à l'exécution → il n'est pas tracé automatiquement et
 *   manque dans la fonction serverless (« could not locate the Query Engine for
 *   runtime rhel-openssl-3.0.x »). On force son inclusion dans le bundle.
 * - outputFileTracingRoot : racine de tracing = racine du monorepo, UNIQUEMENT
 *   sur Vercel (Linux). En dev Windows, import.meta.url renvoie « Wellpharma »
 *   (W majuscule) ≠ cwd minuscule → conflit de casse des modules webpack. On ne
 *   le fixe donc pas en local.
 */
const onVercel = Boolean(process.env.VERCEL)
const monorepoRoot = fileURLToPath(new URL('../../', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@wellpharma/ui', '@wellpharma/api', '@wellpharma/db'],
  outputFileTracingIncludes: {
    '/**': ['../../packages/db/src/generated/**'],
  },
  ...(onVercel ? { outputFileTracingRoot: monorepoRoot } : {}),
  // Copie le moteur de requêtes Prisma au bon endroit du bundle serveur
  // (indispensable en monorepo : le client est empaqueté par webpack).
  webpack: (/** @type {any} */ config, /** @type {{ isServer: boolean }} */ { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()]
    }
    return config
  },
}

export default nextConfig
