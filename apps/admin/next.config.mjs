// @ts-check

/**
 * Configuration Next.js de l'app d'administration Wellpharma.
 * - transpilePackages : les packages internes sont publiés en TypeScript brut
 *   (pas de build préalable), Next doit donc les transpiler à la volée.
 * NB : ne PAS fixer `outputFileTracingRoot` via import.meta.url ici — sur cette
 *   machine Windows il renvoie « Wellpharma » (W majuscule) alors que le cwd est
 *   en minuscule, ce qui crée un conflit de casse des modules webpack en dev.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@wellpharma/ui', '@wellpharma/api', '@wellpharma/db'],
}

export default nextConfig
