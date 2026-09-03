import { test, expect } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The header menus, once they got long.
 *
 * "Discover" and "Grow" carry several groups each — mentorship, design, AI,
 * security, the disciplines — and an unbounded panel ran off the bottom of the
 * screen. Everything rendered; the last group was simply below the fold of a
 * panel that could not scroll, which is the same failure as a filter row that
 * scrolls sideways with no affordance.
 *
 * Counting the links would not catch it: they were all in the DOM. What has to
 * hold is that the panel stays inside the viewport and its last entry can be
 * reached.
 */
const MENUS = [/découvrir|discover/i, /communauté|community/i, /entreprises|enterprise/i];

test.describe('Header dropdowns', () => {
	for (const name of MENUS) {
		test(`${name.source.split('|')[0]} stays inside the viewport and scrolls`, async ({ page }) => {
			await page.setViewportSize({ width: 1280, height: 700 });
			await gotoHydrated(page, '/');

			const trigger = page.getByRole('button', { name }).first();
			await expect(trigger).toBeVisible();
			await trigger.click();

			const panel = page.getByRole('menu').filter({ visible: true }).first();
			await expect(panel).toBeVisible();

			const box = (await panel.boundingBox())!;
			expect(box).not.toBeNull();
			// The whole panel must fit on screen; before the cap it did not.
			expect(box.y + box.height).toBeLessThanOrEqual(700);

			// And every entry must be reachable — by scrolling when there are
			// more than fit, which is exactly what the cap makes possible.
			const items = panel.getByRole('menuitem');
			const count = await items.count();
			expect(count).toBeGreaterThan(0);
			await items.nth(count - 1).scrollIntoViewIfNeeded();
			await expect(items.nth(count - 1)).toBeInViewport();
		});
	}
});
