/**
 * S6.10 (SKI-53) — /enterprise/messages and /enterprise/messages/[id].
 *
 * The recruiter's conversation with a talent. The canonical send payload is
 * `{ content }` here, not `{ body }` as on the candidate side; nothing pinned
 * that down, and the two are easy to confuse.
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

const CONVERSATION = {
	id: 'conv-1',
	closed: false,
	other_party: { type: 'user', name: 'Kofi Adjovi', username: 'kofi' },
	last_message: {
		id: 'm-1',
		conversation_id: 'conv-1',
		sender_id: 'u-kofi',
		content: 'Bonjour, votre offre m’intéresse.',
		read_at: null,
		created_at: '2026-08-11T10:00:00Z'
	},
	unread_count: 2,
	created_at: '2026-08-01T09:00:00Z'
};

const MESSAGES = [
	CONVERSATION.last_message,
	{
		id: 'm-2',
		conversation_id: 'conv-1',
		sender_id: 'u-recruiter',
		content: 'Ravi de vous lire.',
		read_at: null,
		created_at: '2026-08-11T10:05:00Z'
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
		{ name: 'access_token', value: 'recruiter', domain: 'localhost', path: '/' }
	]);
});

test.describe('S6.10 enterprise messages', () => {
	test('la liste affiche les conversations et le compteur non lu', async ({ page }) => {
		await mockApi(page, [
			{ path: '/contact/conversations', handler: json({ data: { conversations: [CONVERSATION] } }) },
			...common
		]);
		await gotoHydrated(page, '/enterprise/messages');

		await expect(page.getByText('Kofi Adjovi').first()).toBeVisible();
		await expect(page.getByText('Bonjour, votre offre m’intéresse.')).toBeVisible();
		await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
	});

	test('sans conversation, un etat vide explicite', async ({ page }) => {
		await mockApi(page, [
			{ path: '/contact/conversations', handler: json({ data: { conversations: [] } }) },
			...common
		]);
		await gotoHydrated(page, '/enterprise/messages');

		await expect(page.getByText(/Aucune conversation|No conversation/i)).toBeVisible();
	});

	test('le fil affiche les deux cotes de l echange', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/contact/conversations/conv-1',
				handler: json({ data: { conversation: CONVERSATION, messages: MESSAGES } })
			},
			{ path: '/contact/conversations', handler: json({ data: { conversations: [CONVERSATION] } }) },
			...common
		]);
		await gotoHydrated(page, '/enterprise/messages/conv-1');

		await expect(page.getByText('Bonjour, votre offre m’intéresse.')).toBeVisible();
		await expect(page.getByText('Ravi de vous lire.')).toBeVisible();
	});

	test('envoyer poste le payload canonique { content }', async ({ page }) => {
		let sent: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/contact/conversations/conv-1/messages',
				handler: (route) => {
					sent = route.request().postDataJSON();
					return json({
						data: {
							message: {
								id: 'm-3',
								conversation_id: 'conv-1',
								sender_id: 'u-recruiter',
								content: 'On se cale un entretien ?',
								read_at: null,
								created_at: '2026-08-11T11:00:00Z'
							}
						}
					})(route);
				}
			},
			{
				path: '/contact/conversations/conv-1',
				handler: json({ data: { conversation: CONVERSATION, messages: MESSAGES } })
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/messages/conv-1');

		await page.getByRole('textbox').last().fill('On se cale un entretien ?');
		await page.getByRole('button', { name: /Envoyer|Send/i }).click();

		await expect.poll(() => sent).not.toBeNull();
		expect(sent).toEqual({ content: 'On se cale un entretien ?' });
	});

	test('le bouton envoyer reste inactif sur un message vide', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/contact/conversations/conv-1',
				handler: json({ data: { conversation: CONVERSATION, messages: MESSAGES } })
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/messages/conv-1');

		await expect(page.getByRole('button', { name: /Envoyer|Send/i })).toBeDisabled();
	});
});
