// Re-géocode les cas difficiles, STRICTEMENT sur la commune source.
// 1) adresse dans la bonne commune (résultat dont la ville == ville source)
// 2) repli : centre de la commune source (type=municipality).
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const FILE = join(here, 'geocode-results.json')
const data = JSON.parse(await readFile(FILE, 'utf8'))
const TARGETS = [14, 19, 78, 79] // #15 Hagondange, #20 St-Priest, #79 St-Hilaire-de-Loulay, #80 Charmes

function norm(s) {
  return (s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[-']/g, ' ').replace(/\bSAINTE\b/g, 'STE').replace(/\bSAINT\b/g, 'ST')
    .replace(/\bCEDEX\b/g, '').replace(/\s+/g, ' ').trim()
}
const cityEq = (a, b) => { const x = norm(a), y = norm(b); return x === y || x.startsWith(y) || y.startsWith(x) }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function api(params) {
  const url = 'https://api-adresse.data.gouv.fr/search/?' + new URLSearchParams(params).toString()
  const res = await fetch(url, { headers: { 'User-Agent': 'wellpharma-geocode/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

for (const i of TARGETS) {
  const r = data[i]
  let picked = null, mode = null

  // 1) Adresse dans la BONNE commune (ville résultat == ville source, bon dépt).
  try {
    const json = await api({ q: `${r.addr} ${r.city}`, limit: '12' })
    const cand = (json.features || [])
      .filter((f) => f.properties.citycode?.slice(0, 2) === r.dept && cityEq(f.properties.city, r.city))
      .sort((a, b) => b.properties.score - a.properties.score)
    const best = cand[0]
    if (best && (best.properties.type === 'housenumber' || best.properties.type === 'street')) {
      picked = best; mode = 'street-strict'
    }
  } catch { /* repli */ }
  await sleep(150)

  // 2) Repli : centre de la commune source.
  if (!picked) {
    try {
      const json = await api({ q: r.city, type: 'municipality', limit: '20' })
      const cand = (json.features || [])
        .filter((f) => f.properties.citycode?.slice(0, 2) === r.dept && cityEq(f.properties.city || f.properties.name, r.city))
        .sort((a, b) => (b.properties.postcode === r.cp ? 1 : 0) - (a.properties.postcode === r.cp ? 1 : 0) || b.properties.score - a.properties.score)
      if (cand[0]) { picked = cand[0]; mode = 'municipality-fallback' }
    } catch { /* ... */ }
    await sleep(150)
  }

  if (picked) {
    const [lng, lat] = picked.geometry.coordinates
    data[i] = {
      ...r, ok: true, lat, lng,
      score: picked.properties.score, type: picked.properties.type, label: picked.properties.label,
      citycode: picked.properties.citycode, resultCity: picked.properties.city || picked.properties.name,
      resultPostcode: picked.properties.postcode, fixMode: mode, approxCity: mode === 'municipality-fallback',
    }
    console.log(`#${i + 1} ${r.name} (${r.city}) → [${mode}] ${picked.properties.type} ${picked.properties.score.toFixed(2)} :: ${picked.properties.label}`)
  } else {
    console.log(`#${i + 1} ${r.name} → IRRÉSOLU`)
  }
}

await writeFile(FILE, JSON.stringify(data, null, 2), 'utf8')
console.log('\ngeocode-results.json patché.')
