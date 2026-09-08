import { test, expect, type Page } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The footer sign-off: the mark on one side, the social links on the other.
 *
 * The mark replaced a wordmark built from three spans, and the first size
 * chosen for it was far too big — 521px of a 1118px row, which left the links
 * so little room that six pills broke onto two lines and sat against the
 * artwork. Text at `text-9xl` and a lockup at the same nominal height are not
 * the same amount of ink, which is what made the first guess wrong.
 *
 * So the size is not a matter of taste here: it is whatever leaves the links
 * their single line. This measures that rather than the pixel value, so the
 * mark can be resized freely as long as the row still works.
 */
async function signoff(page: Page) {
	return page.evaluate(() => {
		const logo = document.querySelector('footer a[aria-label="Skilluv"]');
		const pills = logo?.parentElement?.querySelector('div.flex.flex-wrap');
		if (!logo || !pills) return null;
		const first = pills.querySelector('a');
		if (!first) return null;
		const l = logo.getBoundingClientRect();
		const p = pills.getBoundingClientRect();
		return {
			gap: Math.round(p.left - l.right),
			rows: Math.round(p.height / first.getBoundingClientRect().height)
		};
	});
}

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

test.describe('The footer sign-off', () => {
	// Below `lg` the two stack, so there is no row to share and nothing to check.
	for (const width of [1100, 1280, 1600]) {
		test(`leaves the social links one line at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await gotoHydrated(page, '/');
			const m = await signoff(page);
			expect(m, 'sign-off row not found').not.toBeNull();
			expect(m!.rows, 'the social links wrapped').toBe(1);
			expect(m!.gap, 'the mark is touching the links').toBeGreaterThanOrEqual(24);
		});
	}
});
