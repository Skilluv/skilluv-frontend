/**
 * The applicant tracker.
 *
 * Everything here is scoped to the calling person's enterprise. The backend is
 * explicit about why, and it is worth repeating: there is no admin view of
 * somebody's pipeline and no cross-company listing, because *these rows belong
 * to the company that entered them, and Skilluv holding them does not make
 * them Skilluv's to read*.
 *
 * That has a consequence for anything built on this. A candidate row may be a
 * Skilluv member (`user_id`) or somebody entirely external (`external_name`,
 * `external_email`) — a person who never chose to be on this platform and
 * whose details a recruiter typed in. A surface must not treat the two alike:
 * linking an external candidate to a profile, or showing their email beside
 * platform data, would leak a stranger into a system they never joined.
 *
 * ## Retention is a plan feature
 *
 * `Plan.retention_days` is how long rows survive. It belongs next to the price
 * on any plan comparison, because it is the one field that decides whether a
 * pipeline is still there when somebody comes back to it.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface AtsPlan {
	slug: string;
	label: string;
	/** Null means unbounded. Not zero. */
	max_open_positions: number | null;
	max_candidates_per_opening: number | null;
	included_credits: number;
	monthly_fee: string;
	currency: string;
	/** How long a row survives. The field that decides if a pipeline lasts. */
	retention_days: number;
}

export interface Opening {
	id: string;
	enterprise_id: string;
	title: string;
	description_md: string;
	positions_count: number;
	remote_ok: boolean;
	location: string | null;
	status: string;
	opened_at: string | null;
	closed_at: string | null;
	created_at: string;
}

export interface OpeningInput {
	title: string;
	description_md?: string;
	orientation_slug?: string;
	positions_count: number;
	remote_ok: boolean;
	location?: string;
	salary_min?: string;
	salary_max?: string;
}

/**
 * Somebody in a pipeline.
 *
 * Either a Skilluv member or an external person a recruiter entered. The two
 * are different and must stay so — see the module note.
 */
export interface CandidateInput {
	user_id?: string;
	external_name?: string;
	external_email?: string;
	resume_url?: string;
	source?: string;
}

export interface AtsSubscription {
	subscription_id: string;
	plan: string;
	active: boolean;
}

export const atsApi = {
	/** What the tracker costs, and how long each plan keeps rows. Public. */
	plans() {
		return api.get<ApiResponse<{ plans: AtsPlan[] }>>('/ats/plans');
	},

	subscription() {
		return api.get<ApiResponse<{ plan: AtsPlan | null }>>('/ats/subscription');
	},

	/**
	 * Claim a plan.
	 *
	 * The free tier is claimed here like any other — nothing is assumed on a
	 * company that has not chosen, which is why there is no implicit default.
	 */
	subscribe(plan: string) {
		return api.post<ApiResponse<{ subscription: AtsSubscription }>>('/ats/subscription', {
			plan
		});
	},

	openings() {
		return api.get<ApiResponse<{ openings: Opening[] }>>('/ats/openings');
	},

	openPosition(input: OpeningInput) {
		return api.post<ApiResponse<{ opening: Opening }>>('/ats/openings', input);
	},

	closePosition(id: string) {
		return api.post<ApiResponse<{ opening: Opening }>>(
			`/ats/openings/${encodeURIComponent(id)}/close`,
			{}
		);
	},

	/**
	 * The pipeline of one opening: its stages, and the gaps.
	 *
	 * `gaps` comes back alongside and is the useful half — a pipeline with
	 * nobody in the middle stages is a pipeline that is not moving, and the
	 * stage counts alone would not say so.
	 */
	pipeline(id: string) {
		return api.get<ApiResponse<{ stages: unknown[]; gaps: unknown }>>(
			`/ats/openings/${encodeURIComponent(id)}/pipeline`
		);
	},

	addCandidate(openingId: string, input: CandidateInput) {
		return api.post<ApiResponse<{ candidate_id: string }>>(
			`/ats/openings/${encodeURIComponent(openingId)}/candidates`,
			input
		);
	},

	/**
	 * Move a candidate to another stage, optionally saying why.
	 *
	 * The reason is worth asking for on a rejection: a pipeline that records
	 * only movement cannot tell anybody later why somebody was passed over,
	 * and that is the question that comes back.
	 */
	moveCandidate(candidateId: string, toStageId: string, reason?: string) {
		return api.post<ApiResponse<unknown>>(
			`/ats/candidates/${encodeURIComponent(candidateId)}/move`,
			{ to_stage_id: toStageId, ...(reason ? { reason } : {}) }
		);
	}
};

/** Whether an opening is still taking candidates. */
export function openingIsOpen(o: Opening): boolean {
	return o.closed_at === null;
}
