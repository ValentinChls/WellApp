import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration Playwright (smoke e2e).
 *
 * ⚠️ Prérequis : le serveur de développement doit être lancé séparément
 * (`pnpm --filter @wellpharma/admin dev`) AVANT d'exécuter les tests.
 * On ne démarre pas de webServer automatiquement à ce stade.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
