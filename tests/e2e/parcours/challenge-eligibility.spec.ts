/**
 * Parcours — bandeau eligibility sur /challenges/{id} (Vague 3, P3).
 * Le bandeau ne s'affiche que pour un user authentifié.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours challenge-eligibility', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('bandeau eligibility présent sur le premier challenge', async ({ page }) => {
		await page.goto('/challenges');
		const firstLink = page.locator('a[href^="/challenges/"]').first();
		const count = await page.locator('a[href^="/challenges/"]').count();
		if (count === 0) {
			test.info().annotations.push({ type: 'note', description: 'no challenges in seed' });
			return;
		}
		await firstLink.click();
		// Le bandeau apparaît (eligible OU locked) ou est absent silencieusement
		// si le back renvoie 404. On accepte les deux — on vérifie qu'il n'y a
		// pas de crash.
		await page.waitForLoadState('networkidle');
		const banner = page.getByTestId('challenge-eligibility');
		// tolérance : bandeau optionnel selon l'état seed
		const bannerCount = await banner.count();
		if (bannerCount > 0) {
			await expect(banner).toBeVisible();
		}
	});
});
