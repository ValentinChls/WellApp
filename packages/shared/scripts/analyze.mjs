// Analyse qualité du géocodage : échecs, incohérences dépt/ville, scores faibles.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(await readFile(join(here, 'geocode-results.json'), 'utf8'))

function norm(s) {
  return (s || '')
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/-/g, ' ')
    .replace(/\bSAINT\b/g, 'ST').replace(/\bSAINTE\b/g, 'STE')
    .replace(/\bCEDEX\b/g, '')
    .replace(/\s+/g, ' ').trim()
}

const fails = data.filter((r) => !r.ok)
const deptMismatch = data.filter((r) => r.ok && r.citycode && r.citycode.slice(0, 2) !== r.dept)
const cityMismatch = data.filter((r) => {
  if (!r.ok) return false
  const a = norm(r.city), b = norm(r.resultCity)
  return a !== b && !a.startsWith(b) && !b.startsWith(a)
})
const lowScore = data.filter((r) => r.ok && r.score < 0.6)

const show = (r) => `  #${r.i + 1} ${r.cp} ${r.name} | src="${r.city}" → ${r.ok ? `${r.resultCity} (${r.citycode}) ${r.type} ${r.score.toFixed(2)} :: ${r.label}` : `FAIL ${r.reason}`}`

console.log(`TOTAL ${data.length} · OK ${data.filter((r) => r.ok).length}\n`)
console.log(`ÉCHECS (${fails.length}):`); fails.forEach((r) => console.log(show(r)))
console.log(`\nDÉPT INCOHÉRENT — citycode≠dépt source (${deptMismatch.length}):`); deptMismatch.forEach((r) => console.log(show(r)))
console.log(`\nVILLE INCOHÉRENTE (${cityMismatch.length}):`); cityMismatch.forEach((r) => console.log(show(r)))
console.log(`\nSCORE FAIBLE <0.6 (${lowScore.length}):`); lowScore.forEach((r) => console.log(show(r)))

// Doublons de coordonnées (mêmes lat/lng exactes → suspect)
const seen = new Map()
for (const r of data) if (r.ok) { const k = `${r.lat},${r.lng}`; seen.set(k, [...(seen.get(k) || []), r.i + 1]) }
const dups = [...seen.entries()].filter(([, v]) => v.length > 1)
console.log(`\nCOORDS DUPLIQUÉES (${dups.length}):`); dups.forEach(([k, v]) => console.log(`  ${k} → #${v.join(', #')}`))
