/**
 * SKI-53 — S6.6 pipeline recrutement (empty state autorisé).
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-pipeline', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('page pipeline accessible + rendu', async ({ page }) => {
		await page.goto('/enterprise/pipeline');
		await page.waitForLoadState('networkidle');
		await expect(page.getByRole('heading', { name: /Pipeline/i, level: 1 })).toBeVisible({
			timeout: 15_000
		});
	});
});
