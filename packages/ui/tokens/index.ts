/**
 * Design tokens Wellpharma — point d'entrée unique.
 * Consommé par l'app patient (Expo/RN) ET l'app admin (Tailwind/shadcn).
 */
export * from './colors'
export * from './typography'
export * from './spacing'
export * from './radius'

import { colors } from './colors'
import { typography } from './typography'
import { spacing } from './spacing'
import { radius } from './radius'

/** Objet thème agrégé (pratique pour React Native / StyleSheet). */
export const tokens = { colors, typography, spacing, radius } as const

/** Slogan officiel du groupement. */
export const SLOGAN = 'Faire équipe pour votre santé'
