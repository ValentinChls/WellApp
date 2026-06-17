import { describe, it, expect } from 'vitest'
import { resolveCurrentConsents, hasConsent, type ConsentRecord } from '../consent'

const d = (iso: string) => new Date(iso)

describe('consentement append-only', () => {
  const history: ConsentRecord[] = [
    { type: 'MARKETING', granted: true, createdAt: d('2026-01-01'), revokedAt: null },
    { type: 'MARKETING', granted: false, createdAt: d('2026-03-01'), revokedAt: d('2026-03-01') },
    { type: 'HEALTH_DATA', granted: true, createdAt: d('2026-01-01'), revokedAt: null },
  ]

  it('retient la dernière décision par type', () => {
    const current = resolveCurrentConsents(history)
    expect(current.get('MARKETING')?.granted).toBe(false)
    expect(current.get('HEALTH_DATA')?.granted).toBe(true)
  })

  it('hasConsent reflète la révocation', () => {
    expect(hasConsent(history, 'MARKETING')).toBe(false)
    expect(hasConsent(history, 'HEALTH_DATA')).toBe(true)
    expect(hasConsent(history, 'PUSH_NOTIFICATIONS')).toBe(false) // jamais donné
  })
})
