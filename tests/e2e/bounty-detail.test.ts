/**
 * S4.4 (SKI-52) — /bounties/[id]: detail, claim and PR attachment.
 *
 * Only the listing was covered. Claiming a bounty commits a contributor against
 * a paid task, and attaching the PR is what makes it payable — neither had any
 * coverage.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

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

function bounty(overrides: Record<string, unknown> = {}) {
	return {
		id: 'b-1',
		title: 'Corriger le parsing des dates ISO',
		description: 'Le parser casse sur les offsets negatifs.',
		repo: 'skilluv/skilluv-backend',
		issue_url: 'https://github.com/skilluv/skilluv-backend/issues/42',
		issue_number: 42,
		reward_credits: '250',
		fragments_bonus: 80,
		required_skills: ['rust'],
		tags: ['bug'],
		difficulty: 3,
		status: 'open',
		expires_at: null,
		created_at: '2026-08-01T09:00:00Z',
		company_name: 'Acme Corp',
		active_claims: 0,
		...overrides
	};
}

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

test.beforeEach(async ({ page, context }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
	await context.addCookies([
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
});

test.describe('S4.4 bounty detail', () => {
	test('affiche la bounty, sa recompense et son issue', async ({ page }) => {
		await mockApi(page, [{ path: '/bounties/b-1', handler: json({ data: bounty() }) }, ...common]);
		await gotoHydrated(page, '/bounties/b-1');

		await expect(
			page.getByRole('heading', { name: 'Corriger le parsing des dates ISO' })
		).toBeVisible();
		await expect(page.getByText('Le parser casse sur les offsets negatifs.')).toBeVisible();
		await expect(page.getByText('80')).toBeVisible();
		await expect(
			page.getByRole('link', { name: /github\.com|issue/i }).first()
		).toBeVisible();
	});

	test('revendiquer une bounty ouverte appelle le back', async ({ page }) => {
		let claimCalls = 0;
		await mockApi(page, [
			{
				path: '/bounties/b-1/claim',
				handler: (route) => {
					claimCalls++;
					return json({
						data: { claim_id: 'cl-1', bounty_id: 'b-1', expires_at: '2026-08-20T09:00:00Z' }
					})(route);
				}
			},
			{ path: '/bounties/b-1', handler: json({ data: bounty() }) },
			...common
		]);
		await gotoHydrated(page, '/bounties/b-1');

		await page.getByRole('button', { name: 'Revendiquer cette bounty' }).click();
		await expect.poll(() => claimCalls).toBe(1);
	});

	test('une bounty revendiquee propose d attacher la PR', async ({ page }) => {
		let attached: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/bounties/b-1/pr',
				handler: (route) => {
					attached = route.request().postDataJSON();
					return json({ data: { attached: true } })(route);
				}
			},
			{ path: '/bounties/b-1', handler: json({ data: bounty({ status: 'claimed' }) }) },
			...common
		]);
		await gotoHydrated(page, '/bounties/b-1');

		await expect(page.getByRole('button', { name: 'Revendiquer cette bounty' })).toHaveCount(0);
		await page.getByRole('button', { name: 'Attacher ma PR' }).click();

		// The modal requires both the PR URL and its number.
		await page.getByLabel('URL de la PR').fill('https://github.com/skilluv/skilluv-backend/pull/77');
		await page.getByLabel('Numéro').fill('77');
		await page.getByRole('button', { name: 'Attacher', exact: true }).click();

		await expect.poll(() => attached).not.toBeNull();
		expect(JSON.stringify(attached)).toContain('pull/77');
	});

	test('une bounty deja payee n offre plus d action', async ({ page }) => {
		await mockApi(page, [
			{ path: '/bounties/b-1', handler: json({ data: bounty({ status: 'paid' }) }) },
			...common
		]);
		await gotoHydrated(page, '/bounties/b-1');

		await expect(
			page.getByRole('heading', { name: 'Corriger le parsing des dates ISO' })
		).toBeVisible();
		await expect(page.getByRole('button', { name: 'Revendiquer cette bounty' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Attacher ma PR' })).toHaveCount(0);
	});
});
