/**
 * Long-running assistant work: a code review, or a set of recommendations.
 *
 * ## Why these are jobs and not answers
 *
 * Both `code-review` and `recommendations` return a job id rather than a
 * result, and `jobs/{id}` is polled for the outcome. That is the right shape
 * for something that takes a model a while, and it has a consequence for any
 * surface: it must show that work is happening rather than hanging on a
 * request, because a spinner with no end is indistinguishable from a failure.
 *
 * ## What an assistant review is not
 *
 * It is not a validation and it never becomes one. A human reviewer decides
 * whether work counts; this reads the code and says things about it. Rendering
 * an assistant verdict beside a validator's would let the cheap one borrow the
 * weight of the expensive one, which is the distinction the whole platform
 * rests on.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface AssistantJob {
	job_id: string;
	[key: string]: unknown;
}

export const assistantJobsApi = {
	/** Ask for a review. Returns a job, not a verdict. */
	requestCodeReview(body: Record<string, unknown>) {
		return api.post<ApiResponse<AssistantJob>>('/assistant/code-review', body);
	},

	requestRecommendations(body: Record<string, unknown>) {
		return api.post<ApiResponse<AssistantJob>>('/assistant/recommendations', body);
	},

	/**
	 * The outcome, once there is one.
	 *
	 * Poll on a interval a person would tolerate, and stop: a page that polls
	 * forever on a job that failed is a page burning somebody's data plan for
	 * an answer that is not coming.
	 */
	job(jobId: string) {
		return api.get<ApiResponse<Record<string, unknown>>>(
			`/assistant/jobs/${encodeURIComponent(jobId)}`
		);
	}
};
