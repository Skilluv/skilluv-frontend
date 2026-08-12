/**
 * S5.7 (SKI-50) — /mentorship/sessions: listing and cancellation.
 *
 * The parcours spec only asserted a heading. Cancellation moves money (partial
 * refund) and had no coverage at all, including the confirmation prompt that
 * guards it.
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

function session(overrides: Record<string, unknown> = {}) {
	return {
		id: 'sess-1',
		role: 'mentee',
		scheduled_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
		duration_minutes: 60,
		// Only pending / paid / confirmed land in the "upcoming" section, which is
		// the one carrying the join and cancel actions.
		status: 'confirmed',
		price_total_cents: 5000,
		currency: 'EUR',
		meeting_url: 'https://meet.example.com/abc',
		counterparty_name: 'Ama Doe',
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

test.describe('S5.7 mentorship sessions', () => {
	test('affiche une session a venir et son lien de visio', async ({ page }) => {
		await mockApi(page, [
			{ path: '/mentorship/sessions', handler: json({ data: { sessions: [session()] } }) },
			...common
		]);
		await gotoHydrated(page, '/mentorship/sessions');

		await expect(page.getByText('Ama Doe')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Rejoindre' })).toHaveAttribute(
			'href',
			'https://meet.example.com/abc'
		);
	});

	test('sans session, propose de trouver un mentor', async ({ page }) => {
		await mockApi(page, [
			{ path: '/mentorship/sessions', handler: json({ data: { sessions: [] } }) },
			...common
		]);
		await gotoHydrated(page, '/mentorship/sessions');
		await expect(page.getByRole('link', { name: /mentor/i }).first()).toBeVisible();
	});

	test('annuler demande confirmation et annonce le remboursement', async ({ page }) => {
		let cancelCalls = 0;
		await mockApi(page, [
			{
				path: '/mentorship/sessions/sess-1/cancel',
				handler: (route) => {
					cancelCalls++;
					return json({
						data: {
							status: 'cancelled_by_mentee',
							refund_amount_cents: 4000,
							refund_ratio: 0.8,
							stripe_refund_id: 're_1'
						}
					})(route);
				}
			},
			{ path: '/mentorship/sessions', handler: json({ data: { sessions: [session()] } }) },
			...common
		]);
		await gotoHydrated(page, '/mentorship/sessions');

		page.once('dialog', (d) => d.accept());
		await page.getByRole('button', { name: 'Annuler' }).click();

		await expect(page.getByText(/80\s*%/)).toBeVisible();
		expect(cancelCalls).toBe(1);
	});

	test('refuser la confirmation n annule rien', async ({ page }) => {
		let cancelCalls = 0;
		await mockApi(page, [
			{
				path: '/mentorship/sessions/sess-1/cancel',
				handler: (route) => {
					cancelCalls++;
					return json({ data: { status: 'cancelled_by_mentee', refund_amount_cents: 0, refund_ratio: 0, stripe_refund_id: null } })(route);
				}
			},
			{ path: '/mentorship/sessions', handler: json({ data: { sessions: [session()] } }) },
			...common
		]);
		await gotoHydrated(page, '/mentorship/sessions');

		page.once('dialog', (d) => d.dismiss());
		await page.getByRole('button', { name: 'Annuler' }).click();

		// Give the click a chance to have fired a request before asserting none did.
		await page.waitForTimeout(500);
		expect(cancelCalls).toBe(0);
	});

	test('une session deja annulee n offre plus le bouton', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/mentorship/sessions',
				handler: json({
					data: { sessions: [session({ status: 'cancelled_by_mentee', meeting_url: null })] }
				})
			},
			...common
		]);
		await gotoHydrated(page, '/mentorship/sessions');

		await expect(page.getByText('Ama Doe')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Annuler' })).toHaveCount(0);
	});
});
