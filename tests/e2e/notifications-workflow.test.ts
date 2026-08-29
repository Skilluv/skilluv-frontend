/**
 * SKI-97 — enriched notifications for the challenge workflow.
 *
 * Covers the localised bodies, the four inline CTAs and the grouping of
 * consecutive notifications about the same slice. None of this had any
 * coverage: the page recognised the types but nothing verified what a user
 * actually reads or can click.
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

function notif(
	id: string,
	type: string,
	data: Record<string, unknown>,
	overrides: Record<string, unknown> = {}
) {
	return {
		id,
		user_id: 'u-challenger',
		notification_type: type,
		title: 'Skilluv',
		body: 'fallback body',
		read: false,
		data,
		created_at: '2026-08-11T10:00:00Z',
		...overrides
	};
}

function page_(items: unknown[]) {
	return {
		data: items,
		pagination: { page: 1, per_page: 50, total: items.length, total_pages: 1 },
		meta: { request_id: 'r', timestamp: '2026-08-11' }
	};
}

async function signIn(
	page: Page,
	items: unknown[],
	locale: 'fr' | 'en' = 'fr',
	extra: ApiRoute[] = []
) {
	await page.addInitScript((l) => {
		try {
			localStorage.setItem('skilluv-locale', l as string);
		} catch {
			/* storage unavailable */
		}
	}, locale);
	await mockApi(page, [
		...extra,
		{ path: '/notifications/unread-count', handler: json({ data: { count: items.length } }) },
		{ path: '/notifications', handler: json(page_(items)) },
		{ path: '/users/me/capabilities', handler: json({ data: [] }) },
		{ path: '/users/me/orientations', handler: json({ data: [] }) }
	]);
}

test.beforeEach(async ({ context }) => {
	await context.addCookies([
		{ name: 'access_token', value: 'challenger', domain: 'localhost', path: '/' }
	]);
});

test.describe('SKI-97 enriched notification bodies', () => {
	test('rend les libelles du workflow en francais', async ({ page }) => {
		await signIn(page, [
			notif('n1', 'slice_claimed', { slice_title: 'Parser ISO', slice_id: 's-1' }),
			notif('n2', 'slice_ci_green', { slice_id: 's-2' }),
			notif('n3', 'slice_merged_upstream', {
				repo: 'skilluv/skilluv-backend',
				fragments_bonus: 120,
				slice_id: 's-3'
			})
		]);
		await gotoHydrated(page, '/notifications');

		await expect(page.getByText('Tu as claim la slice Parser ISO. 7 jours pour livrer.')).toBeVisible();
		await expect(page.getByText('Ta PR a passé la CI, en attente de validation Skilluv')).toBeVisible();
		await expect(
			page.getByText('Ta PR a été mergée sur skilluv/skilluv-backend. Bonus de 120 fragments.')
		).toBeVisible();
	});

	test('rend les memes libelles en anglais', async ({ page }) => {
		await signIn(
			page,
			[notif('n1', 'slice_claimed', { slice_title: 'ISO parser', slice_id: 's-1' })],
			'en'
		);
		await gotoHydrated(page, '/notifications');
		await expect(page.getByText('You claimed the slice ISO parser. 7 days to deliver.')).toBeVisible();
	});

	test('traduit le statut d une candidature validateur', async ({ page }) => {
		await signIn(page, [
			notif('n1', 'validator_application_status_changed', { domain: 'code', status: 'approved' })
		]);
		await gotoHydrated(page, '/notifications');
		await expect(page.getByText('Ta candidature validateur (code) a été acceptée')).toBeVisible();
	});

	test('retombe sur le body du back pour un type inconnu', async ({ page }) => {
		await signIn(page, [notif('n1', 'some_future_type', {}, { body: 'Message du backend' })]);
		await gotoHydrated(page, '/notifications');
		await expect(page.getByText('Message du backend')).toBeVisible();
	});
});

test.describe('SKI-97 inline CTAs', () => {
	test('un rejet propose de voir les raisons', async ({ page }) => {
		await signIn(page, [
			notif('n1', 'slice_rejected', { slice_id: 's-9', validator: 'ama', reason: 'Tests absents' })
		]);
		await gotoHydrated(page, '/notifications');

		await expect(page.getByText('Ta PR a été refusée par @ama. Raison : Tests absents')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Voir raisons et reclaim' })).toHaveAttribute(
			'href',
			'/slices/s-9'
		);
	});

	const invitation = () => [
		notif('n1', 'validator_invitation_received', {
			invitation_id: 'inv-1',
			domain: 'code',
			notes: 'Ton historique parle pour toi'
		})
	];

	test('accepter une invitation validateur se fait sans quitter le fil', async ({ page }) => {
		let accepted = 0;
		await signIn(page, invitation(), 'fr', [
			{
				path: '/validator-applications/inv-1/accept',
				handler: (route) => {
					accepted++;
					return json({ data: { accepted: true } })(route);
				}
			}
		]);
		await gotoHydrated(page, '/notifications');

		await page.getByRole('button', { name: 'Accepter' }).click();

		await expect.poll(() => accepted).toBe(1);
		// The decision replaces the buttons: the invitation is gone backend-side
		// but the notification stays, so live buttons would be a trap.
		await expect(page.getByTestId('invitation-outcome')).toHaveText('Invitation acceptée');
		await expect(page.getByRole('button', { name: 'Accepter' })).toHaveCount(0);
	});

	test('refuser demande confirmation avant d appeler le back', async ({ page }) => {
		let declined = 0;
		await signIn(page, invitation(), 'fr', [
			{
				path: '/validator-applications/inv-1/withdraw',
				handler: (route) => {
					declined++;
					return json({ data: { withdrawn: true } })(route);
				}
			}
		]);
		await gotoHydrated(page, '/notifications');

		page.once('dialog', (d) => d.dismiss());
		await page.getByRole('button', { name: 'Refuser' }).click();
		await page.waitForTimeout(400);
		expect(declined).toBe(0);

		page.once('dialog', (d) => d.accept());
		await page.getByRole('button', { name: 'Refuser' }).click();
		await expect.poll(() => declined).toBe(1);
		await expect(page.getByTestId('invitation-outcome')).toHaveText('Invitation refusée');
	});

	test('le detail de l invitation reste accessible', async ({ page }) => {
		await signIn(page, invitation());
		await gotoHydrated(page, '/notifications');

		await expect(page.getByRole('link', { name: 'Voir le détail' })).toHaveAttribute(
			'href',
			'/settings/validator-invitations/inv-1'
		);
	});

	test('une validation propose le PDF de l attestation', async ({ page }) => {
		const hash = 'c'.repeat(64);
		await signIn(page, [notif('n1', 'slice_validated', { attestation_hash: hash, slice_id: 's-1' })]);
		await gotoHydrated(page, '/notifications');

		// Absolute backend URL: the PDF is served outside this app.
		await expect(page.getByRole('link', { name: 'Télécharger PDF' })).toHaveAttribute(
			'href',
			new RegExp(`^https?://.+/verify/${hash}\\.pdf$`)
		);
	});

	test('un merge upstream propose de partager le badge', async ({ page }) => {
		await signIn(page, [
			notif('n1', 'slice_merged_upstream', { repo: 'skilluv/skilluv-ia', fragments_bonus: 40 })
		]);
		await gotoHydrated(page, '/notifications');

		await expect(page.getByRole('link', { name: 'Partager mon badge' })).toHaveAttribute(
			'href',
			/\/badge\/user\/.+\/validated\.svg$/
		);
	});
});

test.describe('SKI-97 grouping', () => {
	test('regroupe les notifications consecutives d une meme slice', async ({ page }) => {
		await signIn(page, [
			notif('n1', 'slice_claimed', { slice_id: 's-1', slice_title: 'Parser ISO' }),
			notif('n2', 'slice_fork_created', { slice_id: 's-1', fork_url: 'https://github.com/x/y' }),
			notif('n3', 'slice_ci_green', { slice_id: 's-1' }),
			notif('n4', 'slice_claimed', { slice_id: 's-2', slice_title: 'Autre slice' })
		]);
		await gotoHydrated(page, '/notifications');

		await expect(page.getByTestId('notif-group-count')).toHaveCount(1);
		await expect(page.getByTestId('notif-group-count')).toHaveText('3 notifications sur ce challenge');
		// The second slice keeps its own row.
		await expect(page.getByText('Tu as claim la slice Autre slice. 7 jours pour livrer.')).toBeVisible();
	});

	test('ne regroupe pas des slices differentes', async ({ page }) => {
		await signIn(page, [
			notif('n1', 'slice_ci_green', { slice_id: 's-1' }),
			notif('n2', 'slice_ci_green', { slice_id: 's-2' })
		]);
		await gotoHydrated(page, '/notifications');
		await expect(page.getByTestId('notif-group-count')).toHaveCount(0);
	});
});
