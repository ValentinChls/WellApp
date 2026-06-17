/**
 * Typographies — Charte graphique Wellpharma.
 *
 * ⚠️ LICENCES :
 *  - `Century Gothic` (texte courant) → propriétaire Monotype.
 *  - `Market Pro` (emphase / display) → propriétaire Adobe Fonts.
 *  Aucune n'est libre pour le web/app.
 *
 * TODO (avant prod) : intégrer les `.otf`/`.woff2` licenciés du groupement
 * et retirer les fallbacks libres ci-dessous (`Questrial`).
 */

export const fontFamily = {
  /** Texte courant. Fallback géométrique libre `Questrial` en dev. */
  sans: ['Century Gothic', 'Questrial', 'Avant Garde', 'system-ui', 'sans-serif'],
  /** Emphase / titres. */
  display: ['Market Pro', 'Century Gothic', 'Questrial', 'sans-serif'],
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  bold: '700',
} as const

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const

export const typography = { fontFamily, fontSize, fontWeight, lineHeight } as const
