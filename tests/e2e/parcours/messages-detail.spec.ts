/**
 * SKI-50 — detail d'une conversation.
 *
 * Le user fixe n'a pas de conversation seed. Le test valide la degradation :
 * un id inconnu doit render une page erreur/empty ou rediriger vers /messages,
 * sans crash.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours messages-detail', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('id inconnu rend une page graceful', async ({ page }) => {
		await page.goto('/messages/nonexistent-e2e-conversation');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
	});
});
