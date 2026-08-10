/**
 * SKI-50 — page curator community challenges.
 *
 * Un user standard n'a pas la capability curator : la page doit soit
 * rediriger vers /auth/login, soit afficher une page erreur/access denied.
 * Le test valide qu'aucun crash n'a lieu et qu'un heading est rendu.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours community-curator', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('page curator rend un heading (curator, access denied, ou login)', async ({ page }) => {
		await page.goto('/community/curator');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
	});
});
