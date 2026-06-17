import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import baseConfig from '@wellpharma/config/eslint'

/**
 * Configuration ESLint (flat) de l'app admin :
 *  - base partagée du monorepo (@wellpharma/config) ;
 *  - règles Next.js (core-web-vitals) via eslint-config-next, chargées avec
 *    FlatCompat (pont vers l'ancien format de config).
 *
 * On reste volontairement simple à ce stade.
 */
const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  ...baseConfig,
  ...compat.extends('next/core-web-vitals'),
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
]

export default eslintConfig
