/**
 * Parcours minimal — /enterprise/bounties (owner OSS bounties).
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-bounties-listing', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/enterprise/bounties rend le listing owner', async ({ page }, testInfo) => {
		await page.goto('/enterprise/bounties');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.getByRole('heading', { name: /My bounties|Mes bounties/i, level: 1 })).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('enterprise-bounties.png'), fullPage: true });
	});
});
