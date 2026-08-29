/**
 * Proposing a design brief, and following what happened to it.
 *
 * The T-02 ticket calls curated briefs "the main source of challenges", and
 * the backend built the queue the way that only works if members feed it: a
 * proposal is written by anyone, published by an admin, and the author is
 * credited when the resulting challenge is first validated.
 *
 * Three endpoints here. The other three — the admin queue, publish and reject
 * — live under `/admin/design/briefs` and belong to the admin front, not this
 * one.
 */

import type { ApiResponse, DesignBriefProposal, ProposeBriefRequest } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const designBriefsApi = {
	/**
	 * Propose a brief for the curated queue.
	 *
	 * Answers 201 with the pending proposal. It is not a challenge yet and the
	 * UI must not call it one: nothing is open to claim until an admin
	 * publishes it.
	 */
	propose(payload: ProposeBriefRequest) {
		return api.post<ApiResponse<{ proposal: DesignBriefProposal }>>('/design/briefs', payload);
	},

	/**
	 * Every brief the caller proposed, whatever became of it.
	 *
	 * Rejected ones come back too, carrying `review_feedback`. Hiding a refusal
	 * would leave somebody re-proposing the same brief forever.
	 */
	mine(limit?: number) {
		return api.get<ApiResponse<{ proposals: DesignBriefProposal[] }>>('/design/briefs/mine', {
			limit
		});
	},

	/**
	 * Take a proposal back before it is decided.
	 *
	 * Only the author, and only while it is pending — a published brief is a
	 * live challenge somebody may already have claimed.
	 */
	withdraw(id: string) {
		return api.post<ApiResponse<{ proposal: DesignBriefProposal }>>(
			`/design/briefs/${id}/withdraw`
		);
	}
};
