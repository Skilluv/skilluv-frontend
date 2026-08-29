/**
 * SKI-325 — the three shapes of work that are neither a mission nor a
 * challenge.
 *
 * A **studio** is a standing team with a day rate. A **living lab** is a
 * company paying a community to keep using and reporting on its product,
 * monthly. A **proposal** is somebody saying "this problem exists and here is
 * how I would solve it" before anybody has commissioned anything.
 *
 * All three were served and read by nothing, which made the platform look like
 * it only knew two ways to work: alone on a challenge, or hired for a mission.
 *
 * ## Why a proposal is not a mission
 *
 * A mission starts with a company that has decided. A proposal starts with a
 * contributor who has noticed, and goes looking for the company. The direction
 * is reversed, and so is who carries the risk — which is why
 * `facilitation_percent` exists on the row and why a proposal has an
 * `initiator_user_id` where a mission has an enterprise.
 *
 * ## What is enterprise-side and not here
 *
 * `POST /proposals/{id}/interest` is a **company** saying it has the problem.
 * It belongs to the enterprise console. What is here is the contributor's
 * half: draft, name collaborators, answer being named, publish.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** A standing team that sells days rather than deliverables. */
export interface Studio {
	id: string;
	slug: string;
	name: string;
	specialization: string;
	domains: string[];
	day_rate: string;
	currency: string;
	max_members: number;
	lead_user_id: string | null;
	status: string;
	formed_at: string;
}

export interface StudioMember {
	[key: string]: unknown;
}

/** A company paying a community to keep using and reporting on its product. */
export interface Lab {
	id: string;
	enterprise_id: string;
	product_name: string;
	scope_md: string;
	community_target: number;
	activity_types: string[];
	monthly_fee: string;
	monthly_reward_pool: string;
	currency: string;
	status: string;
	created_at: string;
}

/** Work somebody proposed before anybody commissioned it. */
export interface Proposal {
	id: string;
	slug: string;
	initiator_user_id: string;
	studio_id: string | null;
	title: string;
	problem_md: string;
	approach_md: string;
	evidence: unknown;
	budget_estimate: string | null;
	currency: string;
	target_industries: string[];
	target_enterprise_ids: string[];
	/** Skilluv's cut for putting the two sides in a room. */
	facilitation_percent: string;
	status: string;
	created_at: string;
}

/**
 * A company asking for proposals rather than hiring for a defined job.
 *
 * The mirror image of a proposal: here the enterprise has the problem and is
 * looking for an approach, where a proposal has somebody with the approach
 * looking for the problem. Both exist because work starts from either end.
 */
export interface Rfp {
	id: string;
	slug: string;
	enterprise_id: string;
	title: string;
	context_md: string;
	desired_outcome_md: string;
	budget_min: string;
	budget_max: string;
	currency: string;
	proposal_deadline: string;
	selection_deadline: string;
	visibility: string;
	/** Skilluv's cut, stated on the row rather than discovered at payment. */
	facilitation_fee: string;
	status: string;
	created_at: string;
}

export const workApi = {
	/**
	 * A company says it has the problem a proposal describes.
	 *
	 * The enterprise half of a proposal, kept here because the two sides read
	 * the same row and splitting the module would mean two definitions of what a
	 * proposal is.
	 */
	registerInterest(proposalId: string, noteMd?: string) {
		return api.post<ApiResponse<unknown>>(
			`/proposals/${encodeURIComponent(proposalId)}/interest`,
			noteMd ? { note_md: noteMd } : {}
		);
	},

	/** Calls for proposals somebody may answer. */
	rfps() {
		return api.get<ApiResponse<{ rfps: Rfp[] }>>('/rfps');
	},

	/** The proposals already filed against one, where the caller may see them. */
	rfpProposals(id: string) {
		return api.get<ApiResponse<{ proposals: unknown[] }>>(
			`/rfps/${encodeURIComponent(id)}/proposals`
		);
	},

	/** Every studio. Public. */
	studios() {
		return api.get<ApiResponse<{ studios: Studio[] }>>('/studios');
	},

	/** One studio and who is in it. */
	studio(id: string) {
		return api.get<ApiResponse<{ studio: Studio; members: StudioMember[] }>>(
			`/studios/${encodeURIComponent(id)}`
		);
	},

	/** Labs currently recruiting. Public. */
	labs() {
		return api.get<ApiResponse<{ labs: Lab[] }>>('/labs');
	},

	joinLab(id: string) {
		return api.post<ApiResponse<unknown>>(`/labs/${encodeURIComponent(id)}/join`, {});
	},

	/**
	 * Report something to a lab.
	 *
	 * `activity_type` has to be one the lab wants — anything else is refused,
	 * so a caller offers the lab's own list rather than a free-text field.
	 */
	contribute(id: string, body: { activity_type: string; summary_md: string }) {
		return api.post<ApiResponse<unknown>>(
			`/labs/${encodeURIComponent(id)}/contributions`,
			body
		);
	},

	/**
	 * Proposals the caller may see.
	 *
	 * Optionally authenticated, and what comes back differs: a company sees the
	 * ones aimed at it, everybody sees the published ones. So this is not a
	 * public list with a private extra — it is one list whose contents depend
	 * on who asks, and a client must not cache it across sessions.
	 */
	proposals() {
		return api.get<ApiResponse<{ proposals: Proposal[] }>>('/proposals');
	},

	/** Draft a proposal. Draft, not published — publishing is its own call. */
	draftProposal(input: {
		slug: string;
		title: string;
		problem_md: string;
		approach_md: string;
		studio_id?: string;
		budget_estimate?: string;
		target_industries?: string[];
	}) {
		return api.post<ApiResponse<unknown>>('/proposals', input);
	},

	/** Name somebody on a proposal. They still have to answer for themselves. */
	addMember(id: string, userId: string, role: string) {
		return api.post<ApiResponse<unknown>>(`/proposals/${encodeURIComponent(id)}/members`, {
			user_id: userId,
			role
		});
	},

	/** Somebody named on a proposal answers for themselves. */
	respondToProposal(id: string, accept: boolean) {
		return api.post<ApiResponse<{ accepted: boolean }>>(
			`/proposals/${encodeURIComponent(id)}/respond`,
			{ accept }
		);
	},

	/** Send it out. Separate from drafting on purpose. */
	publishProposal(id: string) {
		return api.post<ApiResponse<unknown>>(`/proposals/${encodeURIComponent(id)}/publish`, {});
	}
};
