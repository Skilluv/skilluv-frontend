import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5173';
const IS_SMOKE_ONLY = process.env.SMOKE_ONLY === '1';
const IS_CROSS_BROWSER = process.env.CROSS_BROWSER === '1';

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
	// Le webServer legacy (build + preview :4173) reste utilise par les projets
	// `legacy-*`. Il est desactive quand on ne lance que les smoke/parcours
	// (SMOKE_ONLY=1) pour ne pas rebuild inutilement.
	webServer: IS_SMOKE_ONLY
		? undefined
		: {
				command: 'npm run build && npm run preview',
				port: 4173,
				reuseExistingServer: !process.env.CI
			},
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
