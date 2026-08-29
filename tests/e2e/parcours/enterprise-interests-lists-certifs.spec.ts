/**
 * SKI-53 — S6.11 engagement : interests + lists + certifications.
 *
 * Trois features simples groupées : accès + rendu, empty state OK sur fresh.
 */
import { test, expect } from '@playwright/test';
import { enterpriseStoragePath } from './_helpers/enterprise-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = enterpriseStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours enterprise-interests-lists-certifs', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires enterprise-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('interests accessible', async ({ page }) => {
		await page.goto('/enterprise/interests');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});

	test('lists accessible', async ({ page }) => {
		await page.goto('/enterprise/lists');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});

	test('certifications accessible', async ({ page }) => {
		await page.goto('/enterprise/certifications');
		await page.waitForLoadState('domcontentloaded');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
	});
});
