/**
 * The audio panels on a slice: the files with their measurements, and the
 * source declaration.
 *
 * Both mount only on an `audio_artifact` slice. The two endpoints would answer
 * for any id, and a code slice has no business showing a loudness meter — so
 * the branch is on `slice_type`, which `ProjectSlice` has serialised all
 * along.
 */
import { test, expect, type Page, type Route } from '@playwright/test';

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

/**
 * `/slices/[id]` has a universal `load`, so a direct `goto` runs it on the
 * server where `page.route` cannot reach. Navigating from an already-loaded
 * page goes through the client router instead. Same trick as p26-workflow.
 */
async function gotoClientSide(page: Page, path: string) {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('dir', 'ltr', { timeout: 20_000 });
	await page.evaluate((target) => {
		const a = document.createElement('a');
		a.href = target;
		a.textContent = 'go';
		a.id = 'e2e-nav';
		document.body.appendChild(a);
	}, path);
	await page.click('#e2e-nav');
	await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')));
}

function makeSlice(overrides: Record<string, unknown> = {}) {
	return {
		id: 's-1',
		title: 'Thème principal du gardien',
		description: 'Une boucle de trois minutes.',
		acceptance_criteria: ['Boucle sans couture'],
		labels: ['audio'],
		difficulty: 3,
		status: 'claimed',
		slice_type: 'audio_artifact',
		primary_domain: 'audio',
		min_rank: null,
		required_orientation_slugs: null,
		external_metadata: null,
		fork_repo_url: null,
		submitted_pr_url: null,
		attestation_hash: null,
		announced_at: null,
		validation_reject_reason: null,
		claimed_by_user_id: null,
		claim_expires_at: null,
		validator_user_id: null,
		validator_username: null,
		project_id: 'p-1',
		project_slug: 'skilluv-canvas',
		created_at: '2026-08-01',
		updated_at: '2026-08-01',
		...overrides
	};
}

const files = {
	data: [
		{
			id: 'f1',
			role: 'master',
			original_filename: 'gardien-theme.wav',
			byte_size: 48_000_000,
			container: 'wav',
			duration_ms: 185_000,
			sample_rate_hz: 48_000,
			bit_depth: 24,
			channels: 2,
			loudness_lufs: -14.2,
			true_peak_dbfs: -1.1,
			loudness_range_lu: 7.4,
			analysis_status: 'done',
			analysis_error: null,
			waveform_peaks: null
		},
		{
			id: 'f2',
			role: 'stem',
			original_filename: 'cordes.wav',
			byte_size: 12_000_000,
			container: 'wav',
			duration_ms: null,
			sample_rate_hz: null,
			bit_depth: null,
			channels: null,
			loudness_lufs: null,
			true_peak_dbfs: null,
			loudness_range_lu: null,
			analysis_status: 'pending',
			analysis_error: null,
			waveform_peaks: null
		}
	]
};

test.describe('Livraison audio sur une slice', () => {
	test('les mesures s’affichent, et « pas mesuré » n’est pas zéro', async ({ page }) => {
		await mockApi(page, [
			{ path: '/slices/s-1', handler: json({ data: { slice: makeSlice() } }) },
			{ path: '/audio/slices/s-1/files', handler: json(files) },
			{
				path: '/audio/slices/s-1/sources',
				handler: json({ data: { sources: [], declared_complete_at: null } })
			}
		]);

		await gotoClientSide(page, '/slices/s-1');

		await expect(page.getByTestId('audio-delivery')).toBeVisible();
		await expect(page.getByText('-14.2 LUFS')).toBeVisible();
		await expect(page.getByText('-1.1 dBTP')).toBeVisible();
		// The unmeasured stem says so rather than drawing a meter at zero.
		await expect(page.getByText('Pas encore mesuré')).toBeVisible();
		await expect(page.getByText('0.0 LUFS')).toHaveCount(0);
	});

	test('écouter demande une URL signée au moment du clic', async ({ page }) => {
		let listenCalls = 0;
		await mockApi(page, [
			{ path: '/slices/s-1', handler: json({ data: { slice: makeSlice() } }) },
			{ path: '/audio/slices/s-1/files', handler: json(files) },
			{
				path: '/audio/slices/s-1/sources',
				handler: json({ data: { sources: [], declared_complete_at: null } })
			},
			{
				path: '/audio/files/f1/listen',
				handler: (route) => {
					listenCalls++;
					return json({
						data: { url: 'https://storage.test/f1?sig=x', expires_in_seconds: 300 }
					})(route);
				}
			}
		]);

		await gotoClientSide(page, '/slices/s-1');
		// Not fetched up front for a list: one signed URL per press.
		expect(listenCalls).toBe(0);

		await page.getByRole('button', { name: 'Écouter' }).first().click();
		await expect.poll(() => listenCalls).toBe(1);
		await expect(page.getByText(/Ce lien expire vite/)).toBeVisible();
	});

	test('une liste de sources vide sans déclaration est un avertissement', async ({ page }) => {
		await mockApi(page, [
			{ path: '/slices/s-1', handler: json({ data: { slice: makeSlice() } }) },
			{ path: '/audio/slices/s-1/files', handler: json({ data: [] }) },
			{
				path: '/audio/slices/s-1/sources',
				handler: json({ data: { sources: [], declared_complete_at: null } })
			}
		]);

		await gotoClientSide(page, '/slices/s-1');
		// Une liste vide n'est pas un morceau original : l'attestation lit la
		// déclaration, pas le compte.
		await expect(page.getByText(/Personne n'a déclaré cette liste complète/)).toBeVisible();
	});

	test('une source Creative Commons montre sa ligne de crédit', async ({ page }) => {
		await mockApi(page, [
			{ path: '/slices/s-1', handler: json({ data: { slice: makeSlice() } }) },
			{ path: '/audio/slices/s-1/files', handler: json({ data: [] }) },
			{
				path: '/audio/slices/s-1/sources',
				handler: json({
					data: {
						sources: [
							{
								id: 'src1',
								kind: 'creative_commons',
								source_name: 'Freesound 12345',
								source_url: 'https://freesound.org/s/12345',
								licence_identifier: 'CC-BY-4.0',
								attribution_text: 'Sound by someone (CC BY 4.0)',
								purchased_from: null,
								permits_commercial_use: false
							}
						],
						declared_complete_at: '2026-08-01T00:00:00Z'
					}
				})
			}
		]);

		await gotoClientSide(page, '/slices/s-1');

		await expect(page.getByText('Sound by someone (CC BY 4.0)')).toBeVisible();
		await expect(page.getByText('CC-BY-4.0')).toBeVisible();
		// La distinction qui décide si une mission payée peut livrer ça.
		await expect(page.getByText('Usage commercial non autorisé')).toBeVisible();
		await expect(page.getByText(/Déclarée complète le/)).toBeVisible();
	});

	test('une slice qui n’est pas audio ne montre aucun des deux panneaux', async ({ page }) => {
		await mockApi(page, [
			{
				path: '/slices/s-1',
				handler: json({ data: { slice: makeSlice({ slice_type: 'github_issue', primary_domain: 'code' }) } })
			}
		]);

		await gotoClientSide(page, '/slices/s-1');
		await expect(page.getByRole('heading', { name: 'Thème principal du gardien' })).toBeVisible();
		await expect(page.getByTestId('audio-delivery')).toHaveCount(0);
		await expect(page.getByTestId('audio-sources')).toHaveCount(0);
	});

	test('les crédits du projet portent leur code de vérification', async ({ page }) => {
		await mockApi(page, [
			{ path: '/slices/s-1', handler: json({ data: { slice: makeSlice() } }) },
			{ path: '/audio/slices/s-1/files', handler: json({ data: [] }) },
			{
				path: '/audio/slices/s-1/sources',
				handler: json({ data: { sources: [], declared_complete_at: null } })
			},
			{
				path: '/projects/skilluv-canvas/credits',
				handler: json({
					data: [
						{
							username: 'ada',
							display_name: 'Ada Lovelace',
							credit_title: 'Musique originale',
							audio_subtype: 'score',
							verification_code: 'ABC123DEF456',
							issued_at: '2026-08-01T00:00:00Z'
						}
					]
				})
			}
		]);

		await gotoClientSide(page, '/slices/s-1');

		await expect(page.getByTestId('project-credits')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
			'href',
			'/profile/ada'
		);
		// Un crédit que personne ne peut vérifier est une ligne sur une page.
		await expect(page.getByRole('link', { name: 'Vérifier' })).toHaveAttribute(
			'href',
			'/attestations/verify/ABC123DEF456'
		);
	});
});
