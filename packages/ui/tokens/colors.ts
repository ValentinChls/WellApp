/**
 * Couleurs — Charte graphique groupement Wellpharma (déc. 2024).
 * Source : `charte graphique wellpharma.pdf`.
 *
 * ⚠️ Règles charte :
 *  - Le bleu marine (`navy`) est réservé à la COULEUR DE TEXTE.
 *  - Le logo s'applique de préférence sur fond blanc.
 */

/** Couleurs PRINCIPALES de la charte. */
export const brand = {
  /** Bleu Wellpharma — couleur signature. Pantone 7703 C. */
  primary: '#009dc5',
  /** Bleu marine — usage TEXTE uniquement. Pantone 2768 C. */
  navy: '#1d243f',
  white: '#ffffff',
} as const

/** Couleurs SECONDAIRES de la charte. */
export const secondary = {
  turquoise: '#37bac9', // 631 C
  green: '#2bad70', // 3405 C
  greenLight: '#6cbe99', // 346 C
  orange: '#f39655', // 1575 C
  gold: '#fbc682', // 1355 C
  yellow: '#fdf4a5', // 1355 C (clair)
  blueLight: '#c6e7f6', // 7457 C
  bluePale: '#f1f9fb', // 656 C
  gray: '#585856', // 446 C
  lime: '#afca0b', // 375 C
} as const

/**
 * Échelle de teintes dérivée de la primaire (pour states/hover/surfaces).
 * Générée à partir de `brand.primary` (#009dc5).
 */
export const primaryScale = {
  50: '#e6f6fa',
  100: '#cceef5',
  200: '#99dcea',
  300: '#66cbe0',
  400: '#33b9d5',
  500: '#009dc5', // = brand.primary
  600: '#007e9e',
  700: '#005e76',
  800: '#003f4f',
  900: '#001f27',
} as const

/**
 * Jetons SÉMANTIQUES (light). Mappés sur la charte.
 * Le dark mode est géré côté app via les variables CSS (cf. tailwind preset).
 */
export const semantic = {
  background: brand.white,
  foreground: brand.navy,
  primary: brand.primary,
  primaryForeground: brand.white,
  muted: secondary.bluePale,
  mutedForeground: secondary.gray,
  accent: secondary.turquoise,
  accentForeground: brand.navy,
  success: secondary.green,
  warning: secondary.orange,
  border: '#e2e8ec',
  ring: brand.primary,
} as const

export const colors = {
  ...brand,
  ...secondary,
  primaryScale,
  semantic,
} as const

export type BrandColor = keyof typeof brand
export type SecondaryColor = keyof typeof secondary
