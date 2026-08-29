/**
 * The beginner verification: a short set of questions somebody answers to show
 * they wrote what they submitted.
 *
 * ## What it is for, and what it is not
 *
 * It is not an exam and it does not grade skill. It asks somebody to explain
 * their own submission, which is the one thing a person who copied it cannot
 * do. So a surface must never present it as a test somebody can fail at being
 * a beginner — the point is the opposite: it is what lets a beginner's work
 * count.
 *
 * ## The queue is a capability, not a role
 *
 * `queue` and `record_verdict` answer 403 without the apprentice-verifier
 * capability. That answer is the authority; a client deciding from a badge
 * would offer the action to people the server refuses.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface VerificationRequest {
	id: string;
	[key: string]: unknown;
}

export const apprenticeVerificationsApi = {
	/**
	 * The questions for one template.
	 *
	 * Served rather than shipped, and never guessed: answers are keyed by the
	 * ids this returns, and a client inventing them would submit answers to
	 * questions that were never asked.
	 */
	questions(templateId: string) {
		return api.get<ApiResponse<{ questions: unknown[] }>>(
			`/beginner/verifications/questions/${encodeURIComponent(templateId)}`
		);
	},

	/**
	 * Submit answers about your own submission.
	 *
	 * `answers` is free-form JSON keyed by the question ids that were served —
	 * a client must not invent them, for the same reason a lab answer form
	 * must not.
	 */
	submit(payload: { template_id: string; submission_id?: string; answers: unknown }) {
		return api.post<ApiResponse<{ verification: VerificationRequest }>>(
			'/beginner/verifications',
			payload
		);
	},

	/** Where the caller's own verifications got to. */
	mine() {
		return api.get<ApiResponse<{ progress: unknown }>>('/beginner/verifications/mine');
	},

	/**
	 * What is waiting on a verifier.
	 *
	 * 403 without the capability, which is what decides whether to offer the
	 * surface at all.
	 */
	queue(params?: { limit?: number; offset?: number }) {
		return api.get<ApiResponse<{ pending: VerificationRequest[] }>>(
			'/beginner/verifications/queue',
			params
		);
	},

	/**
	 * Record a verdict, with notes.
	 *
	 * The notes matter more here than almost anywhere else: this is a beginner
	 * being told their work does or does not count, and a verdict with no
	 * reason is the version of that which makes people leave.
	 */
	recordVerdict(id: string, verdict: string, notes?: string) {
		return api.post<ApiResponse<unknown>>(
			`/beginner/verifications/${encodeURIComponent(id)}/verdict`,
			{ verdict, ...(notes ? { notes } : {}) }
		);
	}
};
