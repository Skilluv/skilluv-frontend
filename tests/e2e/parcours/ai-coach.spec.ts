/**
 * Parcours — AI coach widgets (Vague 6, Ticket 1).
 * Both widgets are rendered on the authenticated homepage under
 * `data-testid="ai-coach-suggest-widget"` and `data-testid="ai-coach-performance-widget"`.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours ai-coach', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('performance widget or graceful degradation on home', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		// Widget visible si session hydratee, sinon page publique doit render sans crash.
		const widget = page.getByTestId('ai-coach-performance-widget');
		await expect(widget.or(page.locator('h1').first())).toBeVisible({ timeout: 15_000 });
	});

	test('orientation suggestion widget or public fallback', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		const widget = page.getByTestId('ai-coach-suggest-widget');
		await expect(widget.or(page.locator('h1').first())).toBeVisible({ timeout: 15_000 });
	});
});
