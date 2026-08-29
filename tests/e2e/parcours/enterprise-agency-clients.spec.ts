/**
 * Parcours minimal — /enterprise/agency-clients (agences: gestion clients).
 * Peut necessiter role agency active — annote un skip soft si redirect.
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-agency-clients', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/enterprise/agency-clients rend la page (ou redirige si non-agence)', async ({ page }, testInfo) => {
		await page.goto('/enterprise/agency-clients');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
		await page.screenshot({ path: testInfo.outputPath('enterprise-agency-clients.png'), fullPage: true });
	});
});
