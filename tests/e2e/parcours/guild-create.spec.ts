/**
 * Parcours — /guilds/new (SKI-290).
 *
 * Read-only on purpose. Minting a guild against the shared test backend is
 * irreversible (a user belongs to at most one guild), so the mutation itself is
 * covered by tests/e2e/guild-create.test.ts. What is checked here is that the
 * page is reachable by a logged-in user and that the co-founder resolution
 * really hits the backend.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours guild-create', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('la page est atteinte sans rebond login et annonce la regle', async ({ page }) => {
		await page.goto('/guilds/new');
		await expect(page.getByTestId('guild-create-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('guild-create-rule')).toBeVisible();
		await expect(page.getByTestId('guild-create-submit')).toBeDisabled();
	});

	test('un pseudo inexistant est refuse par le back, sans 500', async ({ page }) => {
		await page.goto('/guilds/new');
		await expect(page.getByTestId('guild-create-page')).toBeVisible({ timeout: 15_000 });

		// Typing before Svelte attaches sets the DOM value but never the state, so
		// the click would resolve an empty username. Wait for hydration first.
		await expect(page.locator('html')).toHaveAttribute('dir', 'ltr', { timeout: 20_000 });
		await page.getByTestId('cofounder-input').fill('compte-qui-nexiste-pas-skilluv');
		await page.getByTestId('add-cofounder').click();

		// The API client retries GETs with backoff, so the 404 surfaces late.
		await expect(page.getByTestId('cofounder-error')).toBeVisible({ timeout: 20_000 });
		await expect(page.getByTestId('cofounder-count')).toContainText('0 / 3');
	});
});
