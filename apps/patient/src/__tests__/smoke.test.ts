import { describe, it, expect } from 'vitest'
import { SLOGAN, brand } from '@wellpharma/ui'

describe('PWA patient — fondations', () => {
  it('expose le slogan officiel du groupement', () => {
    expect(SLOGAN).toBe('Faire équipe pour votre santé')
  })

  it('utilise la couleur primaire de la charte', () => {
    expect(brand.primary).toBe('#009dc5')
  })
})
