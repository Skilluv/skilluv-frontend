/**
 * The first gesture each discipline asks for.
 *
 * ## Public on purpose
 *
 * `GET /api/onboarding/rites` needs no session, so the class-selection wall can
 * show what somebody would actually do in a discipline before they have an
 * account. Putting that behind sign-up meant asking people to commit to a
 * trade before being told what it involves.
 *
 * ## Two forms, twelve gestures
 *
 * Only one rite is a fork, and it is the only one wanting a GitHub account.
 * The other eleven hand in an artifact against the discipline's rite template
 * and land in the human review queue. The difference in trade lives in the
 * brief, not in the mechanism.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** `fork` calls GitHub and waits on a webhook; `submission` files an artifact. */
export type RiteForm = 'fork' | 'submission';

export interface Rite {
	domain: string;
	form: RiteForm;
	/** One line: what the person does. */
	gesture: string;
	expected_artifact: string;
	/** Where the trade continues once the rite is passed. */
	continues_in: string;
	/** True for exactly one of the twelve. */
	requires_github: boolean;
	/**
	 * The published rite template, when the discipline has one.
	 *
	 * `null` means no brief is published and the gesture must not be offered.
	 */
	challenge_id: string | null;
	challenge_title: string | null;
}

export const onboardingRitesApi = {
	/** The whole catalogue in one call. No session required. */
	list() {
		return api.get<ApiResponse<{ rites: Rite[] }>>('/onboarding/rites');
	}
};
