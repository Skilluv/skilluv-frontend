/**
 * SKI-49 P2 — auth via invite token.
 *
 * Le flow complet requiert 2 comptes distincts (inviter + invited). Ici on
 * teste la degradation : un token invalide/anonyme doit rediriger vers la
 * page login ou afficher un message explicite sans crasher la page.
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

test.describe('@parcours auth-invite-token', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');

	test('token invalide rend une page graceful (login/erreur, pas de crash)', async ({ page }) => {
		await page.goto('/auth/invite?token=invalid-e2e-token');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
	});
});
