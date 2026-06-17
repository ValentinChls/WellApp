import { describe, it, expect } from 'vitest'
import { brand, primaryScale } from '../colors'
import { fontFamily } from '../typography'
import { SLOGAN, tokens } from '../index'

describe('tokens charte Wellpharma', () => {
  it('expose la couleur primaire officielle (#009dc5)', () => {
    expect(brand.primary).toBe('#009dc5')
    expect(primaryScale[500]).toBe(brand.primary)
  })

  it('réserve le bleu marine au texte', () => {
    expect(brand.navy).toBe('#1d243f')
  })

  it('priorise Century Gothic avec un fallback libre', () => {
    expect(fontFamily.sans[0]).toBe('Century Gothic')
    expect(fontFamily.sans).toContain('Questrial')
  })

  it('expose le slogan officiel', () => {
    expect(SLOGAN).toBe('Faire équipe pour votre santé')
  })

  it('agrège un objet tokens complet', () => {
    expect(tokens.colors).toBeDefined()
    expect(tokens.spacing[4]).toBe(16)
    expect(tokens.radius.full).toBe(9999)
  })
})
