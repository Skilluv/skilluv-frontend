import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

test.describe('Challenge pages', () => {
	test('challenges page renders catalogue', async ({ page }) => {
		await gotoHydrated(page, '/challenges');
		await expect(page.locator('h1')).toBeVisible();
	});

	/**
	 * The discipline filter, at both widths.
	 *
	 * Twelve options never fit one row, and the row used to scroll sideways —
	 * so audio, communication and education sat off-frame with nothing saying
	 * they were there. Counting the options is not enough to catch that: they
	 * were all in the DOM the whole time. What has to hold is that every one
	 * of them is actually on screen.
	 */
	test('every discipline is reachable on a desktop width', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoHydrated(page, '/challenges');

		const group = page.getByRole('group', { name: /discipline/i });
		await expect(group).toBeVisible();

		const chips = group.getByRole('button');
		// Eleven public domains plus "all".
		await expect(chips).toHaveCount(12);

		// `toBeInViewport` is the assertion that would have failed before: a
		// horizontally scrolled row still renders every chip, just not where
		// anybody can see it.
		const count = await chips.count();
		for (let i = 0; i < count; i++) {
			await expect(chips.nth(i)).toBeInViewport();
		}
	});

	test('a phone gets the same disciplines as a menu, not four rows of chips', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 800 });
		await gotoHydrated(page, '/challenges');

		// The chip group is the desktop half and must not be rendered here:
		// twelve wrapped chips would push the first challenge off the screen.
		await expect(page.getByRole('group', { name: /discipline/i })).toBeHidden();

		// The menu carries the same catalogue.
		const trigger = page.getByRole('button', { name: /tous|^all$/i }).first();
		await expect(trigger).toBeVisible();
		await trigger.click();
		await expect(page.getByRole('option', { name: /audio/i })).toBeVisible();
	});

	test('leaderboards page renders', async ({ page }) => {
		await gotoHydrated(page, '/leaderboards');
		await expect(page.locator('h1')).toBeVisible();
		// Should show domain filter buttons
		const buttons = page.locator('button').filter({ hasText: /global|code|design/i });
		await expect(buttons.first()).toBeVisible();
	});

	/**
	 * The same filter, on the board. It had no scroll container at all, so the
	 * track simply ran past the page edge rather than being draggable — the
	 * later disciplines were not merely hard to reach, they were unreachable.
	 */
	test('every discipline is reachable on the leaderboards too', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await gotoHydrated(page, '/leaderboards');

		const group = page.getByRole('group', { name: /discipline/i });
		await expect(group).toBeVisible();

		const chips = group.getByRole('button');
		// Eleven public domains plus "global".
		await expect(chips).toHaveCount(12);

		const count = await chips.count();
		for (let i = 0; i < count; i++) {
			await expect(chips.nth(i)).toBeInViewport();
		}
	});
});
