/**
 * The review queue: work waiting to be judged, and the claim that stops two
 * people judging it at once.
 *
 * ## A claim expires, and that is load-bearing
 *
 * `claim_expires_at` exists because a reviewer who claims a task and vanishes
 * would hold it forever, and the deliverable behind it belongs to somebody
 * waiting. So a claim is a lease, not ownership.
 *
 * Any surface built on this has to render the deadline rather than the claim:
 * "yours for another two hours" is actionable, "claimed" is not, and a
 * reviewer who does not know the lease is running loses the work they had half
 * finished.
 *
 * ## The SLA is about the person waiting
 *
 * `sla_deadline` and `escalated_at` are not reviewer performance metrics. They
 * are how long somebody has been waiting for a verdict on work they submitted,
 * which is why an escalated task sorts above a fresh one regardless of who
 * claimed what.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface ReviewTask {
	id: string;
	task_type: string;
	deliverable_id: string | null;
	slice_id: string | null;
	status: string;
	claimed_by_user_id: string | null;
	claimed_at: string | null;
	/** A claim is a lease. Past this, somebody else may take it. */
	claim_expires_at: string | null;
	completed_at: string | null;
	completed_review_id: string | null;
	priority: number;
	/** How long the person who submitted has been waiting. */
	sla_deadline: string;
	escalated_at: string | null;
	primary_domain: string;
	required_seniority: string;
	created_at: string;
	updated_at: string;
}

export interface SubmitReviewBody {
	verdict: string;
	body: string;
	time_spent_seconds?: number;
}

export const reviewQueueApi = {
	/** Open tasks, narrowed to what a reviewer can actually take. */
	open(params?: { domain?: string; seniority?: string; page?: number; per_page?: number }) {
		return api.get<ApiResponse<{ tasks: ReviewTask[] }>>('/review-queue', params);
	},

	task(id: string) {
		return api.get<ApiResponse<{ task: ReviewTask }>>(
			`/review-queue/${encodeURIComponent(id)}`
		);
	},

	/**
	 * Take a task.
	 *
	 * The response carries a `message` alongside the task — render it: it is
	 * where the server says what the claim means and how long it lasts, and
	 * replacing it with a generic toast throws that away.
	 */
	claim(id: string) {
		return api.post<ApiResponse<{ task: ReviewTask; message: string }>>(
			`/review-queue/${encodeURIComponent(id)}/claim`,
			{}
		);
	},

	/** Reviews already written on a deliverable. */
	reviews(deliverableId: string) {
		return api.get<ApiResponse<{ reviews: unknown[] }>>(
			`/deliverables/${encodeURIComponent(deliverableId)}/reviews`
		);
	},

	/**
	 * Write the verdict.
	 *
	 * `time_spent_seconds` is optional and worth sending honestly: it is how
	 * the platform learns what a review actually costs, and an invented figure
	 * makes that number useless for everybody.
	 */
	submitReview(deliverableId: string, body: SubmitReviewBody) {
		return api.post<ApiResponse<{ outcome: unknown }>>(
			`/deliverables/${encodeURIComponent(deliverableId)}/reviews`,
			body
		);
	}
};

/** Whether a claim is still live. */
export function claimIsLive(t: ReviewTask, now = new Date()): boolean {
	if (!t.claim_expires_at) return false;
	return new Date(t.claim_expires_at).getTime() > now.getTime();
}

/** Whether the person who submitted has been waiting past the promise. */
export function isPastSla(t: ReviewTask, now = new Date()): boolean {
	return new Date(t.sla_deadline).getTime() < now.getTime();
}
