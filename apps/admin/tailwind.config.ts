import type { Config } from 'tailwindcss'
import { join } from 'node:path'
// Preset partagé Wellpharma (couleurs charte + tokens shadcn via vars CSS).
import preset from '@wellpharma/ui/tailwind-preset'

/**
 * Configuration Tailwind de l'app admin.
 * Toute la cohérence visuelle (couleurs, polices, rayons) vient du preset UI.
 * Les chemins `content` sont ABSOLUS (via __dirname) : le dev server tourne
 * avec un cwd = racine du repo parent, donc des globs relatifs ne matcheraient
 * aucun fichier → aucune classe utilitaire générée.
 */
const config: Config = {
  presets: [preset],
  darkMode: ['class'],
  content: [
    join(__dirname, 'app/**/*.{ts,tsx}'),
    join(__dirname, 'src/**/*.{ts,tsx}'),
    join(__dirname, '../../packages/ui/**/*.{ts,tsx}'),
  ],
  plugins: [require('tailwindcss-animate')],
}

export default config
