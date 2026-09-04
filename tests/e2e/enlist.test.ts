import { test, expect, type Page } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

/**
 * The two screens between the entrance and the pact: the fresco of classes and
 * the trades of the chosen one.
 *
 * The pact itself lives in auth.test.ts, next to the rest of the account
 * creation it belongs to.
 */

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			// Locale pinned so text assertions are deterministic. Nothing clears
			// the enlistment here on purpose: Playwright gives each test its own
			// context, so session storage starts empty anyway — and an init
			// script that wiped it would also wipe it on `reload()`, which is the
			// one thing the persistence test is trying to observe.
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage might be unavailable in some contexts
		}
	});
});

/** The catalogue, as the backend answers it for one discipline. */
function orientation(slug: string, name: string, domain = 'code') {
	return {
		id: `00000000-0000-0000-0000-${slug.slice(0, 12).padEnd(12, '0')}`,
		slug,
		name,
		description: `Ce que fait un ${name}.`,
		primary_domain: domain,
		secondary_domains: [],
		tags: ['web'],
		is_curated: true,
		is_archived: false
	};
}

/**
 * The catalogue envelope, as the handler actually writes it.
 *
 * These fixtures used to answer a bare array, which is what the client was
 * typed for and never what the backend sent: `OrientationsCatalogResponse` has
 * carried `{ orientations, pagination, total }` since PR #40. A mock that
 * agrees with the client instead of with the server proves the two agree with
 * each other and nothing else.
 */
function catalogue(items: ReturnType<typeof orientation>[]) {
	return {
		data: {
			orientations: items,
			pagination: { limit: 200, offset: 0 },
			total: items.length
		}
	};
}

/** `/orientation-counts`: every discipline and its total, in one call. */
async function mockCounts(page: Page, totals: Record<string, number>) {
	await page.route('**/api/orientation-counts**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				data: {
					domains: Object.entries(totals).map(([domain, total]) => ({ domain, total })),
					total: Object.values(totals).reduce((sum, n) => sum + n, 0)
				}
			})
		})
	);
}

/**
 * Take a trade, wherever it sits on the ring.
 *
 * The trades are a carousel now, not a row. Only the card facing you can be
 * taken; clicking one turned away brings it to the front instead, which is
 * what a carousel is expected to do and what stops somebody enrolling in a
 * trade they can only see edge-on.
 *
 * So reaching a trade is: click until it is the front card, then click once
 * more to take it. The loop is bounded — a ring of four needs at most four
 * turns, and an unbounded one would hang rather than fail if the ring ever
 * stopped turning.
 */
async function bringToFront(page: Page, slug: string, total: number) {
	const card = page.getByTestId(`path-card-${slug}`);
	const seat = page.locator('[data-front]').filter({ has: card });
	for (let i = 0; i <= total; i++) {
		if ((await seat.getAttribute('data-front')) === 'true') return card;
		// Turned with the keyboard rather than by clicking the card. A seat
		// beside the front one is partly behind it, so its centre is not
		// reliably clickable — and a test that depends on hit-testing a moving,
		// overlapping card fails for reasons that have nothing to do with the
		// behaviour under test. Clicking a side card is covered on its own.
		await page.keyboard.press('ArrowRight');
		// Waited out, because repeated presses deliberately queue: pressing
		// again mid-flight asks for one seat further, which is right for a
		// person and wrong for a loop that wants to arrive at a named one.
		await page.waitForTimeout(420);
	}
	throw new Error(`never reached the front of the ring: ${slug}`);
}

async function takeTrade(page: Page, slug: string, total: number) {
	const card = await bringToFront(page, slug, total);
	await card.click();
}

async function mockCatalogue(page: Page, items: ReturnType<typeof orientation>[]) {
	await page.route('**/api/orientations**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(catalogue(items))
		})
	);
}

// ---------------------------------------------------------------------------
// The fresco
// ---------------------------------------------------------------------------

test.describe('Enlistment — wall', () => {
	test('opens on the first domain and names it', async ({ page }) => {
		await gotoHydrated(page, '/auth/register/domain');
		const plate = page.getByTestId('domain-plate-code');
		await expect(plate).toBeVisible();
		await expect(plate.getByRole('heading', { name: 'Code' })).toBeVisible();
	});

	test('the URL decides which domain is staged', async ({ page }) => {
		await gotoHydrated(page, '/auth/register/domain?d=audio');
		await expect(page.getByTestId('domain-plate-audio')).toBeVisible();
		// The others are still in the DOM — inert, not removed — so a screen
		// reader knows there are eleven of them.
		await expect(page.getByTestId('domain-plate-code')).toHaveCount(1);
	});

	test('an unknown domain in the URL falls back rather than breaking', async ({ page }) => {
		await gotoHydrated(page, '/auth/register/domain?d=underwater-basket-weaving');
		await expect(page.getByTestId('domain-plate-code')).toBeVisible();
	});

	test('the right arrow walks to the next domain', async ({ page }) => {
		await gotoHydrated(page, '/auth/register/domain?d=code');
		await page.keyboard.press('ArrowRight');
		await page.waitForURL('**/auth/register/domain?d=design', { timeout: 10_000 });
		await expect(page.getByTestId('domain-plate-design')).toBeVisible();
	});

	test('the left arrow wraps around from the first domain to the last', async ({ page }) => {
		await gotoHydrated(page, '/auth/register/domain?d=code');
		await page.keyboard.press('ArrowLeft');
		await page.waitForURL('**/auth/register/domain?d=education', { timeout: 10_000 });
	});

	test('choosing a domain leads to its trades', async ({ page }) => {
		await mockCatalogue(page, [orientation('dev-frontend', 'Développeur frontend')]);
		await gotoHydrated(page, '/auth/register/domain?d=design');
		await page.getByTestId('domain-plate-design').getByRole('link').click();
		await page.waitForURL('**/auth/register/path?d=design', { timeout: 10_000 });
	});

	test('the trade count appears only once the catalogue answered', async ({ page }) => {
		// The wall asks `/orientation-counts` now: one call for all twelve
		// disciplines, instead of one catalogue page per discipline read only
		// for its length. Eleven requests pulling up to 2 200 rows to end up
		// with eleven numbers, on the first screen after "start".
		await mockCounts(page, { code: 2 });
		await gotoHydrated(page, '/auth/register/domain?d=code');
		await expect(page.getByTestId('domain-plate-code').getByText('2 métiers')).toBeVisible();
	});

	test('a catalogue that fails leaves the domain unlabelled rather than showing zero', async ({
		page
	}) => {
		await page.route('**/api/orientation-counts**', (route) => route.abort());
		await gotoHydrated(page, '/auth/register/domain?d=code');
		await expect(page.getByTestId('domain-plate-code')).toBeVisible();
		await expect(page.getByText(/0 métiers/)).toHaveCount(0);
	});
});

// ---------------------------------------------------------------------------
// The trades
// ---------------------------------------------------------------------------

test.describe('Enlistment — trades', () => {
	const four = [
		orientation('dev-frontend', 'Développeur frontend'),
		orientation('dev-backend', 'Développeur backend'),
		orientation('dev-mobile', 'Développeur mobile'),
		orientation('dev-embarque', 'Développeur embarqué')
	];

	test('asks the catalogue for one discipline, not for everything', async ({ page }) => {
		const urls: string[] = [];
		await page.route('**/api/orientations**', (route) => {
			urls.push(route.request().url());
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(catalogue(four))
			});
		});

		await gotoHydrated(page, '/auth/register/path?d=code');
		await expect(page.getByTestId('path-card-dev-frontend')).toBeVisible();

		// The cap is 200 and the catalogue holds ~255: a request with no domain
		// would silently return the backend's default page of 50.
		expect(urls.some((u) => u.includes('domain=code') && u.includes('limit=200'))).toBe(true);
	});

	test('with no domain chosen it sends you back to the wall', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path');
		await page.waitForURL('**/auth/register/domain', { timeout: 10_000 });
	});

	test('a trade can be taken and given back', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');

		const card = page.getByTestId('path-card-dev-frontend');
		await takeTrade(page, 'dev-frontend', four.length);
		await expect(card).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('enlist-continue')).toBeVisible();

		// Already at the front, so one click gives it back.
		await card.click();
		await expect(card).toHaveAttribute('aria-pressed', 'false');
		// The tray only exists while something is in it.
		await expect(page.getByTestId('enlist-continue')).toHaveCount(0);
	});

	test('the cap of three is enforced and explained', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');

		for (const slug of ['dev-frontend', 'dev-backend', 'dev-mobile']) {
			await takeTrade(page, slug, four.length);
		}

		// Brought to the front and then clicked: the cap is what must refuse it,
		// not its position on the ring.
		const fourth = await bringToFront(page, 'dev-embarque', four.length);
		await fourth.click();
		await expect(fourth).toHaveAttribute('aria-pressed', 'false');
		await expect(page.getByText(/Tu en as déjà 3/i)).toBeVisible();
	});

	test('a card turned away is brought to the front rather than taken', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');

		// The second trade starts one seat along. Clicking it must turn the ring
		// to it, not enrol somebody in a trade they can only see edge-on.
		const card = page.getByTestId('path-card-dev-backend');
		const seat = page.locator('[data-front]').filter({ has: card });
		await expect(seat).toHaveAttribute('data-front', 'false');

		// Dispatched on the element rather than clicked at a point. A seat beside
		// the front one is partly behind it, so a positional click lands on
		// whatever is topmost there — which is the front card, and would prove
		// nothing about this one. What is under test is what the seat does with
		// a click, not where the pointer has to be to deliver it.
		await card.dispatchEvent('click');
		await expect(seat).toHaveAttribute('data-front', 'true');
		await expect(card).toHaveAttribute('aria-pressed', 'false');
	});

	test('the ring has no end: turning past the last trade comes round', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');

		const first = page.locator('[data-front]').filter({
			has: page.getByTestId('path-card-dev-frontend')
		});
		await expect(first).toHaveAttribute('data-front', 'true');

		// One turn per trade brings the first one back round. A rail would have
		// stopped at the fourth.
		for (let i = 0; i < four.length; i++) await page.keyboard.press('ArrowRight');
		await expect(first).toHaveAttribute('data-front', 'true');

		// And backwards from the first lands on the last, not on nothing.
		await page.keyboard.press('ArrowLeft');
		const last = page.locator('[data-front]').filter({
			has: page.getByTestId('path-card-dev-embarque')
		});
		await expect(last).toHaveAttribute('data-front', 'true');
	});

	test('a swipe turns the ring, and follows the hand while it does', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');

		const first = page.locator('[data-front]').filter({
			has: page.getByTestId('path-card-dev-frontend')
		});
		await expect(first).toHaveAttribute('data-front', 'true');

		const ring = page.getByTestId('path-ring');
		const box = (await ring.boundingBox())!;
		const y = box.y + box.height / 2;

		// A real drag, not a click: down, several moves, up. The moves matter —
		// the first version only turned on release thresholds, so a gesture that
		// moved the finger and let go looked like nothing had happened.
		await page.mouse.move(box.x + box.width * 0.7, y);
		await page.mouse.down();
		for (let x = 0; x <= 200; x += 40) {
			await page.mouse.move(box.x + box.width * 0.7 - x, y);
		}
		// Held still before letting go, so the release carries no speed. The
		// ring has momentum now: a throw lands where its speed takes it, and a
		// test that names the seat has to remove the throw to be about the
		// drag. The flick test below is the one that exercises speed.
		await page.mouse.move(box.x + box.width * 0.7 - 200, y);
		await page.mouse.up();

		// Dragged left by 200px against a step of 140, so one seat and no more.
		await expect(first).toHaveAttribute('data-front', 'false');
		const second = page.locator('[data-front]').filter({
			has: page.getByTestId('path-card-dev-backend')
		});
		await expect(second).toHaveAttribute('data-front', 'true');
	});

	test('a modest drag turns the ring, not only a long haul', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');

		const first = page.locator('[data-front]').filter({
			has: page.getByTestId('path-card-dev-frontend')
		});
		await expect(first).toHaveAttribute('data-front', 'true');

		const ring = page.getByTestId('path-ring');
		const box = (await ring.boundingBox())!;
		const y = box.y + box.height / 2;
		const from = box.x + box.width / 2;

		// Ninety pixels against a step of a hundred and forty: past halfway, so
		// it settles on the next seat whatever speed it was released at. The
		// earlier version turned on a rounded distance alone and needed the
		// best part of a card before anything happened at all.
		//
		// It deliberately does not test the throw. Velocity comes from the time
		// between moves, and Playwright's own pace differs by engine — a
		// gesture that is a flick in Chromium is a slow drag in Firefox. What
		// speed adds is covered by the model, not by a test that cannot drive
		// it honestly.
		await page.mouse.move(from, y);
		await page.mouse.down();
		for (const dx of [20, 45, 70, 90]) await page.mouse.move(from - dx, y);
		await page.mouse.up();

		await expect(first).toHaveAttribute('data-front', 'false');
	});

	test('two fingers on a trackpad turn the ring', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');

		const first = page.locator('[data-front]').filter({
			has: page.getByTestId('path-card-dev-frontend')
		});
		await expect(first).toHaveAttribute('data-front', 'true');

		const ring = page.getByTestId('path-ring');
		const box = (await ring.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

		// A trackpad has no pointer gesture: two fingers sideways arrive as a
		// wheel with a horizontal delta, which none of the drag code ever sees.
		for (let i = 0; i < 6; i++) await page.mouse.wheel(40, 0);

		await expect(first).toHaveAttribute('data-front', 'false');
	});

	test('scrolling the page past the ring is not trapped by it', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');

		const first = page.locator('[data-front]').filter({
			has: page.getByTestId('path-card-dev-frontend')
		});
		const ring = page.getByTestId('path-ring');
		const box = (await ring.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

		// Vertical belongs to the page. A carousel that eats a downward scroll
		// because the pointer happened to be over it is a trap.
		for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 60);
		await expect(first).toHaveAttribute('data-front', 'true');
	});

	test('a swipe does not take the trade it passed over', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');

		const card = page.getByTestId('path-card-dev-frontend');
		const ring = page.getByTestId('path-ring');
		const box = (await ring.boundingBox())!;
		const y = box.y + box.height / 2;

		// The drag starts on the front card, which is a button. Releasing must
		// not enrol anybody in it.
		await page.mouse.move(box.x + box.width / 2, y);
		await page.mouse.down();
		for (let x = 0; x <= 200; x += 40) await page.mouse.move(box.x + box.width / 2 - x, y);
		await page.mouse.up();

		await expect(card).toHaveAttribute('aria-pressed', 'false');
		await expect(page.getByTestId('enlist-continue')).toHaveCount(0);
	});

	test('the domain survives a reload', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');
		await takeTrade(page, 'dev-frontend', four.length);

		await page.reload();
		await expect(page.getByTestId('path-card-dev-frontend')).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	test('switching domain drops trades that belonged to the previous one', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');
		await takeTrade(page, 'dev-frontend', four.length);
		await expect(page.getByTestId('enlist-continue')).toBeVisible();

		await mockCatalogue(page, [orientation('ui-designer', 'Designer UI', 'design')]);
		await gotoHydrated(page, '/auth/register/path?d=design');

		await expect(page.getByTestId('path-card-ui-designer')).toBeVisible();
		await expect(page.getByTestId('enlist-continue')).toHaveCount(0);
	});

	test('an empty class says so instead of showing nothing', async ({ page }) => {
		await mockCatalogue(page, []);
		await gotoHydrated(page, '/auth/register/path?d=education');
		await expect(page.getByText(/Aucun métier ouvert/i)).toBeVisible();
	});
});
