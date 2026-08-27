/**
 * SKI-297 / SKI-299 — the two moderation surfaces the front had to grow.
 *
 * Both endpoints families were served for a while with no page calling them:
 * `POST /moderation/vouchings/{id}/break` had no listing to find a target in,
 * and the external-signal queue was reachable only by typing a URL nobody
 * knew. The capabilities are granted through mocks here; the parcours specs
 * cover the refusal against the real backend.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

test.beforeEach(async ({ page, context }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage unavailable
		}
	});
	await context.addCookies([
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
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

const moderatorCapability = {
	data: [{ capability: 'community_moderator', granted_at: '2026-01-01', granted_reason: 'seed' }]
};

const queue = {
	data: {
		vouchings: [
			{
				id: 'v1',
				status: 'live',
				voucher_id: 'u1',
				voucher_username: 'doyenne',
				voucher_display_name: 'Ada Lovelace',
				voucher_rank: 'doyen',
				vouched_id: 'u2',
				vouched_username: 'suspecte',
				vouched_display_name: 'Une Suspecte',
				vouched_user_flagged: true,
				at_stake_kind: 'rank_temporary',
				statement: 'je réponds de son travail',
				active_until: '2027-01-01T00:00:00Z',
				created_at: '2026-08-01T00:00:00Z',
				broken_at: null,
				broken_by: null,
				break_reason: null
			}
		],
		status: 'live',
		total: 1,
		limit: 50,
		offset: 0
	}
};

test.describe('File des cautions', () => {
	test('un modérateur voit la file, les deux parties et le rang en jeu', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/capabilities', handler: json(moderatorCapability) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) },
			{ path: '/moderation/vouchings', handler: json(queue) }
		]);

		await gotoHydrated(page, '/moderation/vouchings');

		await expect(page.getByRole('heading', { name: 'File des cautions' })).toBeVisible();
		// Both parties are links: the whole point of SKI-301 is that a
		// caution can be gone and checked.
		await expect(page.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
			'href',
			'/profile/doyenne'
		);
		await expect(page.getByRole('link', { name: 'Une Suspecte' })).toHaveAttribute(
			'href',
			'/profile/suspecte'
		);
		// The flag is what turns a listing into a queue, and the rank is the
		// cost of the gesture, shown before it is imposed.
		await expect(page.getByText('Signalé', { exact: true })).toBeVisible();
		await expect(page.getByText('Rang doyen')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Rompre', exact: true })).toBeVisible();
	});

	test('rompre demande un motif avant de partir', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/capabilities', handler: json(moderatorCapability) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) },
			{ path: '/moderation/vouchings', handler: json(queue) }
		]);

		await gotoHydrated(page, '/moderation/vouchings');
		await page.getByRole('button', { name: 'Rompre', exact: true }).click();

		await expect(page.getByText('Rompre cette caution ?')).toBeVisible();
		// The reason is what the audit log keeps; the dialog refuses without
		// one rather than letting the backend answer 400.
		await page.getByRole('button', { name: 'Confirmer', exact: true }).click();
		await expect(page.getByText('Une raison est requise pour cette action.')).toBeVisible();
	});

	test('une file vide se lit comme telle', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/capabilities', handler: json(moderatorCapability) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) },
			{
				path: '/moderation/vouchings',
				handler: json({
					data: { vouchings: [], status: 'live', total: 0, limit: 50, offset: 0 }
				})
			}
		]);

		await gotoHydrated(page, '/moderation/vouchings');
		await expect(page.getByText('Aucune caution dans cet état.')).toBeVisible();
	});

	test('sans capability, la page refuse explicitement', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) }
		]);

		await gotoHydrated(page, '/moderation/vouchings');
		await expect(page.getByRole('heading', { name: 'File des cautions' })).toBeVisible();
		await expect(page.getByText(/community_moderator/)).toBeVisible();
	});
});

const pending = {
	data: {
		pending: [
			{
				id: 's1',
				user_id: 'b2bd9174-0828-46b1-adc3-11aa70ffc9f3',
				provider: 'github',
				url: 'https://github.com/example',
				title: 'Mainteneur de example',
				verified_at: null,
				verification_method: null,
				verified_by: null,
				meta: {},
				created_at: '2026-08-01T00:00:00Z'
			}
		]
	}
};

test.describe('File des signaux externes', () => {
	test('un modérateur voit la file et ses deux gestes', async ({ page }) => {
		await mockApi(page, [
			{ path: '/users/me/capabilities', handler: json(moderatorCapability) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) },
			{ path: '/moderation/external-signals', handler: json(pending) }
		]);

		await gotoHydrated(page, '/moderation/external-signals');

		await expect(page.getByRole('heading', { name: 'File des signaux externes' })).toBeVisible();
		await expect(page.getByText('Mainteneur de example')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Confirmer la propriété' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Supprimer' })).toBeVisible();
	});

	test('la suppression envoie le motif en query string', async ({ page }) => {
		let deleteUrl = '';
		await mockApi(page, [
			{ path: '/users/me/capabilities', handler: json(moderatorCapability) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) },
			{
				path: '/moderation/external-signals/s1',
				handler: (route) => {
					deleteUrl = route.request().url();
					return route.fulfill({ status: 204, body: '' });
				}
			},
			{ path: '/moderation/external-signals', handler: json(pending) }
		]);

		await gotoHydrated(page, '/moderation/external-signals');
		await page.getByRole('button', { name: 'Supprimer' }).click();
		await page.getByLabel('Raison').fill('le lien pointe vers le compte de quelqu’un d’autre');
		await page.getByRole('button', { name: 'Confirmer', exact: true }).click();

		await expect(page.getByText('Aucun signal en attente.')).toBeVisible();
		// Before this the client sent no motive at all, which the backend
		// now refuses outright.
		expect(new URL(deleteUrl).searchParams.get('reason')).toContain('le lien pointe');
	});
});
