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

async function mockCatalogue(page: Page, items: ReturnType<typeof orientation>[]) {
	await page.route('**/api/orientations**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ data: items })
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
		await mockCatalogue(page, [
			orientation('dev-frontend', 'Développeur frontend'),
			orientation('dev-backend', 'Développeur backend')
		]);
		await gotoHydrated(page, '/auth/register/domain?d=code');
		await expect(page.getByTestId('domain-plate-code').getByText('2 métiers')).toBeVisible();
	});

	test('a catalogue that fails leaves the domain unlabelled rather than showing zero', async ({
		page
	}) => {
		await page.route('**/api/orientations**', (route) => route.abort());
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
				body: JSON.stringify({ data: four })
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
		await card.click();
		await expect(card).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('enlist-continue')).toBeVisible();

		await card.click();
		await expect(card).toHaveAttribute('aria-pressed', 'false');
		// The tray only exists while something is in it.
		await expect(page.getByTestId('enlist-continue')).toHaveCount(0);
	});

	test('the cap of three is enforced and explained', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');

		for (const slug of ['dev-frontend', 'dev-backend', 'dev-mobile']) {
			await page.getByTestId(`path-card-${slug}`).click();
		}

		const fourth = page.getByTestId('path-card-dev-embarque');
		await fourth.click();
		await expect(fourth).toHaveAttribute('aria-pressed', 'false');
		await expect(page.getByText(/Tu en as déjà 3/i)).toBeVisible();
	});

	test('the domain survives a reload', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');
		await page.getByTestId('path-card-dev-frontend').click();

		await page.reload();
		await expect(page.getByTestId('path-card-dev-frontend')).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	test('switching domain drops trades that belonged to the previous one', async ({ page }) => {
		await mockCatalogue(page, four);
		await gotoHydrated(page, '/auth/register/path?d=code');
		await page.getByTestId('path-card-dev-frontend').click();
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
