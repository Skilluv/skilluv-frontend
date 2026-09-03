import { test, expect, type Page } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The header and the consent banner, at the widths where they broke.
 *
 * The nav pill is `fixed` and centred on the viewport, so it is out of the flow
 * and the row beneath it lays out as though it were not there. Nothing stops it
 * covering the controls on the right, and at z-50 over the header's z-40 it
 * wins. Measured before the fix: the pill is 442px wide anonymous and 529
 * signed in, the right-hand controls 294 and 334 — so the overlap started below
 * 1062px anonymous and below 1229px signed in.
 *
 * Both numbers are why the breakpoint is xl and not a tuned pixel value: a
 * tighter number would be right for a row that stops existing the day somebody
 * adds a control.
 */

// Signed out, and with the closed-beta notice already read: it is a modal over
// the very header this spec measures. The subject here is the nav row, not the
// notice.
test.use({
	storageState: {
		cookies: [],
		origins: [
			{
				origin: 'http://localhost:4173',
				localStorage: [{ name: 'skilluv-launch-notice-2027-01-11', value: '1' }]
			}
		]
	}
});

/** The pill's right edge against the left edge of the controls beside it. */
async function overlap(page: Page): Promise<number | null> {
	return page.evaluate(() => {
		const pill = document.querySelector('header .fixed.top-5');
		const right = document.querySelector('header nav > div.hidden.items-center');
		if (!pill || !right) return null;
		const p = pill.getBoundingClientRect();
		const r = right.getBoundingClientRect();
		if (p.width === 0 || r.width === 0) return null;
		return Math.round(p.right - r.left);
	});
}

test.describe('Header at narrow desktop widths', () => {
	for (const width of [966, 1040, 1120, 1279]) {
		test(`the nav pill does not cover the controls at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 896 });
			await gotoHydrated(page, '/');
			// Null means the pill is hidden at this width, which is the fix
			// working. A number means both are on screen and must not touch.
			const o = await overlap(page);
			if (o !== null) expect(o, `pill overruns the controls by ${o}px`).toBeLessThanOrEqual(0);
		});
	}

	test('the pill is back once there is room for it', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 896 });
		await gotoHydrated(page, '/');
		await expect(page.locator('header .fixed.top-5')).toBeVisible();
		const o = await overlap(page);
		expect(o).not.toBeNull();
		expect(o!).toBeLessThanOrEqual(0);
	});

	test('a way to navigate exists at every width', async ({ page }) => {
		// The pill and the menu button trade places at xl. If both breakpoints
		// were not moved together there would be a band with neither.
		for (const width of [400, 768, 1024, 1279, 1440]) {
			await page.setViewportSize({ width, height: 896 });
			await gotoHydrated(page, '/');
			const pill = await page.locator('header .fixed.top-5').isVisible().catch(() => false);
			const burger = await page
				.locator('header nav button.xl\\:hidden')
				.first()
				.isVisible()
				.catch(() => false);
			expect(pill || burger, `no navigation at ${width}px`).toBe(true);
		}
	});
});

test.describe('Consent banner on small screens', () => {
	test('refusing and accepting share a row, at equal width', async ({ page }) => {
		// Three stacked full-width buttons made this 339px tall at 320px wide —
		// 47% of the screen, on a banner meant to let somebody keep reading.
		await page.setViewportSize({ width: 320, height: 720 });
		await gotoHydrated(page, '/');
		const banner = page.getByTestId('consent-banner');
		await expect(banner).toBeVisible();

		const reject = banner.getByRole('button', { name: /refuser|reject/i });
		const accept = banner.getByRole('button', { name: /tout accepter|accept all/i });
		const rb = (await reject.boundingBox())!;
		const ab = (await accept.boundingBox())!;

		// Same row: a refusal placed below an acceptance is harder to reach, and
		// that is the dark pattern the wording was written to avoid.
		expect(Math.abs(rb.y - ab.y)).toBeLessThanOrEqual(2);
		// Same width, to within a rounding error.
		expect(Math.abs(rb.width - ab.width)).toBeLessThanOrEqual(4);
	});

	test('it leaves most of the screen to the page', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 720 });
		await gotoHydrated(page, '/');
		const box = (await page.getByTestId('consent-banner').boundingBox())!;
		expect(box.height / 720).toBeLessThan(0.45);
	});

	test('it never scrolls the page sideways', async ({ page }) => {
		for (const width of [320, 360, 390, 768]) {
			await page.setViewportSize({ width, height: 720 });
			await gotoHydrated(page, '/');
			const over = await page.evaluate(
				() => document.documentElement.scrollWidth > window.innerWidth
			);
			expect(over, `horizontal overflow at ${width}px`).toBe(false);
		}
	});
});
