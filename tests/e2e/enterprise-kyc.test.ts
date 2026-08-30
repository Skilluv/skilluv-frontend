/**
 * S6.4 (SKI-53) — /enterprise/kyc: compliance document deposit.
 *
 * The oversize guard and the replace confirmation are the two places where a
 * mistake costs the user something real: a rejected upload with no explanation,
 * or an already-approved document silently overwritten.
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

function kycStatus(overrides: Record<string, unknown> = {}) {
	return {
		data: {
			level: 'basic',
			status: 'pending',
			monthly_spend_eur_cents: 45_000,
			reviewed_at: null,
			rejection_reason: null,
			documents: [],
			thresholds: {
				basic_up_to_eur_cents: 200_000,
				full_required_above_eur_cents: 200_000
			},
			...overrides
		}
	};
}

const SENT_DOC = {
	id: 'doc-1',
	kind: 'kbis',
	content_type: 'application/pdf',
	size_bytes: 52_000,
	uploaded_at: '2026-08-01T09:00:00Z'
};

const common: ApiRoute[] = [
	{ path: '/users/me/capabilities', handler: json({ data: [] }) },
	{ path: '/users/me/orientations', handler: json({ data: [] }) }
];

const PDF = { name: 'kbis.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') };

test.beforeEach(async ({ page, context }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			/* storage unavailable */
		}
	});
	await context.addCookies([
		{ name: 'access_token', value: 'owner', domain: 'localhost', path: '/' }
	]);
});

test.describe('S6.4 enterprise KYC', () => {
	test('affiche le niveau, le statut et la depense mensuelle', async ({ page }) => {
		await mockApi(page, [{ path: '/enterprise/kyc', handler: json(kycStatus()) }, ...common]);
		await gotoHydrated(page, '/enterprise/kyc');

		await expect(page.getByRole('heading', { name: 'Vérification KYC.' })).toBeVisible();
		await expect(page.getByText('En cours de review').first()).toBeVisible();
		await expect(page.getByText(/450/).first()).toBeVisible();
	});

	test('un rejet affiche son motif', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/enterprise/kyc',
				handler: json(
					kycStatus({ status: 'rejected', rejection_reason: 'Kbis illisible, merci de rescanner.' })
				)
			},
			...common
		]);
		await gotoHydrated(page, '/enterprise/kyc');

		await expect(page.getByText('Kbis illisible, merci de rescanner.')).toBeVisible();
	});

	test('deposer un document poste le fichier et son type', async ({ page }) => {
		const uploadedKinds: string[] = [];
		await mockApi(page, [
			{
				path: '/enterprise/kyc/documents',
				handler: (route) => {
					const body = route.request().postData() ?? '';
					if (body.includes('name="kind"')) {
						uploadedKinds.push(body.split('name="kind"')[1].slice(0, 60));
					}
					return json({ data: { document_id: 'doc-9' } })(route);
				}
			},
			{ path: '/enterprise/kyc', handler: json(kycStatus()) },
			...common
		]);
		await gotoHydrated(page, '/enterprise/kyc');

		await page.locator('input[type="file"]').first().setInputFiles(PDF);

		await expect(page.getByText('Document uploadé')).toBeVisible();
		expect(uploadedKinds.join(' ')).toContain('kbis');
	});

	test('remplacer un document deja envoye demande confirmation', async ({ page }) => {
		let uploads = 0;
		await mockApi(page, [
			{
				path: '/enterprise/kyc/documents',
				handler: (route) => {
					uploads++;
					return json({ data: { document_id: 'doc-9' } })(route);
				}
			},
			{ path: '/enterprise/kyc', handler: json(kycStatus({ documents: [SENT_DOC] })) },
			...common
		]);
		await gotoHydrated(page, '/enterprise/kyc');

		await expect(page.getByText('Remplacer').first()).toBeVisible();
		await page.locator('input[type="file"]').first().setInputFiles(PDF);

		// Nothing is sent until the user confirms the overwrite.
		await expect(page.getByRole('heading', { name: 'Remplacer le document ?' })).toBeVisible();
		expect(uploads).toBe(0);

		await page.getByRole('button', { name: 'Remplacer', exact: true }).last().click();
		await expect.poll(() => uploads).toBe(1);
	});

	test('un fichier de plus de 10 Mo est refuse avant tout envoi', async ({ page }) => {
		let uploads = 0;
		await mockApi(page, [
			{
				path: '/enterprise/kyc/documents',
				handler: (route) => {
					uploads++;
					return json({ data: { document_id: 'doc-9' } })(route);
				}
			},
			{ path: '/enterprise/kyc', handler: json(kycStatus()) },
			...common
		]);
		await gotoHydrated(page, '/enterprise/kyc');

		await page.locator('input[type="file"]').first().setInputFiles({
			name: 'huge.pdf',
			mimeType: 'application/pdf',
			buffer: Buffer.alloc(11 * 1024 * 1024)
		});

		await expect(page.getByText('Fichier > 10 Mo')).toBeVisible();
		expect(uploads).toBe(0);
	});
});
