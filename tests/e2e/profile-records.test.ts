/**
 * The five craft records on a public profile.
 *
 * They were served for a long time and read nowhere, so the profile showed
 * three disciplines out of eight. Each renders only where there is work, and
 * each keeps the invariant its backend enforces.
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoHydrated } from './utils/hydration';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem('skilluv-locale', 'fr');
		} catch {
			// storage unavailable
		}
	});
});

type ApiRoute = { path: string; handler: (route: Route) => Promise<void> | void };

async function mockApi(page: Page, routes: ApiRoute[]) {
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		const match = routes.find((r) => url.pathname.endsWith(r.path));
		if (match) return match.handler(route);
		// Everything unmocked answers 404, which is how a record knows the
		// person has no work in that domain.
		await route.fulfill({
			status: 404,
			contentType: 'application/json',
			body: JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x' }, meta: {} })
		});
	});
}

function json(body: unknown, status = 200) {
	return (route: Route) =>
		route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const score = {
	score: 1200,
	tier_slug: 'engineer',
	tier_name: 'Engineer',
	tier_description: 'Ships work other people rely on.',
	next_tier_at: 2000,
	breakdown: [],
	capped: false
};

const publicProfile = {
	data: {
		user: {
			id: 'u1',
			username: 'ada',
			display_name: 'Ada',
			title: 'artisan',
			golden_stars: 0,
			skill_domain: 'security',
			country: null,
			city: null,
			bio: null,
			avatar_url: null,
			github: null,
			linkedin: null,
			website: null,
			twitter: null,
			member_since: '2026-01-01T00:00:00Z'
		},
		stats: { total_fragments: 0, streak_current: 0, challenges_completed: 0 }
	}
};

test.describe('Les parcours métier sur un profil', () => {
	test('une finding sous embargo montre son absence de titre, pas un vide', async ({ page }) => {
		await mockApi(page, [
			{ path: '/profile/ada', handler: json(publicProfile) },
			{
				path: '/users/ada/security-profile',
				handler: json({
					data: {
						username: 'ada',
						display_name: 'Ada',
						orientations: [{ slug: 'pentester', name: 'Pentester' }],
						score,
						findings: [
							{
								id: 'f1',
								title: null,
								severity_tier: 'high',
								cvss_score: 8.1,
								cwe_id: 'CWE-89',
								status: 'confirmed',
								disclosure_stage: 'embargoed',
								target_kind: 'web',
								writeup_url: null,
								confirmed_month: '2026-06'
							}
						],
						practice: [{ kind: 'lab', tier: 'hard', solved: 12 }],
						attestations: [],
						credentials: [
							{
								issuer: 'Offsec',
								name: 'OSCP',
								level: null,
								issued_on: null,
								expires_on: null,
								evidence_url: null,
								verified: false
							}
						],
						external_platforms: []
					}
				})
			}
		]);

		await gotoHydrated(page, '/profile/ada');

		await expect(page.getByTestId('profile-record-security')).toBeVisible();
		// Le backend retient le titre ; la page le dit au lieu de laisser un blanc.
		await expect(page.getByText('Titre retenu jusqu’à la divulgation')).toBeVisible();
		await expect(page.getByText('CVSS 8.1')).toBeVisible();
		await expect(page.getByText('2026-06')).toBeVisible();
		// L'entraînement est un compte, pas quarante lignes.
		await expect(page.getByText('lab · hard')).toBeVisible();
		// Déclarée n'est pas vérifiée.
		await expect(page.getByText('déclarée', { exact: true })).toBeVisible();
	});

	test('un défaut confirmé mène au correctif, jamais à la reproduction', async ({ page }) => {
		await mockApi(page, [
			{ path: '/profile/ada', handler: json(publicProfile) },
			{
				path: '/users/ada/quality-profile',
				handler: json({
					data: {
						username: 'ada',
						display_name: 'Ada',
						orientations: [],
						score,
						confirmed_bugs: [
							{
								title: 'Le parser casse sur les offsets négatifs',
								severity: 'high',
								severity_reviewed: false,
								reproducibility: 'always',
								fix_url: 'https://github.test/pull/1',
								fix_confirmed_at: '2026-08-01T00:00:00Z'
							}
						],
						target_domain_breakdown: [],
						attestations: [],
						verified_test_runs: []
					}
				})
			}
		]);

		await gotoHydrated(page, '/profile/ada');

		await expect(page.getByTestId('profile-record-quality')).toBeVisible();
		await expect(page.getByRole('link', { name: /Voir le correctif/ })).toHaveAttribute(
			'href',
			'https://github.test/pull/1'
		);
		// Une sévérité que personne n'a revue est la lecture du rapporteur.
		await expect(page.getByText('sévérité non revue')).toBeVisible();
	});

	test('une économie qui casse le service le dit', async ({ page }) => {
		await mockApi(page, [
			{ path: '/profile/ada', handler: json(publicProfile) },
			{
				path: '/users/ada/ops-profile',
				handler: json({
					data: {
						username: 'ada',
						display_name: 'Ada',
						orientations: [],
						score,
						objectives: [],
						incidents: [],
						cost_work: [
							{
								scope: 'stockage',
								monthly_before: '4200.00',
								monthly_after: '1800.00',
								currency: 'EUR',
								service_still_meets_slo: false
							}
						],
						attestations: [],
						credentials: []
					}
				})
			}
		]);

		await gotoHydrated(page, '/profile/ada');
		await expect(page.getByTestId('profile-record-ops')).toBeVisible();
		// Diviser une facture par deux en cassant la chose n'est pas une économie.
		await expect(page.getByText('objectif plus tenu')).toBeVisible();
	});

	test('un domaine sans travail ne fait apparaître aucune section', async ({ page }) => {
		// Rien de mocké sauf le profil : les cinq répondent 404.
		await mockApi(page, [{ path: '/profile/ada', handler: json(publicProfile) }]);

		await gotoHydrated(page, '/profile/ada');
		await expect(page.getByRole('heading', { name: 'Ada' }).first()).toBeVisible();
		for (const domain of ['code', 'quality', 'ops', 'leadership', 'security']) {
			await expect(page.getByTestId(`profile-record-${domain}`)).toHaveCount(0);
		}
	});
});
