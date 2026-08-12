/**
 * SKI-104 — badge gallery and copy-paste snippets on the profile page.
 *
 * The component existed with no functional coverage: nothing checked that the
 * badge image pointed at the backend, nor that the snippets a user pastes into
 * a README match the badge actually rendered.
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

type ApiRoute = { path: string; handler: (route: Route) => Promise<void> | void };

async function mockApi(page: Page, routes: ApiRoute[]) {
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		const match = routes.find((r) => url.pathname.endsWith(r.path));
		if (match) return match.handler(route);
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ data: {} })
		});
	});
}

function json(body: unknown, status = 200) {
	return (route: Route) =>
		route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const profilePayload = {
	data: {
		user: {
			id: 'user-42',
			username: 'kofi',
			display_name: 'Kofi Adjovi',
			title: 'artisan',
			golden_stars: 2,
			skill_domain: 'code',
			country: 'BJ',
			city: 'Cotonou',
			bio: null,
			avatar_url: null,
			github: 'kofi',
			linkedin: null,
			website: null,
			twitter: null,
			member_since: '2025-01-01'
		},
		stats: { challenges_completed: 0, total_fragments: 0, streak_current: 0, trust_score: 50 },
		skill_tree: [],
		heatmap_summary: [],
		badges: []
	}
};

test.describe('SKI-104 badge gallery', () => {
	test.beforeEach(async ({ page }) => {
		await mockApi(page, [
			{ path: '/profile/kofi', handler: json(profilePayload) },
			{
				path: '/users/user-42/badges',
				handler: json({
					data: {
						user_id: 'user-42',
						rank: { rank: 'artisan', achieved_at: '2026-01-15', previous_rank: 'ranger' },
						skill_patches: [],
						medals: [],
						challenge_seals_count: 0,
						event_stamps_count: 0,
						guild_crests: [],
						total_badges: 0
					}
				})
			},
			{ path: '/users/user-42/orientations', handler: json({ data: [] }) },
			{ path: '/users/user-42/capabilities', handler: json({ data: [] }) },
			{
				path: '/geo/countries',
				handler: json({ data: [{ iso2: 'BJ', iso3: 'BEN', name: 'Bénin', dial_code: '229' }] })
			}
		]);
		// The badge SVG is served by the backend, outside /api, so it is not
		// covered by mockApi.
		await page.route('**/badge/**', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'image/svg+xml',
				body: '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20"></svg>'
			})
		);
	});

	test('affiche la section badges et le badge personnel', async ({ page }) => {
		await gotoHydrated(page, '/profile/kofi');

		const section = page.getByTestId('profile-badges-section');
		await expect(section).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Badge Skilluv' })).toBeVisible();

		// Absolute backend URL: a relative path would resolve against this app,
		// which serves no /badge route.
		const badge = section.getByAltText(/Skilluv badge kofi/i);
		await expect(badge).toBeVisible();
		await expect(badge).toHaveAttribute('src', /^https?:\/\/.+\/badge\/user\/kofi\/validated\.svg$/);
	});

	test('les snippets pointent vers la meme image que l apercu', async ({ page }) => {
		await gotoHydrated(page, '/profile/kofi');
		const section = page.getByTestId('profile-badges-section');

		const badgeSrc = await section.getByAltText(/Skilluv badge kofi/i).getAttribute('src');
		expect(badgeSrc).toBeTruthy();

		const markdown = await section.locator('pre', { hasText: '![Skilluv]' }).first().innerText();
		expect(markdown).toContain(badgeSrc as string);
		// The badge links to the public profile, not to the backend.
		expect(markdown).toContain('https://skill-uv.com/profile/kofi');

		const html = await section.locator('pre', { hasText: '<a href=' }).first().innerText();
		expect(html).toContain(badgeSrc as string);
		expect(html).toContain('https://skill-uv.com/profile/kofi');
	});

	test('le bouton copier confirme la copie', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await gotoHydrated(page, '/profile/kofi');

		const section = page.getByTestId('profile-badges-section');
		await section.getByRole('button', { name: 'Copier' }).first().click();
		await expect(page.getByText('Copie', { exact: true })).toBeVisible();
	});

	test('un badge non genere affiche un repli lisible', async ({ page }) => {
		// Override the badge route: 404 mimics a user with no validated
		// contribution yet.
		await page.route('**/badge/**', (route) => route.fulfill({ status: 404, body: '' }));

		await gotoHydrated(page, '/profile/kofi');
		await expect(page.getByText('Badge pas encore genere')).toBeVisible();
	});
});
