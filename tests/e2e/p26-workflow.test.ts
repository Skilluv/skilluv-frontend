/**
 * P26 v2 — authenticated coverage of the challenge workflow (SKI-93 to SKI-97).
 *
 * The `tests/e2e/parcours/*` specs only covered the anonymous visitor case
 * (redirect to login). Here the real workflow runs with a signed-in user and
 * mocked backend responses: claim -> submit-pr -> pick-up -> approve/reject ->
 * verifiable attestation.
 */
import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test';
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

/**
 * Picks the identity resolved during SSR. `hooks.server.ts` forwards the
 * `access_token` cookie to the mock backend, which returns the matching
 * fixture. This is the only lever available: SSR auth escapes `page.route`.
 */
async function signIn(context: BrowserContext, who: 'challenger' | 'validator') {
	await context.addCookies([
		{ name: 'access_token', value: who, domain: 'localhost', path: '/' }
	]);
}

type ApiRoute = { path: string; handler: (route: Route) => Promise<void> | void };

async function mockApi(page: Page, routes: ApiRoute[]) {
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		const match = routes.find((r) => url.pathname.endsWith(r.path));
		if (match) {
			await match.handler(route);
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ data: {} })
		});
	});
}

/**
 * Client-side navigation for routes with a universal `load` (`/slices/[id]`,
 * `/dashboard/slices`).
 *
 * On a direct `page.goto`, SvelteKit runs `load` on the server: the fetch
 * leaves the Node process, escapes `page.route` and the mocks never apply.
 * Starting from an already loaded page and clicking an internal link goes
 * through the client router, making the fetch interceptable again.
 */
async function gotoClientSide(page: Page, path: string) {
	// Until the app is hydrated the client router does not intercept clicks: the
	// link triggers a full document navigation, `load` replays on the server and
	// the mocks are bypassed. Detect that through the `load` event and retry.
	let documentLoads = 0;
	const countLoad = () => documentLoads++;
	page.on('load', countLoad);
	try {
		for (let attempt = 0; attempt < 10; attempt++) {
			await gotoHydrated(page, '/');
			await page.evaluate((href) => {
				const a = document.createElement('a');
				a.href = href;
				a.id = 'e2e-client-nav';
				a.textContent = 'nav';
				document.body.appendChild(a);
			}, path);

			documentLoads = 0;
			await page.click('#e2e-client-nav');
			await page.waitForURL((url) => url.pathname === path);
			// Zero document loads means the client router handled it, so
			// `page.route` was able to intercept the load.
			if (documentLoads === 0) return;
		}
		throw new Error(`gotoClientSide: ${path} never navigated client-side`);
	} finally {
		page.off('load', countLoad);
	}
}

function json(body: unknown, status = 200) {
	return (route: Route) =>
		route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

function apiError(status: number, code: string, message: string) {
	return json(
		{ error: { code, message }, meta: { request_id: 'r', timestamp: '2026-08-11' } },
		status
	);
}

const challenger = {
	id: 'u-challenger',
	email: 'kofi@example.com',
	username: 'kofi',
	first_name: 'Kofi',
	last_name: 'Adjovi',
	display_name: 'Kofi Adjovi',
	role: 'user',
	skill_domain: 'code',
	profile_completed: true,
	title: 'artisan',
	golden_stars: 0,
	total_fragments: 0,
	streak_current: 0,
	trust_score: 100,
	country: 'BJ',
	city: 'Cotonou',
	bio: null,
	avatar_url: null,
	github: 'kofi',
	linkedin: null,
	website: null,
	twitter: null,
	email_verified: true,
	totp_enabled: false,
	email_2fa_enabled: false,
	profile_active: true,
	created_at: '2026-01-01'
};

const validator = { ...challenger, id: 'u-validator', username: 'ama', display_name: 'Ama Doe' };

function meRoutes(user: typeof challenger, capabilities: string[] = []): ApiRoute[] {
	return [
		{
			path: '/auth/me',
			handler: json({ data: { user, login_method: 'password', has_passkey: false } })
		},
		{
			path: '/users/me/capabilities',
			handler: json({
				data: capabilities.map((capability) => ({
					capability,
					granted_at: '2026-01-01',
					granted_reason: 'seed'
				}))
			})
		},
		{ path: '/users/me/orientations', handler: json({ data: [] }) }
	];
}

function makeSlice(overrides: Record<string, unknown> = {}) {
	return {
		id: 's-1',
		title: 'Corriger le parsing des dates ISO',
		slice_type: 'github_issue',
		primary_domain: 'code',
		description: 'Le parser casse sur les offsets negatifs.',
		acceptance_criteria: ['Tests unitaires verts', 'Pas de regression sur les offsets positifs'],
		labels: ['code', 'bug'],
		difficulty: 3,
		status: 'open',
		min_rank: null,
		required_orientation_slugs: null,
		external_metadata: {
			issue_url: 'https://github.com/skilluv/skilluv-backend/issues/42',
			issue_number: 42,
			repo_owner: 'skilluv',
			repo_name: 'skilluv-backend'
		},
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
		project_slug: 'skilluv-backend',
		created_at: '2026-08-01',
		updated_at: '2026-08-01',
		...overrides
	};
}

function queueItem(slice: ReturnType<typeof makeSlice>) {
	return {
		slice,
		repo_url: 'https://github.com/skilluv/skilluv-backend',
		pr_url: 'https://github.com/skilluv/skilluv-backend/pull/77',
		claimer_username: 'kofi',
		claimer_display_name: 'Kofi Adjovi',
		claimer_avatar_url: null,
		picked_up_by_me: false,
		picked_up_at: null
	};
}

// --- SKI-93: slice detail page, claim + submit-pr ---

test.describe('SKI-93 slice detail - claim', () => {
	test('an authenticated user can claim an open slice', async ({ page, context }) => {
		await signIn(context, 'challenger');
		let claimCalls = 0;
		await mockApi(page, [
			...meRoutes(challenger),
			{ path: '/slices/s-1', handler: json({ data: { slice: makeSlice() } }) },
			{
				path: '/slices/s-1/claim',
				handler: (route) => {
					claimCalls++;
					return json({
						data: {
							claimed: true,
							fork_repo_url: 'https://github.com/kofi/skilluv-backend'
						}
					})(route);
				}
			}
		]);

		await gotoClientSide(page, '/slices/s-1');
		await expect(page.getByRole('heading', { name: 'Corriger le parsing des dates ISO' })).toBeVisible();
		await expect(page.getByText("Criteres d'acceptation")).toBeVisible();

		const claimBtn = page.getByRole('button', { name: 'Claim ce challenge' });
		await expect(claimBtn).toBeVisible();
		await claimBtn.click();

		await expect(page.getByText('Challenge reserve')).toBeVisible();
		expect(claimCalls).toBe(1);
	});

	test('an anonymous visitor sees the login CTA instead of claim', async ({ page }) => {
		await mockApi(page, [
			{ path: '/auth/me', handler: apiError(401, 'AUTH_UNAUTHORIZED', 'nope') },
			{ path: '/slices/s-1', handler: json({ data: { slice: makeSlice() } }) }
		]);

		await gotoClientSide(page, '/slices/s-1');
		const loginCta = page.getByRole('link', { name: 'Se connecter pour claim' });
		await expect(loginCta).toBeVisible();
		await expect(loginCta).toHaveAttribute('href', '/auth/login?redirect=/slices/s-1');
		await expect(page.getByRole('button', { name: 'Claim ce challenge' })).toHaveCount(0);
	});

	test('a 403 claim shows the rank/orientation gate message', async ({ page, context }) => {
		await signIn(context, 'challenger');
		await mockApi(page, [
			...meRoutes(challenger),
			{ path: '/slices/s-1', handler: json({ data: { slice: makeSlice({ min_rank: 'artisan' }) } }) },
			{
				path: '/slices/s-1/claim',
				handler: apiError(403, 'SLICE_RANK_TOO_LOW', 'rank insuffisant')
			}
		]);

		await gotoClientSide(page, '/slices/s-1');
		await page.getByRole('button', { name: 'Claim ce challenge' }).click();

		await expect(
			page.getByText('Ton rank ou orientation ne correspond pas encore a cette slice.')
		).toBeVisible();
	});
});

test.describe('SKI-93 slice detail - submit PR', () => {
	const claimed = makeSlice({
		status: 'claimed',
		claimed_by_user_id: 'u-challenger',
		fork_repo_url: 'https://github.com/kofi/skilluv-backend'
	});

	test('the claimer submits their PR with the announce flag', async ({ page, context }) => {
		await signIn(context, 'challenger');
		let submitted: Record<string, unknown> | null = null;
		await mockApi(page, [
			...meRoutes(challenger),
			{ path: '/slices/s-1', handler: json({ data: { slice: claimed } }) },
			{
				path: '/slices/s-1/submit-pr',
				handler: (route) => {
					submitted = route.request().postDataJSON();
					return json({ data: { submitted: true } })(route);
				}
			}
		]);

		await gotoClientSide(page, '/slices/s-1');
		await expect(page.getByRole('heading', { name: 'Soumettre ta PR' })).toBeVisible();

		await page
			.getByLabel('URL de la Pull Request')
			.fill('https://github.com/skilluv/skilluv-backend/pull/77');
		await page
			.getByText('Annoncer publiquement sur la PR que je contribue via Skilluv')
			.click();
		await page.getByRole('button', { name: 'Envoyer la PR' }).click();

		await expect(page.getByText('PR soumise').first()).toBeVisible();
		expect(submitted).toEqual({
			pr_url: 'https://github.com/skilluv/skilluv-backend/pull/77',
			announce_publicly: true
		});
	});

	test('the submit button stays disabled while the URL is empty', async ({ page, context }) => {
		await signIn(context, 'challenger');
		await mockApi(page, [
			...meRoutes(challenger),
			{ path: '/slices/s-1', handler: json({ data: { slice: claimed } }) }
		]);

		await gotoClientSide(page, '/slices/s-1');
		await expect(page.getByRole('button', { name: 'Envoyer la PR' })).toBeDisabled();
	});

	test('a validated slice exposes the PDF and the public verify link', async ({ page, context }) => {
		await signIn(context, 'challenger');
		const hash = 'a'.repeat(64);
		await mockApi(page, [
			...meRoutes(challenger),
			{
				path: '/slices/s-1',
				handler: json({
					data: {
						slice: makeSlice({
							status: 'validated',
							claimed_by_user_id: 'u-challenger',
							attestation_hash: hash,
							submitted_pr_url: 'https://github.com/skilluv/skilluv-backend/pull/77'
						})
					}
				})
			}
		]);

		await gotoClientSide(page, '/slices/s-1');
		await expect(page.getByText('Attestation generee')).toBeVisible();
		// Absolute backend URL, not a relative path: the PDF is served from the
		// backend root, where the frontend origin has no such route.
		await expect(
			page.getByRole('link', { name: "Telecharger le PDF de l'attestation" })
		).toHaveAttribute('href', new RegExp(`^https?://.+/verify/${hash}\\.pdf$`));
		await expect(page.getByRole('link', { name: 'Verifier publiquement' })).toHaveAttribute(
			'href',
			`/verify/${hash}`
		);
	});
});

// --- SKI-94: my challenges dashboard ---

test.describe('SKI-94 my challenges dashboard', () => {
	test('shows in-progress slices and recommendations', async ({ page, context }) => {
		await signIn(context, 'challenger');
		await mockApi(page, [
			...meRoutes(challenger),
			{
				path: '/users/me/slices',
				handler: json({
					data: {
						slices: [makeSlice({ status: 'in_progress', claimed_by_user_id: 'u-challenger' })],
						page: 1,
						per_page: 100
					}
				})
			},
			{
				path: '/me/feed/challenges',
				handler: json({
					data: {
						slices: [makeSlice({ id: 's-2', title: 'Ajouter un index sur users.email' })],
						meta: { user_rank_ord: 3, median_difficulty: 3 }
					}
				})
			}
		]);

		await gotoClientSide(page, '/dashboard/slices');
		await expect(page.getByRole('heading', { name: 'Mes challenges' })).toBeVisible();
		await expect(page.getByText('Corriger le parsing des dates ISO')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Recommandes pour toi' })).toBeVisible();
		await expect(page.getByText('Ajouter un index sur users.email')).toBeVisible();
	});

	test('shows the empty state when the user has no active slice', async ({ page, context }) => {
		await signIn(context, 'challenger');
		await mockApi(page, [
			...meRoutes(challenger),
			{ path: '/users/me/slices', handler: json({ data: { slices: [], page: 1, per_page: 100 } }) },
			{ path: '/me/feed/challenges', handler: json({ data: { slices: [] } }) }
		]);

		await gotoClientSide(page, '/dashboard/slices');
		await expect(page.getByText('Aucun challenge en cours')).toBeVisible();
	});
});

// --- SKI-95: validation queue + review ---

test.describe('SKI-95 validation queue', () => {
	test('a validator sees the queue and picks up a PR', async ({ page, context }) => {
		await signIn(context, 'validator');
		let pickupCalls = 0;
		await mockApi(page, [
			...meRoutes(validator, ['challenge_validator:code']),
			{
				path: '/me/validation/queue',
				handler: json({ data: { items: [queueItem(makeSlice({ status: 'ci_green' }))] } })
			},
			{
				path: '/slices/s-1/validation/pickup',
				handler: (route) => {
					pickupCalls++;
					return json({ data: { picked_up: true } })(route);
				}
			}
		]);

		await gotoHydrated(page, '/validations/queue');
		await expect(page.getByRole('heading', { name: 'File de validation' })).toBeVisible();
		await expect(page.getByText('Corriger le parsing des dates ISO')).toBeVisible();

		await page.getByRole('button', { name: 'Prendre en charge' }).click();
		await expect(page.getByText('Challenge pris en charge.')).toBeVisible();
		expect(pickupCalls).toBe(1);
	});

	test('a non-validator (403) sees the invitation to apply', async ({ page, context }) => {
		await signIn(context, 'challenger');
		await mockApi(page, [
			...meRoutes(challenger),
			{
				path: '/me/validation/queue',
				handler: apiError(403, 'CAPABILITY_MISSING', 'pas validateur')
			}
		]);

		await gotoHydrated(page, '/validations/queue');
		await expect(page.getByText("Tu n'es pas encore validateur")).toBeVisible();
		await expect(page.getByRole('link', { name: 'Candidater' })).toHaveAttribute(
			'href',
			'/settings/validator-application/new'
		);
	});

	test('a lost pick-up (400) warns that the PR is taken', async ({ page, context }) => {
		await signIn(context, 'validator');
		await mockApi(page, [
			...meRoutes(validator, ['challenge_validator:code']),
			{
				path: '/me/validation/queue',
				handler: json({ data: { items: [queueItem(makeSlice({ status: 'ci_green' }))] } })
			},
			{
				path: '/slices/s-1/validation/pickup',
				handler: apiError(400, 'SLICE_ALREADY_PICKED', 'deja pris')
			}
		]);

		await gotoHydrated(page, '/validations/queue');
		await page.getByRole('button', { name: 'Prendre en charge' }).click();
		await expect(
			page.getByText('Ce challenge a ete pris par un autre validateur.')
		).toBeVisible();
	});
});

test.describe('SKI-95 review approve / reject', () => {
	const pickedUp = { ...queueItem(makeSlice({ status: 'pending_validation' })), picked_up_by_me: true };

	test('approving generates a downloadable attestation', async ({ page, context }) => {
		await signIn(context, 'validator');
		const hash = 'b'.repeat(64);
		await mockApi(page, [
			...meRoutes(validator, ['challenge_validator:code']),
			{ path: '/me/validation/queue', handler: json({ data: { items: [pickedUp] } }) },
			{
				path: '/slices/s-1/validation/approve',
				handler: json({
					data: { attestation_hash: hash, pdf_url: `/verify/${hash}.pdf`, fragments_credited: 120 }
				})
			}
		]);

		await gotoHydrated(page, '/validations/s-1/review');
		await expect(page.getByRole('heading', { name: 'Ton verdict' })).toBeVisible();
		await page.getByRole('button', { name: 'Approuver' }).click();

		await expect(page.getByRole('heading', { name: 'Validation approuvee' })).toBeVisible();
		await expect(page.getByText('120 fragments credites.')).toBeVisible();
	});

	test('rejecting requires feedback and returns to the queue', async ({ page, context }) => {
		await signIn(context, 'validator');
		let rejected: Record<string, unknown> | null = null;
		await mockApi(page, [
			...meRoutes(validator, ['challenge_validator:code']),
			{ path: '/me/validation/queue', handler: json({ data: { items: [pickedUp] } }) },
			{
				path: '/slices/s-1/validation/reject',
				handler: (route) => {
					rejected = route.request().postDataJSON();
					return json({ data: { rejected: true } })(route);
				}
			}
		]);

		await gotoHydrated(page, '/validations/s-1/review');
		const rejectBtn = page.getByRole('button', { name: 'Rejeter' });
		await expect(rejectBtn).toBeDisabled();

		await page.getByLabel(/^Feedback/).fill('Les tests ne couvrent pas les offsets negatifs.');
		await rejectBtn.click();

		await expect(page).toHaveURL(/\/validations\/queue$/);
		expect(rejected).toEqual({ reason: 'Les tests ne couvrent pas les offsets negatifs.' });
	});

	test('approving your own PR (400) is refused with an explicit message', async ({ page, context }) => {
		await signIn(context, 'validator');
		await mockApi(page, [
			...meRoutes(validator, ['challenge_validator:code']),
			{ path: '/me/validation/queue', handler: json({ data: { items: [pickedUp] } }) },
			{
				path: '/slices/s-1/validation/approve',
				handler: apiError(400, 'VALIDATION_SELF', 'self')
			}
		]);

		await gotoHydrated(page, '/validations/s-1/review');
		await page.getByRole('button', { name: 'Approuver' }).click();
		await expect(page.getByText('Impossible : tu es le claimer de cette PR.')).toBeVisible();
	});

	test('a slice missing from the queue shows the not-found state', async ({ page, context }) => {
		await signIn(context, 'validator');
		await mockApi(page, [
			...meRoutes(validator, ['challenge_validator:code']),
			{ path: '/me/validation/queue', handler: json({ data: { items: [] } }) }
		]);

		await gotoHydrated(page, '/validations/s-1/review');
		await expect(page.getByRole('heading', { name: 'Introuvable' })).toBeVisible();
	});
});
