/**
 * The education domain: cohorts, their outcomes, and curricula other people
 * run.
 *
 * ## Why an outcome is recorded per learner
 *
 * `PUT /education/cohorts/{id}/outcomes` writes one learner's result, not a
 * summary. A trainer who could only report a headline number would report a
 * good one, and a cohort's record is only worth reading if the people who did
 * not finish are in it.
 *
 * ## The one that is a duty, not a feature
 *
 * `learner-data-cleared` is a declaration that the personal data a course
 * collected has been deleted. It exists because teaching produces records
 * about people who are not Skilluv members — names on a register, notes on
 * somebody's progress — and the platform hosting the curriculum does not get
 * to keep those forever.
 *
 * A surface must not present it as a tidy-up action. It is somebody stating on
 * the record that they discharged an obligation, and it should read that way.
 *
 * ## Adoptions are what a curriculum is for
 *
 * A curriculum nobody else ran is a document. `adoptions` is the count that
 * separates the two, which is why it is on the education record rather than
 * buried in the slice.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const educationApi = {
	/** One learner's result, recorded on its own row. */
	recordOutcome(cohortId: string, body: Record<string, unknown>) {
		return api.put<ApiResponse<unknown>>(
			`/education/cohorts/${encodeURIComponent(cohortId)}/outcomes`,
			body
		);
	},

	outcomes(cohortId: string) {
		return api.get<ApiResponse<{ outcomes: unknown[] }>>(
			`/education/cohorts/${encodeURIComponent(cohortId)}/outcomes`
		);
	},

	concludeCohort(cohortId: string, body?: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>(
			`/education/cohorts/${encodeURIComponent(cohortId)}/conclude`,
			body ?? {}
		);
	},

	/** Who else has run this curriculum. */
	adoptions(sliceId: string) {
		return api.get<ApiResponse<{ adoptions: unknown[] }>>(
			`/education/curriculums/${encodeURIComponent(sliceId)}/adoptions`
		);
	},

	/** Record that you ran somebody else's curriculum. */
	adoptCurriculum(sliceId: string, body?: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>(
			`/education/curriculums/${encodeURIComponent(sliceId)}/adoptions`,
			body ?? {}
		);
	},

	/**
	 * Declare that the learner data this course collected has been deleted.
	 *
	 * A statement of fact about an obligation discharged, not a housekeeping
	 * action — the records are about people who never joined this platform.
	 */
	declareLearnerDataCleared(sliceId: string) {
		return api.post<ApiResponse<unknown>>(
			`/education/slices/${encodeURIComponent(sliceId)}/learner-data-cleared`,
			{}
		);
	}
};
