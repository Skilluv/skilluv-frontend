/**
 * S3.7 (SKI-51) — guild Applications and Invitations tabs, plus revocation.
 *
 * Unblocked by SKI-289, which typed the two list responses and added the
 * revocation route. Both tabs are owner/officer-only: the backend answers 403
 * to everyone else, so a plain member must not even see them.
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

const GUILD = {
	id: 'g-1',
	slug: 'les-forgerons',
	name: 'Les Forgerons',
	tag: 'FORG',
	description: 'Guilde de test.',
	color_hex: '#c2703a',
	created_at: '2026-01-01T09:00:00Z'
};

/** `user_id` decides the viewer's role, and therefore the visible tabs. */
function member(user_id: string, role: 'owner' | 'officer' | 'member', display_name: string) {
	return {
		user_id,
		username: display_name.toLowerCase().split(' ')[0],
		display_name,
		role,
		total_fragments: 100,
		joined_at: '2026-01-01T09:00:00Z'
	};
}

const APPLICATION = {
	id: 'app-1',
	applicant: { id: 'u-ama', username: 'ama', display_name: 'Ama Doe' },
	status: 'pending',
	applied_at: '2026-08-10T09:00:00Z',
	message: 'Je forge depuis deux ans.'
};

const DIRECT_INVITATION = {
	id: 'inv-1',
	invitee: { id: 'u-yao', username: 'yao', display_name: 'Yao Mensah' },
	token: null,
	sent_at: '2026-08-01T09:00:00Z',
	expires_at: '2026-09-01T09:00:00Z'
};

const LINK_INVITATION = {
	id: 'inv-2',
	invitee: null,
	token: { value: 'tok-abcdef' },
	sent_at: '2026-08-02T09:00:00Z',
	expires_at: '2026-09-02T09:00:00Z'
};

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

function guildRoutes(opts: {
	members: unknown[];
	applications?: unknown[];
	invitations?: unknown[];
	forbidden?: boolean;
}): ApiRoute[] {
	const forbid = json(
		{
			error: { code: 'AUTH_FORBIDDEN', message: 'Forbidden' },
			meta: { request_id: 'r', timestamp: '2026-08-12' }
		},
		403
	);
	return [
		{
			path: '/guilds/g-1/applications',
			handler: opts.forbidden ? forbid : json({ data: { applications: opts.applications ?? [] } })
		},
		{
			path: '/guilds/g-1/invitations',
			handler: opts.forbidden ? forbid : json({ data: { invitations: opts.invitations ?? [] } })
		},
		{ path: '/guilds/g-1/members', handler: json({ data: { members: opts.members } }) },
		{ path: '/guild-wars', handler: json({ data: { wars: [] } }) },
		{ path: '/guilds/les-forgerons', handler: json({ data: { guild: GUILD } }) },
		...common
	];
}

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

test.describe('S3.7 guild management tabs', () => {
	test('l owner voit les onglets candidatures et invitations', async ({ page }) => {
		await mockApi(
			page,
			guildRoutes({ members: [member('u-challenger', 'owner', 'Kofi Adjovi')] })
		);
		await gotoHydrated(page, '/guilds/les-forgerons');

		await expect(page.getByTestId('guild-tab-applications')).toBeVisible();
		await expect(page.getByTestId('guild-tab-invitations')).toBeVisible();
	});

	test('un simple membre ne voit pas ces onglets', async ({ page }) => {
		await mockApi(
			page,
			guildRoutes({
				members: [member('u-challenger', 'member', 'Kofi Adjovi')],
				forbidden: true
			})
		);
		await gotoHydrated(page, '/guilds/les-forgerons');

		await expect(page.getByTestId('guild-tab-members')).toBeVisible();
		await expect(page.getByTestId('guild-tab-applications')).toHaveCount(0);
		await expect(page.getByTestId('guild-tab-invitations')).toHaveCount(0);
	});

	test('un 403 sur ces listes ne fait pas tomber la page guilde', async ({ page }) => {
		await mockApi(
			page,
			guildRoutes({ members: [member('u-challenger', 'member', 'Kofi Adjovi')], forbidden: true })
		);
		await gotoHydrated(page, '/guilds/les-forgerons');

		await expect(page.getByRole('heading', { name: /Les Forgerons/ })).toBeVisible();
		await expect(page.getByTestId('guild-not-found')).toHaveCount(0);
	});

	test('une candidature affiche le postulant et son message', async ({ page }) => {
		await mockApi(
			page,
			guildRoutes({
				members: [member('u-challenger', 'owner', 'Kofi Adjovi')],
				applications: [APPLICATION]
			})
		);
		await gotoHydrated(page, '/guilds/les-forgerons');

		await page.getByTestId('guild-tab-applications').click();
		await expect(page.getByText('Ama Doe')).toBeVisible();
		await expect(page.getByText('Je forge depuis deux ans.')).toBeVisible();
	});

	test('accepter poste { accept: true }', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/guild-applications/app-1/decide',
				handler: (route) => {
					sent = route.request().postDataJSON();
					return json({ data: { id: 'app-1', status: 'accepted' } })(route);
				}
			},
			...guildRoutes({
				members: [member('u-challenger', 'owner', 'Kofi Adjovi')],
				applications: [APPLICATION]
			})
		]);
		await gotoHydrated(page, '/guilds/les-forgerons');

		await page.getByTestId('guild-tab-applications').click();
		await page.getByRole('button', { name: 'Accepter' }).click();

		await expect.poll(() => sent).not.toBeNull();
		// The backend rejects anything else with `missing field accept`.
		expect(sent).toEqual({ accept: true });
	});

	test('refuser poste { accept: false }', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/guild-applications/app-1/decide',
				handler: (route) => {
					sent = route.request().postDataJSON();
					return json({ data: { id: 'app-1', status: 'rejected' } })(route);
				}
			},
			...guildRoutes({
				members: [member('u-challenger', 'owner', 'Kofi Adjovi')],
				applications: [APPLICATION]
			})
		]);
		await gotoHydrated(page, '/guilds/les-forgerons');

		await page.getByTestId('guild-tab-applications').click();
		await page.getByRole('button', { name: 'Refuser' }).click();

		await expect.poll(() => sent).not.toBeNull();
		expect(sent).toEqual({ accept: false });
	});

	test('une invitation par lien est distinguee d une invitation nominative', async ({ page }) => {
		await mockApi(
			page,
			guildRoutes({
				members: [member('u-challenger', 'owner', 'Kofi Adjovi')],
				invitations: [DIRECT_INVITATION, LINK_INVITATION]
			})
		);
		await gotoHydrated(page, '/guilds/les-forgerons');

		await page.getByTestId('guild-tab-invitations').click();
		await expect(page.getByText('Yao Mensah')).toBeVisible();
		await expect(page.getByText('Invitation par lien')).toBeVisible();
		await expect(page.getByTestId('invitation-row')).toHaveCount(2);
	});

	test('revoquer une invitation demande confirmation', async ({ page }) => {
		let revoked = 0;
		await mockApi(page, [
			{
				path: '/guilds/g-1/invitations/inv-1',
				handler: (route) => {
					revoked++;
					return json({ data: { revoked: true, invitation_id: 'inv-1' } })(route);
				}
			},
			...guildRoutes({
				members: [member('u-challenger', 'owner', 'Kofi Adjovi')],
				invitations: [DIRECT_INVITATION]
			})
		]);
		await gotoHydrated(page, '/guilds/les-forgerons');

		await page.getByTestId('guild-tab-invitations').click();

		page.once('dialog', (d) => d.dismiss());
		await page.getByRole('button', { name: 'Revoquer' }).click();
		await page.waitForTimeout(400);
		expect(revoked).toBe(0);

		page.once('dialog', (d) => d.accept());
		await page.getByRole('button', { name: 'Revoquer' }).click();
		await expect.poll(() => revoked).toBe(1);
	});

	test('sans candidature ni invitation, chaque onglet le dit', async ({ page }) => {
		await mockApi(
			page,
			guildRoutes({ members: [member('u-challenger', 'owner', 'Kofi Adjovi')] })
		);
		await gotoHydrated(page, '/guilds/les-forgerons');

		await page.getByTestId('guild-tab-applications').click();
		await expect(page.getByText('Aucune candidature en attente.')).toBeVisible();

		await page.getByTestId('guild-tab-invitations').click();
		await expect(page.getByText('Aucune invitation en attente.')).toBeVisible();
	});
});
