import type { ApiResponse } from '$lib/types';
import type { Rite } from './onboarding_rites';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * Starting and following the first act.
 *
 * ## One endpoint, twelve gestures
 *
 * There is no route per domain. The rite is one thing that takes one of two
 * forms, and `POST /onboarding/bonjour-skilluv/start` reads the caller's own
 * `skill_domain` to decide which: `code` forks a starter on GitHub, the other
 * eleven open a submission against the domain's rite template and never touch
 * GitHub. So the frontend branches on `form`, never on the domain.
 *
 * ## It is idempotent
 *
 * Calling it twice answers the existing row with `already_started: true` and
 * performs no side effect, which is what makes it safe to call from a button
 * somebody can double-click and from a page they can reload.
 *
 * ## Two preconditions, and they are checked in this order
 *
 * A declared trade first — the starter that gets forked is chosen from it, and
 * starting without one used to fork a broad-appeal default and then recommend
 * nothing in particular. Then, for the fork form only, a linked GitHub account.
 * Each answers 400.
 *
 * Both are knowable before the button is pressed, so the screen checks them and
 * offers the way to fix them instead. A 400 after a click is the same class of
 * mistake as sending a fork rite to a code editor.
 */

/** Where the rite is, in the order it moves through. */
export type RiteStatus = 'forked' | 'hello_committed' | 'pr_opened' | 'completed' | 'abandoned';

export interface RiteProgress {
	rite_form: string;
	challenge_id: string;
	starter_slug: string | null;
	/** `owner/repo` on the person's own account. Null before the fork exists. */
	fork_full_name: string | null;
	fork_html_url: string | null;
	status: RiteStatus;
	pr_number: number | null;
	pr_url: string | null;
}

/** Present only on the call that actually opened the row, never on a repeat. */
export interface RiteNextSteps {
	/** `git@github.com:owner/repo.git`. Null on the eleven submission rites. */
	clone_url: string | null;
	/** What the trade expects, in its own words. */
	expected_artifact: string;
	challenge_id: string;
}

export interface StartRiteResponse {
	already_started: boolean;
	onboarding: RiteProgress;
	next_steps?: RiteNextSteps;
}

export interface RiteStatusResponse {
	started: boolean;
	/** Null until the rite is started. */
	onboarding: RiteProgress | null;
	/** The descriptor for the caller's own domain, so no second call is needed. */
	rite: Rite | null;
}

export const onboardingRiteApi = {
	/** `POST /onboarding/bonjour-skilluv/start` — idempotent. */
	start() {
		return api.post<ApiResponse<StartRiteResponse>>('/onboarding/bonjour-skilluv/start');
	},

	/**
	 * `GET /onboarding/bonjour-skilluv/status`
	 *
	 * Polled rather than subscribed to: `completed` is set when a reviewer
	 * settles the deliverable, and the pull request only moves it to
	 * `pr_opened`. There is nothing to listen on for either step.
	 */
	status() {
		return api.get<ApiResponse<RiteStatusResponse>>('/onboarding/bonjour-skilluv/status');
	}
};
