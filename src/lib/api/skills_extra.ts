/**
 * Reads around skills, deliverables and benchmarks that had no caller.
 *
 * ## `skills/{slug}/talents` points the other way
 *
 * Every other skill read answers "what does this person know". This one
 * answers "who knows this", which is the recruiter's question and the reason
 * the skill tree is worth maintaining at all.
 *
 * ## A benchmark nobody reproduced is a number somebody typed
 *
 * `reproduce` is a second party running it and getting the same result. On a
 * platform whose whole claim is verified work, a benchmark without one belongs
 * in the same category as a declared download count — worth showing, never
 * worth counting.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const skillsExtraApi = {
	/** Who has this skill. The recruiter's direction. */
	talents(slug: string, params?: { limit?: number }) {
		return api.get<ApiResponse<{ talents: unknown[] }>>(
			`/skills/${encodeURIComponent(slug)}/talents`,
			params
		);
	},

	/** Somebody's skills, by user id. */
	userSkills(userId: string) {
		return api.get<ApiResponse<{ skills: unknown[] }>>(
			`/users/${encodeURIComponent(userId)}/skills`
		);
	},

	/** What to learn next, for the caller. */
	recommendations() {
		return api.get<ApiResponse<{ recommendations: unknown[] }>>(
			'/users/me/skill-recommendations'
		);
	}
};

export const deliverablesApi = {
	get(id: string) {
		return api.get<ApiResponse<{ deliverable: unknown }>>(
			`/deliverables/${encodeURIComponent(id)}`
		);
	},

	forUser(userId: string) {
		return api.get<ApiResponse<{ deliverables: unknown[] }>>(
			`/users/${encodeURIComponent(userId)}/deliverables`
		);
	}
};

export const benchmarksApi = {
	/** The benchmarks claimed on a slice. */
	forSlice(sliceId: string) {
		return api.get<ApiResponse<{ benchmarks: unknown[] }>>(
			`/slices/${encodeURIComponent(sliceId)}/benchmarks`
		);
	},

	/** Run it yourself and record what you got. */
	reproduce(benchmarkId: string, body: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>(
			`/benchmarks/${encodeURIComponent(benchmarkId)}/reproduce`,
			body
		);
	}
};
