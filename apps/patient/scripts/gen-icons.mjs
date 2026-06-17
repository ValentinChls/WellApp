// Génère les icônes PWA Wellpharma à partir d'un SVG (rastérisation via sharp).
// Lancement (depuis la racine du monorepo) : node apps/patient/scripts/gen-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// Fond bleu charte #009dc5 + « ligne de vie » blanche centrée (asset signature).
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#009dc5"/>
  <path d="M72 268 H198 c24 0 30 -78 58 -78 s34 78 58 78 H440"
        fill="none" stroke="#ffffff" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

async function gen(size, name) {
  await sharp(Buffer.from(SVG)).resize(size, size).png().toFile(join(outDir, name))
  console.log('  ✓', name)
}

await gen(192, 'icon-192.png')
await gen(512, 'icon-512.png')
await gen(512, 'icon-maskable-512.png')
await gen(180, 'apple-touch-icon-180.png')
await gen(48, 'favicon-48.png')
console.log('Icônes PWA générées dans', outDir)
