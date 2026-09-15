/**
 * The open pool, and the GitHub link error the callback sends back.
 *
 * Both are surfaces the backend shipped and the front had not consumed: the
 * pool answered for twelve trades while only code was listed, and the
 * OAuth callbacks wrote `?<provider>_error=` to a URL nobody read.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage unavailable
		}
	});
});

function json(body: unknown, status = 200) {
	return (route: Route) =>
		route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

function slice(overrides: Record<string, unknown> = {}) {
	return {
		slice_id: '11111111-1111-1111-1111-111111111111',
		title: 'Une piste à mixer',
		slice_type: 'audio_artifact',
		slice_type_name: 'Livrable audio',
		domain: 'audio',
		subtype: null,
		difficulty: 2,
		fragments_reward: 120,
		project_slug: 'openscore',
		project_name: 'OpenScore',
		external_url: 'https://example.org/track',
		orientation_slug: 'audio-mixing',
		orientation_name: 'Mixage',
		tags: ['reaper'],
		opened_at: '2026-09-01T00:00:00Z',
		...overrides
	};
}

/** Records every `/open-slices` URL the page asks for. */
async function capturePool(page: Page, body: unknown) {
	const asked: string[] = [];
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		if (url.pathname.endsWith('/open-slices')) {
			asked.push(url.search);
			return json(body)(route);
		}
		return json({ data: {} })(route);
	});
	return asked;
}

test.describe('the open pool', () => {
	test('lists work from a trade that never had a listing', async ({ page }) => {
		await capturePool(page, { data: { slices: [slice()], domain: null, max_difficulty: 3 } });

		await gotoHydrated(page, '/open-slices');

		await expect(page.getByTestId('open-slices-page')).toBeVisible();
		const list = page.getByTestId('open-slices-list');
		await expect(list).toBeVisible();

		// An audio slice, rendered by the same list that serves code. Before
		// this page, `GET /api/open-slices` answered for all twelve trades
		// and the front read only the deprecated code-only route.
		await expect(list).toContainText('Une piste à mixer');
		await expect(list).toContainText('Livrable audio');
		await expect(list).toContainText('Audio');
		await expect(list).toContainText('120 fragments');

		// The title claims the work; the upstream is a second, explicit link.
		await expect(list.getByRole('link', { name: 'Une piste à mixer' })).toHaveAttribute(
			'href',
			'/slices/11111111-1111-1111-1111-111111111111'
		);
		const upstream = list.getByRole('link', { name: /Lire à la source/ });
		await expect(upstream).toHaveAttribute('href', 'https://example.org/track');
		await expect(upstream).toHaveAttribute('rel', /noopener/);
	});

	test('the trade filter lives in the URL, so the list can be sent to somebody', async ({
		page
	}) => {
		const asked = await capturePool(page, {
			data: { slices: [], domain: 'design', max_difficulty: 3 }
		});

		await gotoHydrated(page, '/open-slices?domain=design');

		// Read from the URL, not from component state: a reload and a pasted
		// link both have to land on the same pool.
		await expect.poll(() => asked.some((s) => s.includes('domain=design'))).toBe(true);
		await expect(page.getByRole('button', { name: 'Design' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	test('a default is left out of the query rather than spelled out', async ({ page }) => {
		const asked = await capturePool(page, { data: { slices: [], domain: null, max_difficulty: 3 } });

		await gotoHydrated(page, '/open-slices');
		await page.getByRole('button', { name: 'Tous les métiers' }).click();

		// `?domain=&max_difficulty=3` says what a bare URL says, reads worse,
		// shares worse, and is a second cache key on the server for one pool.
		await expect.poll(() => page.url()).not.toContain('domain=');
		expect(asked.every((s) => !s.includes('domain='))).toBe(true);
	});

	test('an empty pool and a refused filter do not look the same', async ({ page }) => {
		await page.route('**/api/**', async (route) => {
			const url = new URL(route.request().url());
			if (url.pathname.endsWith('/open-slices')) {
				// What the endpoint answers for a trade it does not know. An
				// empty list here would tell the reader the pool is empty when
				// the request was simply wrong.
				return route.fulfill({
					status: 400,
					contentType: 'application/json',
					body: JSON.stringify({
						error: { code: 'VALIDATION_ERROR', message: 'unknown domain' },
						meta: { request_id: 'r', timestamp: '2026-09-11' }
					})
				});
			}
			return json({ data: {} })(route);
		});

		await gotoHydrated(page, '/open-slices');
		await expect(page.getByRole('alert')).toBeVisible();
		await expect(page.getByTestId('open-slices-list')).toHaveCount(0);
	});

	test('the code hub reads the pool, scoped to its trade and surface', async ({ page }) => {
		const asked = await capturePool(page, {
			data: { slices: [slice({ domain: 'code', slice_type: 'github_issue' })], max_difficulty: 3 }
		});

		await gotoHydrated(page, '/code');

		await expect.poll(() => asked.length).toBeGreaterThan(0);
		expect(asked[0]).toContain('domain=code');
		expect(asked[0]).toContain('slice_type=github_issue');
		// Every row here is code: repeating the trade per line would be noise.
		await expect(page.getByTestId('code-first-issues-list')).not.toContainText('Code ·');
	});
});

test.describe('a provider link that did not take', () => {
	test('says why, on the step the callback returned to', async ({ page, context }) => {
		await context.addCookies([
			{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
		]);
		await page.route('**/api/**', (route) => json({ data: {} })(route));

		await gotoHydrated(page, '/settings/security?github_error=already_linked');

		const alert = page.getByRole('alert');
		await expect(alert).toBeVisible();
		await expect(alert).toContainText('déjà lié à un autre profil Skilluv');

		// Cleared once read: left in place it comes back on every reload and
		// travels in any link copied out of the address bar.
		await expect.poll(() => page.url()).not.toContain('github_error');

		// Retrying this one would fail identically — the way out is on the
		// other account — so the page does not pretend it might.
		await expect(alert.getByRole('link', { name: 'Réessayer' })).toHaveCount(0);
	});

	test('offers a retry for the failures that a retry can fix', async ({ page, context }) => {
		await context.addCookies([
			{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
		]);
		await page.route('**/api/**', (route) => json({ data: {} })(route));

		await gotoHydrated(page, '/settings/security?github_error=expired');

		const alert = page.getByRole('alert');
		await expect(alert).toContainText('expiré');
		await expect(alert.getByRole('link', { name: 'Réessayer' })).toBeVisible();
	});

	test('a URL with no error shows nothing at all', async ({ page, context }) => {
		await context.addCookies([
			{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
		]);
		await page.route('**/api/**', (route) => json({ data: {} })(route));

		await gotoHydrated(page, '/settings/security');
		await expect(page.getByText(/GitHub n’a pas été lié/)).toHaveCount(0);
	});

	test('names which of the four refused', async ({ page, context }) => {
		await context.addCookies([
			{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
		]);
		await page.route('**/api/**', (route) => json({ data: {} })(route));

		// Discord, Google and LinkedIn report the same five codes as GitHub
		// now. The parameter is namespaced so a settings page offering four
		// connect buttons can say which of them refused rather than leaving
		// the reader to guess — and the brand is named, not its slug.
		await gotoHydrated(page, '/settings/security?linkedin_error=already_linked');
		const alert = page.getByRole('alert');
		await expect(alert).toContainText('LinkedIn');
		await expect(alert).not.toContainText('compte linkedin');
		await expect.poll(() => page.url()).not.toContain('linkedin_error');
	});

	test('shows on the rite step whatever state the rite is in', async ({ page, context }) => {
		await context.addCookies([
			{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
		]);
		// Every endpoint the step reads is down, so the page renders its own
		// error branch. The banner used to live five conditions deep — under
		// the challenge having loaded, the rite not having started and a trade
		// being declared — so in this state, and in several ordinary ones, a
		// refused link returned somebody to an unchanged screen saying
		// nothing. It describes the navigation, not the rite.
		await page.route('**/api/**', (route) =>
			route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({
					error: { code: 'INTERNAL', message: 'down' },
					meta: { request_id: 'r', timestamp: '2026-09-15' }
				})
			})
		);

		await gotoHydrated(page, '/challenges/onboarding?github_error=already_linked');

		await expect(page.getByText(/déjà lié à un autre profil Skilluv/)).toBeVisible();
		await expect.poll(() => page.url()).not.toContain('github_error');
	});

	test('the rite step does not wait on a request it decided not to make', async ({ page }) => {
		// Signed out, so the page has no discipline to fetch a rite for. It
		// used to sit on skeletons for ever: `loading` starts true and only
		// the fetch clears it, and the fetch only runs when there is a
		// discipline. The navbar is removed on this step, so there was not
		// even a link off it.
		await page.route('**/api/**', (route) => json({ data: {} })(route));
		await gotoHydrated(page, '/challenges/onboarding');

		await expect(page.getByText(/Connecte-toi pour commencer/)).toBeVisible();
		await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();
	});

	test('no i18n key leaks as a raw dotted path', async ({ page }) => {
		await page.route('**/api/**', (route) => json({ data: {} })(route));
		await gotoHydrated(page, '/open-slices');
		const body = await page.locator('body').innerText();
		expect(body).not.toMatch(/\b(openSlices|oauthLink|githubLink)\.[a-zA-Z]+/);
	});
});
