// Géocode les officines de `src/pharmacies.ts` via l'API Adresse (data.gouv.fr).
// Sortie : scripts/geocode-results.json (dans l'ordre du tableau RAW).
// Usage : node packages/shared/scripts/geocode.mjs
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = join(here, '..', 'src', 'pharmacies.ts')
const OUT = join(here, 'geocode-results.json')

const text = await readFile(SRC, 'utf8')
const m = text.match(/const RAW[^=]*=\s*(\[[\s\S]*?\n\])/)
if (!m) throw new Error('RAW introuvable dans pharmacies.ts')
// Le littéral RAW est constitué de tuples de chaînes — eval sûr (contenu maîtrisé).
const RAW = eval('(' + m[1] + ')')
console.log(`RAW: ${RAW.length} officines`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []

for (let i = 0; i < RAW.length; i++) {
  const [name, addr, cp, dept, city] = RAW[i]
  const q = `${addr} ${city}`
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&postcode=${encodeURIComponent(cp)}&limit=1`
  let entry = { i, name, addr, cp, dept, city, ok: false }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'wellpharma-geocode/1.0' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const f = json.features && json.features[0]
      if (f) {
        const [lng, lat] = f.geometry.coordinates
        entry = {
          i, name, addr, cp, dept, city, ok: true,
          lat, lng,
          score: f.properties.score,
          type: f.properties.type,
          label: f.properties.label,
          citycode: f.properties.citycode,
          resultCity: f.properties.city,
          resultPostcode: f.properties.postcode,
        }
      } else {
        entry.reason = 'no-feature'
      }
      break
    } catch (e) {
      entry.reason = String(e.message || e)
      await sleep(400)
    }
  }
  results.push(entry)
  const tag = entry.ok ? `${entry.type} ${entry.score?.toFixed(2)}` : `FAIL ${entry.reason}`
  console.log(`${String(i + 1).padStart(2)}/${RAW.length} ${cp} ${name.slice(0, 28).padEnd(28)} → ${tag}`)
  await sleep(110)
}

const okCount = results.filter((r) => r.ok).length
const precise = results.filter((r) => r.ok && (r.type === 'housenumber' || r.type === 'street')).length
await writeFile(OUT, JSON.stringify(results, null, 2), 'utf8')
console.log(`\nOK ${okCount}/${RAW.length} · précis (rue/numéro) ${precise} · écrit ${OUT}`)
