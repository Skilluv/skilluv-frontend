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
