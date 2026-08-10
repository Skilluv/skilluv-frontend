/**
 * P26 v2 SKI-103 — page publique /verify/[hash].
 *
 * Ce test n'a pas besoin du back actif : la page render un etat "invalid"
 * quand /verify/{hash} back renvoie 404 (hash bidon), ET la meme page render
 * un etat "invalid" quand le back n'est pas atteignable (fetch echoue).
 * Les 2 chemins convergent visuellement (badge error + message + CTA).
 */
import { test, expect } from '@playwright/test';

test.describe('@parcours verify-hash', () => {
	test('page verify accessible et rend un etat lisible pour hash inexistant', async ({ page }) => {
		await page.goto('/verify/000000000000000000000000000000000000000000000000000000000deadbeef');
		await page.waitForLoadState('domcontentloaded');
		// Un h1 est toujours rendu (soit success, soit error), la page ne blanche jamais.
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
		// CTA "Retour" toujours present sur l'etat invalid.
		await expect(
			page.getByRole('link', { name: /accueil|home/i }).first()
		).toBeVisible({ timeout: 10_000 });
	});
});
