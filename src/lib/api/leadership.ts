/**
 * The leadership domain: redaction, retrospectives, coordination, cohorts.
 *
 * ## Three different answers to "who may do this"
 *
 * The difference is the design, and a surface that flattens it gets the
 * feature wrong.
 *
 * **Reviewing** an artefact is guarded by the trade behind the slice —
 * `leadership_reviewer:{reviewer_group}`. Somebody who can read a delivery
 * plan cannot necessarily read a curriculum.
 *
 * **Acknowledging** a commitment is guarded by nothing except not being the
 * author. It is a person saying "yes, my project agreed to that", and a
 * capability gate on it would mean a plan could only be agreed to by people
 * senior enough to have the capability — which is not who agrees to plans.
 *
 * **Redaction** is two acts by two people: the author *declares* an artefact
 * anonymised, a reviewer *confirms* it. One actor doing both would make an
 * anonymisation self-certifying, and the whole point is that somebody else
 * read it and did not recognise anybody.
 *
 * ## What a leadership artefact is evidence of
 *
 * Not that a document was written — that something happened because of it.
 * Hence `adoption` (somebody else ran with it), `links` with an
 * `acknowledged_at` (a project agreed it applied to them), and retrospective
 * actions with a `done_at`. A retrospective whose actions nobody resolved is a
 * meeting, and the follow-through figure is what separates the two.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface Retrospective {
	id: string;
	slice_id: string | null;
	facilitator_user_id: string;
	title: string;
	format: string;
	format_note: string | null;
	participants_count: number;
	held_on: string;
	insights_md: string;
	/**
	 * Null until the facilitator sent it back to the room. A retrospective
	 * whose insights never reached the people in it is a private note.
	 */
	shared_with_participants_at: string | null;
	created_at: string;
}

export interface RetrospectiveInput {
	slice_id?: string;
	title: string;
	format: string;
	format_note?: string;
	participants_count: number;
	held_on: string;
	insights_md: string;
}

export interface RetrospectiveAction {
	id: string;
	retrospective_id: string;
	description: string;
	owner_user_id: string | null;
	/** A name for an owner who is not on Skilluv. */
	owner_label: string | null;
	due_on: string | null;
	done_at: string | null;
	/** Set when an action was dropped rather than done — and why. */
	abandoned_reason: string | null;
	created_at: string;
}

export interface ActionInput {
	description: string;
	owner_user_id?: string;
	owner_label?: string;
	due_on?: string;
}

/** A leadership artefact pointed at a project it applies to. */
export interface ArtifactLink {
	id: string;
	leadership_slice_id: string;
	linked_project_id: string;
	link_kind: string;
	note: string | null;
	/**
	 * Null until somebody on the linked project agreed. An unacknowledged link
	 * is a claim about somebody else's project, and rendering it as reach
	 * would let anybody attach themselves to any work.
	 */
	acknowledged_at: string | null;
	created_at: string;
}

export interface LeadershipReference {
	orientations: {
		slug: string;
		name: string;
		description: string;
		reviewer_group: string;
		tags: string[];
		secondary_domains: string[];
	}[];
	reviewer_groups: string[];
	artifact_subtypes: string[];
	redaction_states: string[];
	retrospective_formats: string[];
	link_kinds: string[];
	cohort_leave_reasons: string[];
}

export const leadershipApi = {
	/** Trades, formats, link kinds and leave reasons. Served, not hardcoded. */
	reference() {
		return api.get<ApiResponse<LeadershipReference>>('/leadership/reference');
	},

	/** The author says an artefact is anonymised. Half of the act. */
	declareRedaction(sliceId: string) {
		return api.post<ApiResponse<{ declared: boolean }>>(
			`/leadership/slices/${encodeURIComponent(sliceId)}/redaction/declare`,
			{}
		);
	},

	/**
	 * A reviewer confirms it. The other half, and it needs a different person.
	 *
	 * 403 without a leadership review capability. This is also what an
	 * attestation on the artefact was waiting for.
	 */
	confirmRedaction(sliceId: string) {
		return api.post<ApiResponse<unknown>>(
			`/leadership/slices/${encodeURIComponent(sliceId)}/redaction/confirm`,
			{}
		);
	},

	/** Record that somebody else ran with it, with evidence where there is any. */
	recordAdoption(sliceId: string, evidenceUrl?: string) {
		return api.post<ApiResponse<unknown>>(
			`/leadership/slices/${encodeURIComponent(sliceId)}/adoption`,
			evidenceUrl ? { evidence_url: evidenceUrl } : {}
		);
	},

	/** How far an artefact reached, and which of it was agreed to. */
	links(sliceId: string) {
		return api.get<ApiResponse<{ reach: unknown }>>(
			`/leadership/slices/${encodeURIComponent(sliceId)}/links`
		);
	},

	linkProject(sliceId: string, linkedProjectId: string, linkKind: string, note?: string) {
		return api.post<ApiResponse<{ link: ArtifactLink }>>(
			`/leadership/slices/${encodeURIComponent(sliceId)}/links`,
			{ linked_project_id: linkedProjectId, link_kind: linkKind, ...(note ? { note } : {}) }
		);
	},

	/**
	 * Somebody on the linked project agrees it applies to them.
	 *
	 * Guarded by nothing but not being the author — a capability gate here
	 * would mean only senior people could agree to a plan, which is not who
	 * agrees to plans.
	 */
	acknowledgeLink(linkId: string) {
		return api.post<ApiResponse<unknown>>(
			`/leadership/links/${encodeURIComponent(linkId)}/acknowledge`,
			{}
		);
	},

	myRetrospectives() {
		return api.get<ApiResponse<{ retrospectives: Retrospective[] }>>(
			'/leadership/retrospectives'
		);
	},

	recordRetrospective(input: RetrospectiveInput) {
		return api.post<ApiResponse<{ retrospective: Retrospective }>>(
			'/leadership/retrospectives',
			input
		);
	},

	/**
	 * The actions from one retrospective, and the follow-through with them.
	 *
	 * `followthrough` comes back alongside and is the number that matters: a
	 * retrospective whose actions nobody resolved is a meeting. Render both.
	 */
	actions(retrospectiveId: string) {
		return api.get<
			ApiResponse<{ actions: RetrospectiveAction[]; followthrough: unknown }>
		>(`/leadership/retrospectives/${encodeURIComponent(retrospectiveId)}/actions`);
	},

	addAction(retrospectiveId: string, input: ActionInput) {
		return api.post<ApiResponse<{ action: RetrospectiveAction }>>(
			`/leadership/retrospectives/${encodeURIComponent(retrospectiveId)}/actions`,
			input
		);
	},

	/**
	 * Close an action — done, or abandoned with a reason.
	 *
	 * Abandoning with a reason is a first-class outcome rather than a failure
	 * to render. An action dropped because the problem went away is a good
	 * retrospective, and hiding it would push people to fake completion.
	 */
	resolveAction(actionId: string, abandonedReason?: string) {
		return api.post<ApiResponse<{ action: RetrospectiveAction }>>(
			`/leadership/actions/${encodeURIComponent(actionId)}/resolve`,
			abandonedReason ? { abandoned_reason: abandonedReason } : {}
		);
	},

	leadCohort(cohortId: string, body?: { curriculum_slice_id?: string; target_domain?: string }) {
		return api.post<ApiResponse<unknown>>(
			`/leadership/cohorts/${encodeURIComponent(cohortId)}/lead`,
			body ?? {}
		);
	},

	graduateMember(cohortId: string, memberId: string) {
		return api.post<ApiResponse<{ graduated: boolean }>>(
			`/leadership/cohorts/${encodeURIComponent(cohortId)}/graduate`,
			{ member_id: memberId }
		);
	},

	/**
	 * Record somebody leaving, with why.
	 *
	 * A cohort that only records graduations reports a completion rate of one
	 * hundred per cent. The reason is required for that reason.
	 */
	recordDeparture(cohortId: string, memberId: string, reason: string, note?: string) {
		return api.post<ApiResponse<unknown>>(
			`/leadership/cohorts/${encodeURIComponent(cohortId)}/departure`,
			{ member_id: memberId, reason, ...(note ? { note } : {}) }
		);
	},

	concludeCohort(cohortId: string, note?: string) {
		return api.post<ApiResponse<unknown>>(
			`/leadership/cohorts/${encodeURIComponent(cohortId)}/conclude`,
			note ? { note } : {}
		);
	},

	cohortOutcomes(cohortId: string) {
		return api.get<ApiResponse<{ outcomes: unknown }>>(
			`/leadership/cohorts/${encodeURIComponent(cohortId)}/outcomes`
		);
	}
};

/** Whether an action is still open — neither done nor abandoned. */
export function actionIsOpen(a: RetrospectiveAction): boolean {
	return a.done_at === null && a.abandoned_reason === null;
}

/** Whether an action is late, which is only meaningful while it is open. */
export function actionIsLate(a: RetrospectiveAction, now = new Date()): boolean {
	if (!actionIsOpen(a) || !a.due_on) return false;
	return new Date(a.due_on).getTime() < now.getTime();
}
