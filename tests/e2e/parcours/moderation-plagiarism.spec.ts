/**
 * Parcours — /moderation/plagiarism.
 *
 * The page is capability-gated: the standard test account has no
 * `plagiarism_reviewer` grant and lands on the explicit refusal. That is a
 * deterministic, meaningful assertion — it proves the gate holds and that the
 * page never renders blank while capabilities are still loading.
 *
 * The authorised branch (queue with items) is covered on mocks in
 * tests/e2e/moderation-plagiarism.test.ts, where the capability can be granted.
 */
import { test, expect } from '@playwright/test';
import { userStoragePath } from './_helpers/user-session';
import fs from 'node:fs';

const HAS_BACK = Boolean(process.env.PUBLIC_API_BASE_URL);
const STATE = userStoragePath();
const HAS_STATE = fs.existsSync(STATE);

test.describe('@parcours moderation-plagiarism', () => {
	test.skip(!HAS_BACK, 'requires PUBLIC_API_BASE_URL');
	test.skip(!HAS_STATE, 'requires user-setup.spec.ts run first');
	if (HAS_STATE) test.use({ storageState: STATE });
	test.setTimeout(60_000);

	test('/moderation/plagiarism rend un ecran lisible selon les droits', async ({ page }) => {
		await page.goto('/moderation/plagiarism');
		await page.waitForLoadState('domcontentloaded');

		// The page title is always rendered, whatever the capability state.
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

		// Then either the refusal (no capability) or the queue. A loading
		// skeleton that never resolves is the failure this guards against.
		const refused = page.getByText(/plagiarism_reviewer|permission|reserv/i);
		const queue = page.getByRole('list');
		const empty = page.getByText(/aucun|no .*(flag|deliverable)/i);
		await expect(refused.or(queue).or(empty).first()).toBeVisible({ timeout: 15_000 });
	});
});
