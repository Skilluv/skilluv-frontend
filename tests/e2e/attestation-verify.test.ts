/**
 * SKI-103 — /verify/[hash]: public attestation verification.
 *
 * The valid state was untestable until SKI-288 exposed the payload under
 * `/api`: before that the page fetched its own origin, got HTML back, and fell
 * into "invalid" for every hash. The existing parcours spec passed anyway
 * because the invalid screen also has a heading. This pins the valid state.
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

const HASH = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

/** Bare payload, not the `{data, meta}` envelope: this route mirrors the root one. */
const VALID = {
	valid: true,
	challenger: { username: 'kofi', display_name: 'Kofi Adjovi', avatar_url: null },
	validator: { username: 'ama', display_name: 'Ama Doe', avatar_url: null },
	pr_url: 'https://github.com/skilluv/skilluv-backend/pull/42',
	repo: 'skilluv/skilluv-backend',
	domain: 'code',
	difficulty: 3,
	validated_at: '2026-08-01T09:00:00Z',
	merged_upstream: true
};

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
});

test.describe('SKI-103 public attestation verification', () => {
	// Anonymous on purpose: a recruiter checking a hash has no account.
	test('une attestation valide nomme le contributeur et le validateur', async ({ page }) => {
		await mockApi(page, [{ path: `/verify/${HASH}`, handler: json(VALID) }, ...common]);
		await gotoHydrated(page, `/verify/${HASH}`);

		await expect(
			page.getByRole('heading', { name: 'Attestation Skilluv verifiee' })
		).toBeVisible();
		await expect(page.getByText('Kofi Adjovi')).toBeVisible();
		await expect(page.getByText('Ama Doe')).toBeVisible();
		await expect(page.getByText('skilluv/skilluv-backend')).toBeVisible();
	});

	test('la PR, le PDF et le partage sont accessibles', async ({ page }) => {
		await mockApi(page, [{ path: `/verify/${HASH}`, handler: json(VALID) }, ...common]);
		await gotoHydrated(page, `/verify/${HASH}`);

		await expect(page.getByRole('link', { name: 'Voir la PR' })).toHaveAttribute(
			'href',
			'https://github.com/skilluv/skilluv-backend/pull/42'
		);
		// The PDF lives at the backend root, so the link must be absolute: a
		// relative one resolves against this app, where /verify is a page.
		await expect(page.getByRole('link', { name: 'Telecharger le PDF' })).toHaveAttribute(
			'href',
			new RegExp(`^https?://.+/verify/${HASH}\\.pdf$`)
		);
		await expect(page.getByRole('button', { name: 'Partager' })).toBeVisible();
	});

	test('la carte de partage est le PNG genere pour cette attestation', async ({ page }) => {
		await mockApi(page, [{ path: `/verify/${HASH}`, handler: json(VALID) }, ...common]);
		await gotoHydrated(page, `/verify/${HASH}`);

		// A generic SVG card is what the social platforms refuse to render, and it
		// would not name the contributor. This one is rendered per attestation.
		const og = page.locator('meta[property="og:image"]');
		await expect(og).toHaveAttribute('content', new RegExp(`/api/verify/${HASH}/og\.png$`));
		await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
			'content',
			'1200'
		);
	});

	test('un hash inconnu est distingue d un hash malforme', async ({ page }) => {
		await mockApi(page, [
			{
				path: `/verify/${HASH}`,
				handler: json({ valid: false, reason: 'unknown attestation hash' })
			},
			...common
		]);
		await gotoHydrated(page, `/verify/${HASH}`);

		await expect(page.getByRole('heading', { name: 'Attestation introuvable' })).toBeVisible();
		await expect(page.getByText(/Aucune attestation ne correspond/)).toBeVisible();
		await expect(page.getByRole('link', { name: 'Retour a skill-uv.com' })).toBeVisible();
	});

	test('un hash malforme a son propre message', async ({ page }) => {
		await mockApi(page, [
			{
				path: `/verify/${HASH}`,
				handler: json({ valid: false, reason: 'malformed attestation hash' })
			},
			...common
		]);
		await gotoHydrated(page, `/verify/${HASH}`);

		await expect(page.getByText(/ne correspond pas au format/)).toBeVisible();
	});

	test('un merge upstream est signale', async ({ page }) => {
		await mockApi(page, [{ path: `/verify/${HASH}`, handler: json(VALID) }, ...common]);
		await gotoHydrated(page, `/verify/${HASH}`);

		await expect(page.getByText('Merge upstream')).toBeVisible();
	});
});
