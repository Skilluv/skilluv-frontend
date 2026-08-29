/**
 * Safety reports on an AI slice: somebody found a way the model behaves badly.
 *
 * ## Disclosure is a timing decision, not a flag
 *
 * `PATCH /safety-reports/{id}/disclosure` changes when a report becomes
 * readable. That is the same problem a security embargo solves — publishing a
 * jailbreak the day it is found helps whoever wanted to use it — so a surface
 * has to treat the date as consequential rather than as metadata.
 *
 * ## Reproduction is what makes it a report
 *
 * A safety claim nobody could reproduce is an anecdote. `reproduce` is a
 * second person saying they saw the same thing, which is what separates the
 * two, and it belongs next to the claim rather than in a review queue.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const aiSafetyApi = {
	/** The safety reports filed against one slice. */
	forSlice(sliceId: string) {
		return api.get<ApiResponse<{ reports: unknown[] }>>(
			`/slices/${encodeURIComponent(sliceId)}/safety-reports`
		);
	},

	/** File one. */
	file(sliceId: string, body: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>(
			`/slices/${encodeURIComponent(sliceId)}/safety-reports`,
			body
		);
	},

	/** Move the disclosure date. Consequential, not metadata. */
	setDisclosure(reportId: string, body: Record<string, unknown>) {
		return api.patch<ApiResponse<unknown>>(
			`/safety-reports/${encodeURIComponent(reportId)}/disclosure`,
			body
		);
	},

	/** Say you saw the same thing. What turns an anecdote into a report. */
	reproduce(reportId: string, body?: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>(
			`/safety-reports/${encodeURIComponent(reportId)}/reproduce`,
			body ?? {}
		);
	}
};
