/**
 * S5.2 (SKI-50) — /forum/[id]: reply thread.
 *
 * Only the listing and the creation form were covered; the thread itself, the
 * reply form and the accepted-answer flow had none.
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

/** Id of the fixture served by the mock backend for the `challenger` token. */
const AUTHOR_ID = 'u-challenger';

function post(overrides: Record<string, unknown> = {}) {
	return {
		id: 'p-1',
		category_id: 'cat-1',
		category_name: 'Entraide',
		author_id: 'u-ama',
		author_username: 'ama',
		author_display_name: 'Ama Doe',
		author_avatar_url: null,
		title: 'Comment structurer un module Rust ?',
		body: 'Je bloque sur la separation en modules.',
		kind: 'question',
		locked: false,
		pinned: false,
		hidden: false,
		accepted_answer_id: null,
		reaction_up: 2,
		comment_count: 1,
		created_at: '2026-08-10T09:00:00Z',
		updated_at: '2026-08-10T09:00:00Z',
		...overrides
	};
}

function comment(overrides: Record<string, unknown> = {}) {
	return {
		id: 'c-1',
		target_type: 'post',
		target_id: 'p-1',
		author_username: 'ama',
		author_display_name: 'Ama Doe',
		author_avatar_url: null,
		body: 'Commence par un module par domaine metier.',
		accepted: false,
		reaction_up: 1,
		hidden: false,
		created_at: '2026-08-10T10:00:00Z',
		...overrides
	};
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

test.describe('S5.2 forum thread', () => {
	test('affiche la question et ses reponses', async ({ page }) => {
		await mockApi(page, [
			{ path: '/forum/posts/p-1', handler: json({ data: { post: post(), comments: [] } }) },
			{ path: '/social/comments/post/p-1', handler: json({ data: { comments: [comment()] } }) },
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) }
		]);
		await gotoHydrated(page, '/forum/p-1');

		await expect(
			page.getByRole('heading', { name: 'Comment structurer un module Rust ?' })
		).toBeVisible();
		await expect(page.getByText('Je bloque sur la separation en modules.')).toBeVisible();
		await expect(page.getByText('Commence par un module par domaine metier.')).toBeVisible();
	});

	test('un utilisateur connecte peut publier une reponse', async ({ page }) => {
		let posted: Record<string, unknown> | null = null;
		await mockApi(page, [
			{ path: '/forum/posts/p-1', handler: json({ data: { post: post(), comments: [] } }) },
			// The listing and the creation are two different routes now: the
			// target travels in the path on the way in, and in the body on the
			// way out.
			{ path: '/social/comments/post/p-1', handler: json({ data: { comments: [comment()] } }) },
			{
				path: '/social/comments',
				handler: (route) => {
					posted = route.request().postDataJSON();
					return json({ data: { comment: comment({ id: 'c-2', body: 'Ma reponse' }) } })(route);
				}
			},
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) }
		]);
		await gotoHydrated(page, '/forum/p-1');

		const field = page.getByLabel('Votre réponse');
		await expect(field).toBeVisible();
		await field.fill('Ma reponse');
		await page.getByRole('button', { name: 'Publier' }).click();

		await expect.poll(() => posted).not.toBeNull();
		expect(posted).toMatchObject({ target_type: 'post', target_id: 'p-1', body: 'Ma reponse' });
	});

	test('le bouton publier reste inactif tant que le champ est vide', async ({ page }) => {
		await mockApi(page, [
			{ path: '/forum/posts/p-1', handler: json({ data: { post: post(), comments: [] } }) },
			{ path: '/social/comments/post/p-1', handler: json({ data: { comments: [] } }) },
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) }
		]);
		await gotoHydrated(page, '/forum/p-1');
		await expect(page.getByRole('button', { name: 'Publier' })).toBeDisabled();
	});

	test('un fil verrouille n offre pas de formulaire', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/forum/posts/p-1',
				handler: json({ data: { post: post({ locked: true }), comments: [] } })
			},
			{ path: '/social/comments/post/p-1', handler: json({ data: { comments: [comment()] } }) },
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) }
		]);
		await gotoHydrated(page, '/forum/p-1');

		await expect(page.getByText('Commence par un module par domaine metier.')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Publier' })).toHaveCount(0);
	});

	test('l auteur d une question peut accepter une reponse', async ({ page }) => {
		let acceptedWith: Record<string, unknown> | null = null;
		await mockApi(page, [
			{
				path: '/forum/posts/p-1/accept-answer',
				handler: (route) => {
					acceptedWith = route.request().postDataJSON();
					return json({ data: { accepted: true } })(route);
				}
			},
			{
				path: '/forum/posts/p-1',
				handler: json({ data: { post: post({ author_id: AUTHOR_ID }), comments: [] } })
			},
			{ path: '/social/comments/post/p-1', handler: json({ data: { comments: [comment()] } }) },
			{ path: '/users/me/capabilities', handler: json({ data: [] }) },
			{ path: '/users/me/orientations', handler: json({ data: [] }) }
		]);
		await gotoHydrated(page, '/forum/p-1');

		await page.getByRole('button', { name: /Accepter/ }).click();
		await expect.poll(() => acceptedWith).not.toBeNull();
		expect(acceptedWith).toMatchObject({ comment_id: 'c-1' });
	});
});
