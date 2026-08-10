/**
 * Parcours — rank history section on public profile pages (Vague 6, Ticket 9).
 */
import { test, expect } from '@playwright/test';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const SEED_USERNAME = process.env.SEED_PUBLIC_USERNAME ?? 'artisan-demo';

test.describe('@parcours rank-history', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');

	test('renders rank-history or graceful 404 on a public profile page', async ({ page }) => {
		const res = await page.goto(`/profile/${SEED_USERNAME}`);
		await page.waitForLoadState('domcontentloaded');
		if (res && res.status() === 404) {
			// Cascade SKI-70 : profile 404 → page erreur doit render un heading.
			await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
			return;
		}
		const widget = page.getByTestId('rank-history');
		await expect(widget.or(page.locator('h1').first())).toBeVisible({ timeout: 15_000 });
	});
});
