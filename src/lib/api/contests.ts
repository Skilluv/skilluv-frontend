/**
 * Hiring contests, from the side of somebody invited to one.
 *
 * The enterprise half — opening a contest, judging, recording a hire — lives
 * in the enterprise console under `/enterprise/contests`. What is here is the
 * three acts that belong to the person competing: read it, answer the
 * invitation, submit.
 *
 * ## Why responding is separate from submitting
 *
 * Accepting an invitation and handing in work are different commitments. A
 * contest somebody accepted and did not enter is a fact worth having — it says
 * the invitation reached them and the brief did not — and folding the two into
 * one action would erase it.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const contestsApi = {
	/** Contests currently open. Public. */
	open() {
		return api.get<ApiResponse<{ contests: unknown[] }>>('/contests/open');
	},

	/** One contest, by slug. */
	bySlug(slug: string) {
		return api.get<ApiResponse<{ contest: unknown }>>(
			`/contests/${encodeURIComponent(slug)}`
		);
	},

	/** Answer an invitation. Accepting is not entering. */
	respond(contestId: string, accept: boolean) {
		return api.post<ApiResponse<unknown>>(
			`/contests/${encodeURIComponent(contestId)}/respond`,
			{ accept }
		);
	},

	/** Hand in the work. */
	submit(contestId: string, body: { deliverable_url: string; notes_md?: string }) {
		return api.post<ApiResponse<unknown>>(
			`/contests/${encodeURIComponent(contestId)}/submit`,
			body
		);
	}
};
