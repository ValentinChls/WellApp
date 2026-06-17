// Flat config ESLint de l'app patient (PWA Vite). Hérite de la base partagée.
import base from '@wellpharma/config/eslint'

export default [
  ...base,
  {
    ignores: ['dist/**', 'dev-dist/**', 'src/sw.ts'],
  },
  {
    // Garde-fou RGPD : l'app patient ne doit JAMAIS embarquer de code serveur.
    // Seul le TYPE de l'API est autorisé via @wellpharma/api/types.
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@wellpharma/db',
              message: 'Interdit côté patient : code serveur Prisma.',
            },
            {
              name: '@wellpharma/api',
              message:
                'Interdit côté patient : runtime serveur. Importer le type via `import type ... from "@wellpharma/api/types"`.',
            },
          ],
          patterns: [
            { group: ['@wellpharma/db/*'], message: 'Interdit côté patient (code serveur).' },
            {
              // Verrouille l'API à son SEUL point d'entrée type-only.
              group: ['@wellpharma/api/*', '!@wellpharma/api/types'],
              message: 'Côté patient, seul @wellpharma/api/types (type-only) est autorisé.',
            },
          ],
        },
      ],
      // Toute régression d'isolation (import de valeur depuis l'API) échoue le lint.
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
]
