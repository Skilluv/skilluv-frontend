import type { UserOrientation } from '$lib/types';

/**
 * The trades somebody is actually following.
 *
 * `GET /users/me/orientations` is a record rather than a current state: ending
 * a trade sets `ended_at` and the row stays in the list. Counting the raw
 * length therefore answers "has this person ever chosen one", which is not the
 * question the prompt banner and the soft-block are asking.
 */
export function activeOrientations(orientations: UserOrientation[] | undefined): UserOrientation[] {
	return (orientations ?? []).filter((o) => !o.ended_at);
}

/**
 * The trades that can carry a first gesture.
 *
 * `activeOrientations` above means "not ended", which is what the banners and
 * the soft blocks ask — they only need to know whether somebody has declared
 * anything at all. The rite asks a narrower question, and asks it of the
 * database: `POST /onboarding/bonjour-skilluv/start` requires a row with
 * `ended_at IS NULL AND mode = 'active'`.
 *
 * The two were conflated, and `mode` defaults to `learning` on the signup
 * path. So the ordinary new account had a trade the front counted and the API
 * refused, the button was offered, and the click came back with "Choose a
 * trade first" to somebody who had just chosen one.
 */
export function startableOrientations(
	orientations: UserOrientation[] | undefined
): UserOrientation[] {
	return activeOrientations(orientations).filter((o) => o.mode === 'active');
}
