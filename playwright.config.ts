import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Playwright does not read `.env` (Vite does). Without this the `parcours/`
// specs saw an empty `PUBLIC_API_BASE_URL` and skipped all 91 of themselves
// even though the file was filled in. Existing environment variables win, so CI
// can impose its own. `quiet` keeps dotenv's banner off stdout, which would
// otherwise corrupt `--reporter=json`.
dotenv.config({ quiet: true });

const BASE_URL = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5173';
const IS_SMOKE_ONLY = process.env.SMOKE_ONLY === '1';
const IS_CROSS_BROWSER = process.env.CROSS_BROWSER === '1';

/** The `parcours/` specs only run when a backend is configured. */
const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);

/**
 * Whether this invocation can run `parcours/` specs at all. Starting the dev
 * server for a legacy-only run just steals CPU from it and made the mocked
 * suite flaky, so gate it on the requested project.
 */
const TARGETS_PARCOURS =
	!process.argv.some((a) => a.startsWith('--project=')) ||
	process.argv.some((a) => a.includes('parcours'));

/** Mock backend port, kept off 3001 so a real local backend never clashes. */
const MOCK_BACKEND_PORT = 3099;

/**
 * Deux univers de tests coexistent :
 *
 * - Legacy `**\/*.test.ts` (auth, challenges, wallet, i18n, ...) : lances par
 *   les projets `legacy-*`. Historiquement, ils tournent contre `npm run preview`
 *   (build + preview) sur le port 4173 avec des mocks fetch. On preserve ce
 *   comportement pour ne pas casser la CI actuelle.
 *
 * - Smoke `tests/e2e/smoke/**\/*.spec.ts` : lances par les projets `smoke-*`.
 *   Ils ciblent un dev server local (`npm run dev` sur :5173) ou une staging
 *   via `PUBLIC_BASE_URL`. Aucun mock : ils refletent l'app reelle.
 *
 * - Parcours `tests/e2e/parcours/**\/*.spec.ts` : parcours utilisateur
 *   authentifies (compte fixe login-first). Necessitent PUBLIC_API_BASE_URL
 *   pour cibler le back staging + storageState genere par les setup specs.
 *
 * Cross-browser : par defaut on ne teste que Chromium. Passer `CROSS_BROWSER=1`
 * pour ajouter Firefox + WebKit sur les smoke et parcours (attendu long a
 * runner, reserver pour CI nightly ou release checks).
 */
export default defineConfig({
	testDir: 'tests/e2e',
	// Only meaningful when the dev server is started (parcours runs); it returns
	// immediately otherwise.
	globalSetup: TARGETS_PARCOURS && HAS_BACK ? './tests/e2e/utils/global-setup.ts' : undefined,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	fullyParallel: true,
	use: {
		baseURL: BASE_URL,
		// En CI on capture systematiquement trace + video + screenshot pour
		// faciliter le debug des flaky. En local on garde le comportement leger
		// (only-on-failure / on-first-retry) pour ne pas ralentir les runs.
		screenshot: process.env.CI ? 'on' : 'only-on-failure',
		trace: process.env.CI ? 'on' : 'on-first-retry',
		video: process.env.CI ? 'on' : 'retain-on-failure'
	},
	/**
	 * Servers started automatically.
	 *
	 * 1. Mock backend on :3099 — serves `GET /api/auth/me` so SSR auth
	 *    (hooks.server.ts) can be simulated in the mocked suite. See
	 *    tests/e2e/utils/mock-backend.mjs.
	 *
	 * 2. App on :4173 — adapter-node build, not `vite preview`: only the node
	 *    server actually replays the hooks, cookies included. Its environment is
	 *    pinned to the mock backend so the mocked suite stays hermetic even when
	 *    `.env` points at a remote backend.
	 *
	 * 3. Dev server on :5173 — only when `PUBLIC_API_BASE_URL` is set AND the run
	 *    targets the `parcours/` specs. It proxies `/api` to the target backend
	 *    (vite.config.ts).
	 */
	webServer: IS_SMOKE_ONLY
		? undefined
		: [
				{
					command: 'node tests/e2e/utils/mock-backend.mjs',
					port: MOCK_BACKEND_PORT,
					env: { MOCK_BACKEND_PORT: String(MOCK_BACKEND_PORT) },
					reuseExistingServer: !process.env.CI
				},
				{
					command: 'npm run build && node build/index.js',
					port: 4173,
					env: {
						PORT: '4173',
						// The mocked suite must never hit the real backend, even when
						// `.env` configures one for the parcours specs.
						API_URL: `http://localhost:${MOCK_BACKEND_PORT}/api`,
						PUBLIC_API_BASE_URL: `http://localhost:${MOCK_BACKEND_PORT}`
					},
					reuseExistingServer: !process.env.CI,
					// The build runs inside this command: the 60s default was not
					// enough and failed the Playwright job before the first test.
					timeout: 300_000
				},
				...(HAS_BACK && TARGETS_PARCOURS
					? [
							{
								command: 'npm run dev -- --port 5173',
								port: 5173,
								reuseExistingServer: true,
								timeout: 120_000
							}
						]
					: [])
			],
	projects: [
		{
			name: 'legacy-chromium',
			testMatch: '**/*.test.ts',
			use: {
				...devices['Desktop Chrome'],
				baseURL: 'http://localhost:4173'
			}
		},
		{
			name: 'smoke-chromium',
			testMatch: 'smoke/**/*.spec.ts',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1440, height: 900 },
				baseURL: BASE_URL
			}
		},
		{
			name: 'smoke-mobile',
			testMatch: 'smoke/**/*.spec.ts',
			use: {
				...devices['Pixel 5'],
				baseURL: BASE_URL
			}
		},
		{
			// Parcours authentifies — require back staging + seeded accounts.
			// Sans back, chaque test skip proprement via test.skip(!HAS_BACK).
			name: 'parcours-chromium',
			testMatch: 'parcours/**/*.spec.ts',
			// These specs cross the network to a real backend, so they need more
			// headroom than the mocked suite.
			timeout: 90_000,
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1440, height: 900 },
				baseURL: BASE_URL
			}
		},
		// Cross-browser projects : uniquement quand CROSS_BROWSER=1
		...(IS_CROSS_BROWSER
			? [
					{
						name: 'smoke-firefox',
						testMatch: 'smoke/**/*.spec.ts',
						use: {
							...devices['Desktop Firefox'],
							viewport: { width: 1440, height: 900 },
							baseURL: BASE_URL
						}
					},
					{
						name: 'smoke-webkit',
						testMatch: 'smoke/**/*.spec.ts',
						use: {
							...devices['Desktop Safari'],
							viewport: { width: 1440, height: 900 },
							baseURL: BASE_URL
						}
					},
					{
						name: 'parcours-firefox',
						testMatch: 'parcours/**/*.spec.ts',
						use: {
							...devices['Desktop Firefox'],
							viewport: { width: 1440, height: 900 },
							baseURL: BASE_URL
						}
					},
					{
						name: 'parcours-webkit',
						testMatch: 'parcours/**/*.spec.ts',
						use: {
							...devices['Desktop Safari'],
							viewport: { width: 1440, height: 900 },
							baseURL: BASE_URL
						}
					}
				]
			: [])
	]
});
