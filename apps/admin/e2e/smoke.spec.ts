import { test, expect } from '@playwright/test'

/**
 * Smoke test e2e minimal.
 *
 * ⚠️ Requiert le serveur de développement déjà lancé (port 3000) :
 *     pnpm --filter @wellpharma/admin dev
 *
 * Vérifie que la page de connexion s'affiche avec le champ e-mail et le
 * slogan officiel du groupement.
 */
test('la page de connexion affiche le champ e-mail et le slogan', async ({
  page,
}) => {
  await page.goto('/login')

  // Champ e-mail accessible (label « Adresse e-mail »).
  await expect(page.getByLabel('Adresse e-mail')).toBeVisible()

  // Slogan officiel Wellpharma.
  await expect(
    page.getByText('Faire équipe pour votre santé'),
  ).toBeVisible()
})
