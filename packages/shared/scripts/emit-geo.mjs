import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const here = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(await readFile(join(here, 'geocode-results.json'), 'utf8'))
const r6 = (n) => Number(n.toFixed(6))
const lines = data.map((r) => {
  if (!r.ok) return `  ${r.i}: null, // ${r.cp} ${r.name} — IRRÉSOLU`
  const flag = r.approxCity ? ' /* centre-ville approx. */' : ''
  return `  ${r.i}: [${r6(r.lat)}, ${r6(r.lng)}],${flag} // ${r.cp} ${r.resultCity}`
})
console.log('const GEO: Record<number, [number, number] | null> = {')
console.log(lines.join('\n'))
console.log('}')
