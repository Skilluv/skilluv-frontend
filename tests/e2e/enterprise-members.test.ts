/**
 * S6.3 (SKI-53) — /enterprise/members: invite, share link, revoke.
 *
 * The parcours spec only asserted that an h1 rendered. Who can invite and who
 * can revoke is an access-control decision: a recruiter must not be able to add
 * or remove colleagues, and the owner must never be removable.
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

/** Ids match the mock backend fixtures so `isOwner` resolves as intended. */
const OWNER = {
	id: 'm-1',
	user_id: 'u-owner',
	username: 'yaa',
	display_name: 'Yaa Mensah',
	email: 'owner@acme.io',
	role: 'owner',
	status: 'active',
	invited_at: '2026-01-01T09:00:00Z',
	accepted_at: '2026-01-02T09:00:00Z'
};

const RECRUITER = {
	id: 'm-2',
	user_id: 'u-recruiter',
	username: 'kwame',
	display_name: 'Kwame Boateng',
	email: 'recruteur@acme.io',
	role: 'recruiter',
	status: 'active',
	invited_at: '2026-02-01T09:00:00Z',
	accepted_at: '2026-02-02T09:00:00Z'
};

const PENDING = {
	id: 'm-3',
	user_id: 'u-pending',
	username: 'abena',
	display_name: 'Abena Sarpong',
	email: 'abena@acme.io',
	role: 'recruiter',
	status: 'pending',
	invited_at: '2026-08-01T09:00:00Z',
	accepted_at: null
};

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

function membersRoute(members: unknown[]): ApiRoute {
	return { path: '/enterprise/members', handler: json({ data: { members } }) };
}

async function signIn(page: Page, token: 'owner' | 'recruiter') {
	await page.context().addCookies([
		{ name: 'access_token', value: token, domain: 'localhost', path: '/' }
	]);
}

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
});

test.describe('S6.3 enterprise members', () => {
	test('l owner voit les membres, les invitations en attente et les compteurs', async ({
		page
	}) => {
		await signIn(page, 'owner');
		await mockApi(page, [membersRoute([OWNER, RECRUITER, PENDING]), ...common]);
		await gotoHydrated(page, '/enterprise/members');

		await expect(page.getByText('Yaa Mensah').first()).toBeVisible();
		await expect(page.getByText('Kwame Boateng').first()).toBeVisible();
		await expect(page.getByText('abena@acme.io')).toBeVisible();
		await expect(page.getByText('Invitations en attente').first()).toBeVisible();
	});

	test('inviter un recruteur poste l email et rend un lien partageable', async ({ page }) => {
		let invited: Record<string, unknown> | null = null;
		await signIn(page, 'owner');
		await mockApi(page, [
			{
				path: '/enterprise/invite',
				handler: (route) => {
					invited = route.request().postDataJSON();
					return json({ data: { invite_token: 'tok-abcdef123456' } })(route);
				}
			},
			membersRoute([OWNER]),
			...common
		]);
		await gotoHydrated(page, '/enterprise/members');

		await page.getByRole('button', { name: /Inviter un recruteur/ }).click();
		await page.getByLabel('Email').fill('nouveau@acme.io');
		await page.getByRole('button', { name: "Envoyer l'invitation" }).click();

		await expect.poll(() => invited).not.toBeNull();
		expect(JSON.stringify(invited)).toContain('nouveau@acme.io');
		await expect(page.getByText('Lien généré')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Copier' })).toBeVisible();
	});

	test('l owner n est jamais retirable', async ({ page }) => {
		await signIn(page, 'owner');
		await mockApi(page, [membersRoute([OWNER, RECRUITER]), ...common]);
		await gotoHydrated(page, '/enterprise/members');

		// One "Retirer" only: the recruiter's. Removing the last owner would
		// lock the workspace for good.
		await expect(page.getByRole('button', { name: 'Retirer' })).toHaveCount(1);
	});

	test('retirer un membre demande confirmation', async ({ page }) => {
		let removed = 0;
		await signIn(page, 'owner');
		await mockApi(page, [
			{
				path: '/enterprise/members/u-recruiter',
				handler: (route) => {
					removed++;
					return json({ data: { removed: true } })(route);
				}
			},
			membersRoute([OWNER, RECRUITER]),
			...common
		]);
		await gotoHydrated(page, '/enterprise/members');

		page.once('dialog', (d) => d.dismiss());
		await page.getByRole('button', { name: 'Retirer' }).click();
		await page.waitForTimeout(400);
		expect(removed).toBe(0);

		page.once('dialog', (d) => d.accept());
		await page.getByRole('button', { name: 'Retirer' }).click();
		await expect.poll(() => removed).toBe(1);
	});

	test('un recruteur ne peut ni inviter ni retirer', async ({ page }) => {
		await signIn(page, 'recruiter');
		await mockApi(page, [membersRoute([OWNER, RECRUITER]), ...common]);
		await gotoHydrated(page, '/enterprise/members');

		await expect(page.getByText('Kwame Boateng').first()).toBeVisible();
		await expect(page.getByRole('button', { name: /Inviter un recruteur/ })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Retirer' })).toHaveCount(0);
	});
});
