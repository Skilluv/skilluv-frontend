/**
 * The quality domain: defect reports, imported test runs, and who may judge
 * either.
 *
 * ## Who reviews what, and why it is not an admin
 *
 * A defect report is judged by `quality_reviewer:{reviewer_group}`, derived
 * from the trade on the slice. Routing on the trade rather than the subtype is
 * deliberate: a defect report against a game build and one against an API are
 * both `bug_report`, and the two people who can read them are different.
 *
 * Administrators reach these through `quality_reviewer:all`, granted like
 * anybody else, rather than a bypass — so the review record says which trade
 * decided instead of "an admin decided".
 *
 * A surface built on this must not offer the review action on the strength of
 * being an admin. `review-queue` already answers with what the caller may
 * judge; that answer is the authority, not a role check in the client.
 *
 * ## The two figures a test run carries
 *
 * `verified_at` and `figures_source`. A run nobody verified is a green badge
 * on a repository the reporter controls, and the profile record only lists the
 * verified ones. Any surface showing an unverified run has to say so.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** One defect somebody reported against a slice. */
export interface BugReport {
	id: string;
	slice_id: string;
	reporter_user_id: string;
	title: string;
	repro_steps_md: string;
	expected_md: string;
	observed_md: string;
	/** Free-form: browser, OS, build, device. The backend does not read it. */
	environment: Record<string, unknown>;
	severity: string;
	reproducibility: string;
	attachment_urls: string[];
	fix_url: string | null;
	fix_confirmed_at: string | null;
	reviewed_at: string | null;
	/** Set when a reviewer disagreed with the reporter's own severity. */
	severity_adjusted_to: string | null;
	rejected_reason: string | null;
	created_at: string;
}

export interface BugReportInput {
	slice_id: string;
	title: string;
	repro_steps_md: string;
	expected_md: string;
	observed_md: string;
	environment: Record<string, unknown>;
	severity: string;
	reproducibility: string;
	attachment_urls?: string[];
}

/**
 * A reviewer's verdict.
 *
 * `severity_adjusted_to` is the interesting one: a reviewer may accept a
 * report and still disagree about how bad it is, and the record keeps both
 * readings rather than overwriting the reporter's.
 */
export interface ReviewDecision {
	decision: string;
	severity_adjusted_to?: string;
	reason?: string;
}

/** A test run imported from somewhere it actually ran. */
export interface TestRun {
	id: string;
	slice_id: string;
	source: string;
	report_url: string;
	commit_sha: string | null;
	repository_url: string | null;
	tests_total: number;
	tests_failed: number;
	tests_skipped: number;
	duration_seconds: number | null;
	coverage_percent: string | null;
	/** Null until somebody checked it. Until then the figures are a claim. */
	verified_at: string | null;
	imported_at: string;
	figures_source: string;
}

export interface TestRunInput {
	slice_id: string;
	source: string;
	report_url: string;
	commit_sha?: string;
	repository_url?: string;
	tests_total: number;
	tests_failed: number;
	tests_skipped: number;
	duration_seconds?: number;
	coverage_percent?: string;
}

/** The vocabulary this domain uses, served rather than hardcoded. */
export interface QualityReference {
	orientations: {
		slug: string;
		name: string;
		description: string;
		reviewer_group: string;
		tags: string[];
		secondary_domains: string[];
	}[];
	reviewer_groups: string[];
	report_subtypes: string[];
	severities: string[];
	reproducibilities: string[];
	test_run_sources: string[];
}

export const qualityApi = {
	/**
	 * Severities, reproducibilities, sources and trades.
	 *
	 * Read rather than shipped as a constant: the vocabulary grows server-side,
	 * and a form offering a severity the validator has stopped accepting puts
	 * the refusal on the person filling it in.
	 */
	reference() {
		return api.get<ApiResponse<QualityReference>>('/quality/reference');
	},

	/** Published reports, optionally narrowed to the domain they target. */
	reports(params?: { target_domain?: string; limit?: number }) {
		return api.get<ApiResponse<{ reports: BugReport[] }>>('/quality/reports', params);
	},

	/** The caller's own reports. */
	myBugs() {
		return api.get<ApiResponse<{ reports: BugReport[] }>>('/quality/bugs');
	},

	fileBug(input: BugReportInput) {
		return api.post<ApiResponse<{ report: BugReport }>>('/quality/bugs', input);
	},

	/**
	 * Link the fix. The reporter's act, on their own open report.
	 *
	 * Note the direction: the person who found it says where it was fixed, and
	 * somebody else confirms. A single actor doing both would make a defect
	 * record self-certifying.
	 */
	linkFix(id: string, fixUrl: string) {
		return api.post<ApiResponse<{ report: BugReport }>>(
			`/quality/bugs/${encodeURIComponent(id)}/fix`,
			{ fix_url: fixUrl }
		);
	},

	/** Confirm a linked fix actually shipped. */
	confirmFix(id: string) {
		return api.post<ApiResponse<{ report: BugReport }>>(
			`/quality/bugs/${encodeURIComponent(id)}/confirm`,
			{}
		);
	},

	/** Judge a report, as a reviewer of its trade. 403 for anybody else. */
	review(id: string, decision: ReviewDecision) {
		return api.post<ApiResponse<{ report: BugReport }>>(
			`/quality/bugs/${encodeURIComponent(id)}/review`,
			decision
		);
	},

	/**
	 * What this caller may judge.
	 *
	 * The authority on whether to offer the review action at all — a client
	 * deciding from a role would offer it on trades the server will refuse.
	 */
	reviewQueue() {
		return api.get<ApiResponse<{ reports: BugReport[] }>>('/quality/bugs/review-queue');
	},

	importRun(input: TestRunInput) {
		return api.post<ApiResponse<{ run: TestRun }>>('/quality/test-runs', input);
	},

	sliceRuns(sliceId: string) {
		return api.get<ApiResponse<{ runs: TestRun[] }>>(
			`/quality/slices/${encodeURIComponent(sliceId)}/test-runs`
		);
	},

	/** Vouch that a run's figures match its report. */
	verifyRun(id: string) {
		return api.post<ApiResponse<{ run: TestRun }>>(
			`/quality/test-runs/${encodeURIComponent(id)}/verify`,
			{}
		);
	}
};

/** Whether a report has been through review, whichever way it went. */
export function isReviewed(r: BugReport): boolean {
	return r.reviewed_at !== null;
}

/**
 * The severity that counts: a reviewer's adjustment where there is one, the
 * reporter's reading otherwise.
 *
 * Both are kept on the row, and a surface showing only the adjusted one hides
 * that somebody disagreed — which is exactly what the pair is for.
 */
export function effectiveSeverity(r: BugReport): string {
	return r.severity_adjusted_to ?? r.severity;
}
