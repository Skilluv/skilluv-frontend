import { test, expect, type Page } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The header and the consent banner, at the widths where they broke.
 *
 * The nav pill used to be `fixed`, so it was out of the flow and the row laid
 * out as though it were not there. Nothing stopped it covering the controls on
 * the right, and at z-50 over the header's z-40 it won. The answer was a
 * breakpoint: hide the pill below xl, on measurements taken at the time.
 *
 * That held until the row changed under it. Signed in and in French — longer
 * labels, a name, a rank badge — the pill was 572px against 334px of controls
 * inside a row capped at `max-w-7xl`, leaving four pixels between them. Four.
 * The next word added to a menu would have taken it.
 *
 * So the row is a three-column grid now and the groups cannot overlap at all:
 * they are in different columns, and grid items in different columns do not
 * share pixels. The measurements below stop being the thing that keeps them
 * apart and become what they should always have been — a check that there is
 * room to breathe.
 *
 * This spec ran signed out only, which is why it never saw any of it. The
 * widest case is signed in and in French, and it is covered at the bottom.
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
		const pill = document.querySelector('header [data-testid="nav-pill"]');
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
		await expect(page.getByTestId('nav-pill')).toBeVisible();
		const o = await overlap(page);
		expect(o).not.toBeNull();
		expect(o!).toBeLessThanOrEqual(0);
	});

	test('the widest row still has room: signed in, in French', async ({ page, context }) => {
		// The case that broke, and the one this spec did not have. French labels
		// are longer than English ones and a signed-in row carries a name and a
		// rank badge, so this is the most crowded the header ever gets.
		await context.addCookies([
			{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
		]);
		await page.addInitScript(() => {
			try {
				localStorage.setItem('skilluv-locale', 'fr');
			} catch {
				/* storage unavailable */
			}
		});

		for (const width of [1280, 1440, 1920]) {
			await page.setViewportSize({ width, height: 900 });
			await gotoHydrated(page, '/challenges');
			const o = await overlap(page);
			expect(o, `pill and controls only ${o}px apart at ${width}px`).toBeLessThanOrEqual(-16);
		}
	});

	test('a way to navigate exists at every width', async ({ page }) => {
		// The pill and the menu button trade places at xl. If both breakpoints
		// were not moved together there would be a band with neither.
		for (const width of [400, 768, 1024, 1279, 1440]) {
			await page.setViewportSize({ width, height: 896 });
			await gotoHydrated(page, '/');
			const pill = await page.getByTestId('nav-pill').isVisible().catch(() => false);
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
