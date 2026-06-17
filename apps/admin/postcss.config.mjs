import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * Pipeline PostCSS : Tailwind (génère les utilitaires) puis Autoprefixer.
 * Chemin ABSOLU vers la config Tailwind : évite l'échec de résolution
 * (`content` vide) quand Next infère une mauvaise racine de workspace
 * (plusieurs lockfiles détectés au-dessus du monorepo).
 */
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: { config: join(here, 'tailwind.config.ts') },
    autoprefixer: {},
  },
}

export default config
