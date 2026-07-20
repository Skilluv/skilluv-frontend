import { test, expect, type Page, type Route } from '@playwright/test';
import { expectNoSeriousA11yViolations } from './utils/a11y';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage might be unavailable in some contexts
		}
	});
});

type ApiRoute = { path: string; handler: (route: Route) => Promise<void> | void };

async function mockApi(page: Page, routes: ApiRoute[]) {
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		const match = routes.find((r) => url.pathname.endsWith(r.path));
		if (match) {
			await match.handler(route);
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ data: {} })
		});
	});
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
			bio: 'Backend engineer.',
			avatar_url: null,
			github: 'kofi',
			linkedin: null,
			website: null,
			twitter: null,
			member_since: '2025-01-01'
		},
		stats: {
			challenges_completed: 12,
			total_fragments: 3400,
			streak_current: 9,
			trust_score: 87
		},
		skill_tree: [],
		heatmap_summary: [],
		badges: []
	}
};

const badgesPayload = {
	data: {
		user_id: 'user-42',
		rank: {
			rank: 'artisan',
			achieved_at: '2026-01-15',
			previous_rank: 'ranger'
		},
		skill_patches: [
			{
				rule_slug: 'react-fundamentals',
				display_name: 'React fundamentals',
				rarity: 'rare',
				earned_at: '2026-02-01',
				source_proofs_count: 3
			},
			{
				rule_slug: 'clean-architecture',
				display_name: 'Clean architecture',
				rarity: 'epic',
				earned_at: '2026-03-01',
				source_proofs_count: 5
			}
		],
		medals: [
			{
				rule_slug: 'season-2-champion',
				display_name: 'Season 2 champion',
				rarity: 'legendary',
				earned_at: '2026-04-01',
				source_proofs_count: 1
			}
		],
		challenge_seals_count: 12,
		event_stamps_count: 3,
		guild_crests: [],
		total_badges: 16
	}
};

const orientationsPayload = {
	data: [
		{
			orientation_slug: 'dev-frontend',
			orientation_name: 'Dev frontend',
			mode: 'active',
			is_primary: true,
			started_at: '2025-06-01',
			working_languages: ['fr', 'en'],
			timezone: 'Africa/Porto-Novo'
		}
	]
};

const capabilitiesPayload = {
	data: [
		{
			capability: 'mentor',
			granted_at: '2026-01-01',
			granted_reason: 'auto-promotion'
		}
	]
};

test.describe('Profile page — badges wall', () => {
	test.beforeEach(async ({ page }) => {
		await mockApi(page, [
			{
				path: '/profile/public/kofi',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify(profilePayload)
					})
			},
			{
				path: '/users/user-42/badges',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify(badgesPayload)
					})
			},
			{
				path: '/users/user-42/orientations',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify(orientationsPayload)
					})
			},
			{
				path: '/users/user-42/capabilities',
				handler: (route) =>
					route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify(capabilitiesPayload)
					})
			},
			{
				path: '/auth/me',
				handler: (route) =>
					route.fulfill({
						status: 401,
						contentType: 'application/json',
						body: JSON.stringify({
							error: { code: 'AUTH_UNAUTHORIZED', message: 'nope' },
							meta: { request_id: 'r', timestamp: '2026-01-01' }
						})
					})
			}
		]);
	});

	test('renders identity header, rank chevron and skill patches', async ({ page }) => {
		await page.goto('/profile/kofi');
		await expect(page.getByRole('heading', { name: 'Kofi Adjovi' })).toBeVisible();
		await expectNoSeriousA11yViolations(page);
		await expect(page.getByRole('heading', { name: 'Rang' })).toBeVisible();
		await expect(page.getByLabel('Rang Artisan')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Compétences prouvées' })).toBeVisible();
		await expect(page.getByLabel(/React fundamentals — rare/i)).toBeVisible();
		await expect(page.getByLabel(/Clean architecture — epic/i)).toBeVisible();
	});

	test('renders medals section and counters', async ({ page }) => {
		await page.goto('/profile/kofi');
		await expect(page.getByRole('heading', { name: 'Médailles' })).toBeVisible();
		await expect(page.getByLabel(/Médaille Season 2 champion — legendary/i)).toBeVisible();
		await expect(page.getByText('12').first()).toBeVisible();
		await expect(page.getByText('sceaux de challenges')).toBeVisible();
		await expect(page.getByText('timbres d\'événements')).toBeVisible();
	});

	test('renders orientation list and contribution section', async ({ page }) => {
		await page.goto('/profile/kofi');
		await expect(page.getByRole('heading', { name: 'Orientations métier' })).toBeVisible();
		await expect(page.getByText('Dev frontend')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Comment cette personne contribue' })).toBeVisible();
		await expect(page.getByLabel(/Mentor: .*/i)).toBeVisible();
	});
});
