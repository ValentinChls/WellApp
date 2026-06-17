import { describe, it, expect, beforeAll } from 'vitest'
import { seal, open, sealJson, openJson } from '../crypto'

beforeAll(() => {
  // Clé de test déterministe (32 octets).
  process.env.ENCRYPTION_KEK = Buffer.alloc(32, 7).toString('base64')
})

describe('chiffrement at-rest santé (AES-256-GCM)', () => {
  it('round-trip chaîne', () => {
    const clear = 'Entretien AVK — INR 2.8, pas de saignement.'
    const sealed = seal(clear)
    expect(Buffer.isBuffer(sealed)).toBe(true)
    expect(sealed.toString('utf8')).not.toContain('INR') // jamais en clair
    expect(open(sealed)).toBe(clear)
  })

  it('round-trip JSON structuré', () => {
    const form = { q1: 'oui', q2: 42, allergies: ['pénicilline'] }
    const sealed = sealJson(form)
    expect(openJson(sealed)).toEqual(form)
  })

  it('IV aléatoire → deux chiffrés différents pour le même clair', () => {
    expect(seal('x').equals(seal('x'))).toBe(false)
  })

  it('rejette une KEK de mauvaise taille', () => {
    const prev = process.env.ENCRYPTION_KEK
    process.env.ENCRYPTION_KEK = Buffer.alloc(16).toString('base64')
    expect(() => seal('x')).toThrow(/32 octets/)
    process.env.ENCRYPTION_KEK = prev
  })
})
