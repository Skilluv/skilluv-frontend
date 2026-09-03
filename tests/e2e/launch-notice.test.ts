import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The closed-beta notice, on a genuine first visit.
 *
 * The rest of the suite starts with this dismissal already in storage (see
 * `CONSENT_DECIDED` in playwright.config.ts), because the notice opens on `/`
 * a beat after paint and a dialog arriving mid-test swallows the click the
 * test was about to make. This file is the one that clears it.
 *
 * An explicitly *empty* storage state is what makes that a first visit.
 * `undefined` does not: Playwright reads it as "not specified" and falls back
 * to the project value, so the seed would still apply and every assertion here
 * would fail while looking like the feature was broken.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const STORAGE_KEY = 'skilluv-launch-notice-2027-01-11';

test.describe('Closed-beta notice', () => {
	test('a first-time visitor is told, with the days left', async ({ page }) => {
		await gotoHydrated(page, '/');

		const dismiss = page.getByTestId('launch-notice-dismiss');
		await expect(dismiss).toBeVisible();

		// The point of the notice: that access is closed, and when it opens.
		const dialog = page.getByRole('dialog');
		await expect(dialog).toContainText(/bêta fermée|closed beta/i);
		// The date is formatted from the opening constant rather than written in
		// the copy, so this checks the two agree.
		await expect(dialog).toContainText(/janvier 2027|January 2027/i);
		// A countdown, not a placeholder: some number of days must be rendered.
		await expect(dialog).toContainText(/\d+/);
	});

	test('it does not come back once it has been read', async ({ page }) => {
		await gotoHydrated(page, '/');
		await page.getByTestId('launch-notice-dismiss').click();
		await expect(page.getByTestId('launch-notice-dismiss')).toBeHidden();

		// The whole reason it is remembered rather than shown per session: the
		// second time somebody sees it, they have already learnt it.
		await page.reload();
		await expect(page.getByTestId('launch-notice-dismiss')).toBeHidden();
	});

	test('the dismissal is what is remembered, keyed by the opening date', async ({ page }) => {
		await gotoHydrated(page, '/');
		await page.getByTestId('launch-notice-dismiss').click();

		const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
		expect(stored).toBe('1');

		// Keyed by the date, so moving the opening shows the notice again and
		// nothing else does.
		const other = await page.evaluate(() =>
			Object.keys(localStorage).filter((k) => k.startsWith('skilluv-launch-notice-'))
		);
		expect(other).toEqual([STORAGE_KEY]);
	});

	test('it does not block the page underneath once dismissed', async ({ page }) => {
		await gotoHydrated(page, '/');
		await page.getByTestId('launch-notice-dismiss').click();

		// A modal that leaves its backdrop behind is worse than no modal: the
		// page looks fine and nothing on it can be clicked.
		await expect(page.getByRole('dialog')).toBeHidden();
		await expect(page.locator('h1').first()).toBeVisible();
	});
});
