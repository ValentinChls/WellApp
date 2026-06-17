import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * Chiffrement at-rest des champs santé sensibles (NON NÉGOCIABLE #6).
 *
 * AES-256-GCM. Format du payload stocké : [ IV(12) | authTag(16) | ciphertext ].
 *
 * ⚠️ Implémentation de DÉPART : la KEK est lue depuis `ENCRYPTION_KEK`.
 * TODO HDS (avant prod) : remplacer par une "envelope encryption" avec
 * DEK par enregistrement et KEK gérée dans un KMS (jamais en clair).
 */

const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEK
  if (!raw) {
    throw new Error('ENCRYPTION_KEK manquant — chiffrement des données de santé impossible.')
  }
  // 32 octets en base64 = 44 caractères se terminant par '='. On valide
  // STRICTEMENT le format (Node ignore sinon silencieusement les caractères
  // non-base64 et peut décoder une clé tronquée/à faible entropie).
  if (!/^[A-Za-z0-9+/]{43}=$/.test(raw)) {
    throw new Error('ENCRYPTION_KEK invalide : 32 octets en base64 attendus (44 caractères).')
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEK invalide : 32 octets attendus (base64).')
  }
  if (key.every((b) => b === 0)) {
    throw new Error('ENCRYPTION_KEK invalide : clé nulle interdite.')
  }
  return key
}

/** Chiffre une chaîne en clair → payload binaire (à stocker dans un champ `Bytes`). */
export function seal(plaintext: string): Buffer {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc])
}

/** Déchiffre un payload binaire (champ `Bytes`) → chaîne en clair. */
export function open(payload: Uint8Array): string {
  const buf = Buffer.from(payload)
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const data = buf.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv(ALGO, getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

/** Sérialise puis chiffre une valeur (ex. formulaire d'entretien structuré). */
export function sealJson(value: unknown): Buffer {
  return seal(JSON.stringify(value))
}

/** Déchiffre puis désérialise un payload JSON. */
export function openJson<T = unknown>(payload: Uint8Array): T {
  return JSON.parse(open(payload)) as T
}
