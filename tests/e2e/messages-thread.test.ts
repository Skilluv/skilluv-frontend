/**
 * S5.3 (SKI-50) — /messages and /messages/[id]: sending a direct message.
 *
 * The parcours specs only asserted that a heading rendered. Nothing proved a
 * message could actually be sent, nor that the canonical `{ body }` payload was
 * the one leaving the browser.
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

/** Id of the fixture the mock backend serves for the `challenger` token. */
const ME = 'u-challenger';

const conversation = {
	id: 'conv-1',
	other_user_id: 'u-ama',
	other_username: 'ama',
	other_display_name: 'Ama Doe',
	last_message_preview: 'On se cale demain ?',
	last_message_at: '2026-08-11T10:00:00Z',
	unread_count: 1,
	created_at: '2026-08-01T10:00:00Z'
};

const messages = [
	{
		id: 'm-1',
		conversation_id: 'conv-1',
		sender_id: 'u-ama',
		body: 'On se cale demain ?',
		created_at: '2026-08-11T10:00:00Z',
		read_at: null
	},
	{
		id: 'm-2',
		conversation_id: 'conv-1',
		sender_id: ME,
		body: 'Ça marche.',
		created_at: '2026-08-11T10:05:00Z',
		read_at: '2026-08-11T10:06:00Z'
	}
];

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

test.describe('S5.3 direct messages', () => {
	test('la liste affiche les conversations', async ({ page }) => {
		await mockApi(page, [
			{ path: '/dm/conversations', handler: json({ data: { conversations: [conversation] } }) },
			...common
		]);
		await gotoHydrated(page, '/messages');

		await expect(page.getByText('Ama Doe')).toBeVisible();
		await expect(page.getByText('On se cale demain ?')).toBeVisible();
	});

	test('le fil affiche les messages des deux cotes', async ({ page }) => {
		await mockApi(page, [
			{ path: '/dm/conversations/conv-1/messages', handler: json({ data: { messages } }) },
			{ path: '/dm/conversations/conv-1/read', handler: json({ data: { read: true } }) },
			{ path: '/dm/conversations', handler: json({ data: { conversations: [conversation] } }) },
			...common
		]);
		await gotoHydrated(page, '/messages/conv-1');

		await expect(page.getByText('On se cale demain ?')).toBeVisible();
		await expect(page.getByText('Ça marche.')).toBeVisible();
	});

	test('envoyer un message poste le payload canonique { body }', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/dm/conversations/conv-1/messages',
				handler: (route) => {
					if (route.request().method() === 'POST') {
						sent = route.request().postDataJSON();
						return json({
							data: {
								message: {
									id: 'm-3',
									conversation_id: 'conv-1',
									sender_id: ME,
									body: 'Parfait, a demain',
									created_at: '2026-08-11T11:00:00Z',
									read_at: null
								}
							}
						})(route);
					}
					return json({ data: { messages } })(route);
				}
			},
			{ path: '/dm/conversations/conv-1/read', handler: json({ data: { read: true } }) },
			{ path: '/dm/conversations', handler: json({ data: { conversations: [conversation] } }) },
			...common
		]);
		await gotoHydrated(page, '/messages/conv-1');

		await page.getByPlaceholder('Écris un message...').fill('Parfait, a demain');
		await page.getByRole('button', { name: 'Envoyer' }).click();

		await expect.poll(() => sent).not.toBeNull();
		expect(sent).toEqual({ body: 'Parfait, a demain' });
		await expect(page.getByText('Parfait, a demain')).toBeVisible();
	});

	test('le bouton envoyer reste inactif sur un message vide', async ({ page }) => {
		await mockApi(page, [
			{ path: '/dm/conversations/conv-1/messages', handler: json({ data: { messages } }) },
			{ path: '/dm/conversations/conv-1/read', handler: json({ data: { read: true } }) },
			{ path: '/dm/conversations', handler: json({ data: { conversations: [conversation] } }) },
			...common
		]);
		await gotoHydrated(page, '/messages/conv-1');

		await expect(page.getByRole('button', { name: 'Envoyer' })).toBeDisabled();
		// Whitespace alone must not enable it either.
		await page.getByPlaceholder('Écris un message...').fill('   ');
		await expect(page.getByRole('button', { name: 'Envoyer' })).toBeDisabled();
	});
});
