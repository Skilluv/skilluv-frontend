/**
 * Parcours — dedicated push notification settings page (Vague 6, Ticket 11).
 * The PushToggle needs a real browser + service worker permission grant to
 * actually subscribe ; we assert the UI is reachable and renders the toggle
 * container (or the "unsupported" fallback in headless mode).
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours push settings', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL + seeded back');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });

	test('renders /settings/notifications with the push toggle', async ({ page }) => {
		await page.goto('/settings/notifications');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		// PushToggle renders either its title ("Browser notifications" / "Notifications navigateur")
		// when the API is available, or the "unsupported" fallback in headless mode.
		const toggleTitle = page.getByRole('heading', { name: /browser notifications|notifications navigateur/i });
		const unsupported = page.getByText(/pas.*supporté|not supported|unsupported|ne supporte pas/i);
		await expect(toggleTitle.or(unsupported)).toBeVisible({ timeout: 10_000 });
	});
});
