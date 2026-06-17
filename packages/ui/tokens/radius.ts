/** Rayons d'arrondi. La marque Wellpharma est douce/arrondie ("ligne de vie"). */
export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const

export type RadiusToken = keyof typeof radius
