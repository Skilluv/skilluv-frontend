import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * The step after the profile must not ask for a trade the account has.
 *
 * `POST /users/me/orientations` refuses at the ceiling without excluding the
 * row it is about to update, so re-posting one of your own three is counted
 * as a fourth and refused. The replay that registers the signup picks
 * therefore reports every one of them as failed on an account that already
 * carries them.
 *
 * Deciding from that count sent somebody with three trades to a page asking
 * for one, where the same refusal met them again — the loop in the report.
 * The decision reads the account instead.
 */
describe('the trade question is asked of the account', () => {
	const page = readFileSync('src/routes/onboarding/complete-profile/+page.svelte', 'utf8');

	it('reads what the account holds rather than what the replay returned', () => {
		expect(page).toContain('activeOrientations(after.data.user.orientations)');
		expect(page).toMatch(/if \(held > 0\)/);
	});

	it('no longer branches on the replay count alone', () => {
		// `resumed.registered.length > 0` was the whole decision, and it is
		// false on an account that already has its trades.
		expect(page).not.toContain('resumed.registered.length > 0');
	});

	it('still flags a partial registration, but only when trades are missing', () => {
		// `?trades=partial` tells somebody a pick could not be recorded. On a
		// full set it would be a warning about nothing.
		expect(page).toMatch(/resumed\.failed\.length > 0 && held < 3/);
	});
});
