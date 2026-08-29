/**
 * The ops domain: service objectives, incidents, and cost work.
 *
 * Three kinds of evidence that an operations person actually operated
 * something, and each is careful about a different thing.
 *
 * ## An objective belongs to something
 *
 * `declare_objective` refuses one with neither a slice nor a project, and says
 * why: *"a target floating on its own is a promise about nothing"*. So a form
 * built on this asks what the objective is about before it asks for a number.
 *
 * ## An incident cannot start in the future
 *
 * The backend refuses a `started_at` ahead of now, because resolving stamps
 * `NOW()` and a future start would produce a negative time-to-resolve — a
 * typo becoming a metric.
 *
 * ## Cost work is not attested by its own figures
 *
 * `record_cost_work` returns the annual saving and the reduction percentage
 * **computed server-side**, plus a note saying the reduction is only attested
 * once somebody verified the service still meets its objective. Halving a bill
 * by turning the service off is a saving and not an achievement, which is what
 * `service_still_meets_slo` exists to separate.
 *
 * Every money and percentage figure is a decimal string. Formatting happens at
 * the edge; arithmetic on them here is how a figure drifts from its record.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** A service level somebody committed to and can be held to. */
export interface Objective {
	id: string;
	owner_user_id: string;
	service_name: string;
	target_percent: string;
	window_days: number;
	achieved_percent: string | null;
	evidence_url: string | null;
	started_on: string;
	closed_at: string | null;
	/** Null until somebody other than the owner checked it. */
	verified_at: string | null;
	/** What an outside observer measured, where one did. */
	public_observation: Record<string, unknown> | null;
	public_observed_at: string | null;
}

export interface ObjectiveInput {
	service_name: string;
	target_percent: string;
	window_days: number;
	/** One of these two is required — an objective belongs to something. */
	slice_id?: string;
	project_id?: string;
	started_on?: string;
}

export interface Incident {
	id: string;
	project_id: string | null;
	commander_user_id: string;
	title: string;
	severity: string;
	time_to_detect_minutes: number | null;
	time_to_resolve_minutes: number | null;
	started_at: string;
	resolved_at: string | null;
	postmortem_published_at: string | null;
}

export interface IncidentInput {
	title: string;
	severity: string;
	/** Refused if it is in the future: resolving stamps now, and the pair
	 * would produce a negative duration. */
	started_at: string;
	project_id?: string;
}

export interface CostWork {
	id: string;
	owner_user_id: string;
	scope: string;
	monthly_before: string;
	monthly_after: string;
	currency: string;
	measured_over_days: number;
	/**
	 * Whether the service still meets its objective after the change. Null
	 * until checked — and the distinction that separates a saving from an
	 * achievement.
	 */
	service_still_meets_slo: boolean | null;
	verified_at: string | null;
}

export interface CostInput {
	scope: string;
	monthly_before: string;
	monthly_after: string;
	change_md: string;
	currency?: string;
	evidence_url?: string;
	measured_over_days?: number;
	slice_id?: string;
	project_id?: string;
}

export interface OpsReference {
	orientations: {
		slug: string;
		name: string;
		description: string;
		reviewer_group: string;
		tags: string[];
	}[];
	reviewer_groups: string[];
	artifact_subtypes: string[];
	severities: string[];
}

/** The five answers the ops onboarding asks for. */
export interface OpsWizardAnswers {
	level: string;
	/** Two at most; the server refuses a third. */
	trades: string[];
	cloud_experience: string[];
	weekly_hours: string;
	objective: string;
	oncall_experience: string;
}

export const opsApi = {
	/** Trades, reviewer groups, subtypes and severities. Served, not hardcoded. */
	reference() {
		return api.get<ApiResponse<OpsReference>>('/ops/reference');
	},

	/**
	 * Answer the ops onboarding.
	 *
	 * Returns a `recommendation` rather than just recording the answers, which
	 * is the point of asking: somebody who has just said what they do should be
	 * told what to do next, in the same breath.
	 */
	completeOnboarding(answers: OpsWizardAnswers) {
		return api.post<ApiResponse<{ recommendation: unknown }>>('/ops/onboarding', answers);
	},

	/** Skip it, recorded as a skip rather than as empty answers. */
	skipOnboarding() {
		return api.post<ApiResponse<{ skipped: boolean }>>('/ops/onboarding/skip', {});
	},

	objectives() {
		return api.get<ApiResponse<{ objectives: Objective[] }>>('/ops/objectives');
	},

	declareObjective(input: ObjectiveInput) {
		return api.post<ApiResponse<{ objective: Objective }>>('/ops/objectives', input);
	},

	/**
	 * Close an objective with what it actually achieved, and the evidence.
	 *
	 * Both are required. A closed objective with no evidence is the owner's
	 * word about their own target, which is precisely the claim this domain
	 * exists to replace.
	 */
	closeObjective(id: string, achievedPercent: string, evidenceUrl: string) {
		return api.post<ApiResponse<{ objective: Objective }>>(
			`/ops/objectives/${encodeURIComponent(id)}/close`,
			{ achieved_percent: achievedPercent, evidence_url: evidenceUrl }
		);
	},

	incidents() {
		return api.get<ApiResponse<{ incidents: Incident[] }>>('/ops/incidents');
	},

	openIncident(input: IncidentInput) {
		return api.post<ApiResponse<{ incident: Incident }>>('/ops/incidents', input);
	},

	resolveIncident(
		id: string,
		body: { time_to_detect_minutes?: number; time_to_resolve_minutes?: number }
	) {
		return api.post<ApiResponse<{ incident: Incident }>>(
			`/ops/incidents/${encodeURIComponent(id)}/resolve`,
			body
		);
	},

	/** A follow-up action, with an owner and a date it is due. */
	addAction(id: string, body: { description: string; owner_user_id?: string; due_on?: string }) {
		return api.post<ApiResponse<unknown>>(
			`/ops/incidents/${encodeURIComponent(id)}/actions`,
			body
		);
	},

	publishPostmortem(id: string, postmortemMd: string, url?: string) {
		return api.post<ApiResponse<{ incident: Incident }>>(
			`/ops/incidents/${encodeURIComponent(id)}/postmortem`,
			{ postmortem_md: postmortemMd, ...(url ? { url } : {}) }
		);
	},

	/**
	 * Record a cost reduction.
	 *
	 * The response carries `annual_saving` and `reduction_percent` computed
	 * server-side, and a `note` saying the reduction is only attested once the
	 * service is verified to still meet its objective. Render both: the figures
	 * are the server's arithmetic and not the client's, and the note is the
	 * difference between a saving and an achievement.
	 */
	recordCostWork(input: CostInput) {
		return api.post<
			ApiResponse<{
				cost_work: CostWork;
				annual_saving: string;
				reduction_percent: string;
				note?: string;
			}>
		>('/ops/cost-work', input);
	}
};

/** Whether an incident is over. */
export function isResolved(i: Incident): boolean {
	return i.resolved_at !== null;
}

/**
 * Whether an objective was met, where it has been closed.
 *
 * Null while it is still running — which is not the same as "not met", and a
 * surface rendering an open objective as a failure would be reading a
 * commitment as a verdict before its window closed.
 */
export function objectiveMet(o: Objective): boolean | null {
	if (o.achieved_percent === null) return null;
	const achieved = Number(o.achieved_percent);
	const target = Number(o.target_percent);
	if (!Number.isFinite(achieved) || !Number.isFinite(target)) return null;
	return achieved >= target;
}
