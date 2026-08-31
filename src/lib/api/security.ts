/**
 * The security domain, from a contributor's side.
 *
 * Eighteen endpoints, and the split between them is the module's whole shape:
 *
 * **Public and unauthenticated** — `reference`, `scope`, `hallOfFame`,
 * `findingCard`, `scoreboard`, `externalBounties`, `trustSummary` and a
 * `profile`. The backend's reason, in its own words: *a disclosure programme
 * that requires an account to read the scope is a programme nobody reads.*
 *
 * **Everything else needs a session**, because everything else is either
 * somebody's report or somebody's evidence.
 *
 * ## The upload comes before the report
 *
 * Proof files are uploaded first and referenced by key in the submission. That
 * is the shape of the form — you screenshot the exploit while you still have
 * it — and it is why the backend runs an orphan sweep. A key is not a URL: the
 * backend refuses to give a proof of an unfixed vulnerability a stable
 * address, and this module never builds one.
 *
 * ## What lives elsewhere
 *
 * `/users/{username}/security-profile` is read by `domainProfilesApi.security`,
 * next to the four sibling craft records. One client per endpoint: a second
 * would be a second place for the shape to drift.
 *
 * ## Nothing here triages
 *
 * A finding is triaged by `security_triager`, judged by
 * `security_reviewer:{family}` and published by an administrator. Those
 * transitions live on `/admin/security`, which is the admin front's business,
 * not this one's. The only transition a reporter owns is withdrawing their own
 * report, and answering a round a reviewer opened.
 */

import type {
	ApiResponse,
	BountyClaim,
	BountyProgramme,
	ClaimBountyRequest,
	FindingCard,
	FlagOutcome,
	HallOfFame,
	IssueTokenRequest,
	IssuedResearchToken,
	LabArtifact,
	LabOutcome,
	MyFinding,
	ResearchTokenView,
	ScoreboardRow,
	SecurityReference,
	SecurityScope,
	SubmitReportRequest,
	SubmittedReport,
	TrustSummary
} from '$lib/types';
import { createApiClient, csrfHeaders } from './client';
import { apiBase } from './origin';
import { tournamentApi } from './tournament';

const api = createApiClient();

export const securityApi = {
	// ─── The vocabulary, served rather than hardcoded ─────────────────

	/**
	 * Everything a client would otherwise hard-code: orientations, severity
	 * tiers, statuses, disclosure stages, challenge kinds, round kinds,
	 * attestation bases, and the fragments each severity is worth.
	 *
	 * The payout table is the reason to read this rather than mirror it. A page
	 * quoting a stale figure is a page making a promise the platform will not
	 * keep.
	 */
	reference() {
		return api.get<ApiResponse<SecurityReference>>('/security/reference');
	},

	/**
	 * The scope, machine-readable and unauthenticated.
	 *
	 * The same list that refuses a submission is what is served here, so the
	 * document and the enforcement cannot drift. Anything rendering it must not
	 * paraphrase: an out-of-scope rule restated in the front's own words is a
	 * rule somebody can argue with.
	 */
	scope() {
		return api.get<ApiResponse<SecurityScope>>('/security/scope');
	},

	// ─── Reporting ────────────────────────────────────────────────────

	/**
	 * Report a vulnerability.
	 *
	 * Rate-limited to five an hour — enough for somebody having a very good
	 * afternoon, and the ceiling a declared research token multiplies. A 429
	 * here is the limit, not a failure, and should say so.
	 *
	 * Answers with `triage_due_by`, which is the promise the published policy
	 * makes and the reason somebody chose to report here rather than elsewhere.
	 * Show it back immediately.
	 */
	submitReport(payload: SubmitReportRequest) {
		return api.post<ApiResponse<{ report: SubmittedReport }>>('/security/reports', payload);
	},

	/** Every report the caller filed, newest first. */
	myReports() {
		return api.get<ApiResponse<{ reports: MyFinding[] }>>('/security/reports');
	},

	/**
	 * Take a report back.
	 *
	 * 409 once it is too late — a finding that has been triaged and acted on
	 * cannot be un-reported, and the refusal is the system working.
	 */
	withdrawReport(id: string) {
		return api.post<ApiResponse<{ status: string }>>(`/security/reports/${id}/withdraw`);
	},

	/**
	 * Answer what a reviewer asked for.
	 *
	 * 404 when no round of yours is open: rounds are opened by reviewers, and a
	 * reporter cannot start one.
	 */
	answerRound(id: string, answerMd: string) {
		return api.post<ApiResponse<{ round_no: number }>>(`/security/reports/${id}/answer-round`, {
			answer_md: answerMd
		});
	},

	// ─── Proofs ───────────────────────────────────────────────────────

	/**
	 * Upload one proof file and get back the key to put in the report.
	 *
	 * Multipart with a single `file` part, so this goes through `fetch`
	 * directly rather than the JSON client: a `Content-Type` set by hand would
	 * strip the boundary the browser generates.
	 *
	 * The key is not a URL and must never be rendered as a link.
	 */
	async uploadProof(file: File): Promise<{ key: string; note: string }> {
		const body = new FormData();
		body.append('file', file);
		const res = await fetch(`${apiBase()}/security/reports/uploads`, {
			method: 'POST',
			body,
			credentials: 'include',
			headers: csrfHeaders('POST')
		});
		const payload = await res.json();
		if (!res.ok) {
			throw new Error(payload?.error?.message ?? 'the upload was refused');
		}
		return payload.data;
	},

	/**
	 * A one-hour link to a proof, for whoever is allowed to see it.
	 *
	 * The key travels as a query parameter because it contains slashes. 403 for
	 * anybody who is neither the reporter nor a reviewer — which is most
	 * people, and is the point.
	 */
	proofUrl(key: string) {
		return api.get<ApiResponse<{ url: string; expires_in_seconds: number }>>('/security/proofs', {
			key
		});
	},

	// ─── Practice ─────────────────────────────────────────────────────

	/**
	 * Submit a captured flag.
	 *
	 * A wrong answer is a 200 with `correct: false`, not an error: it carries
	 * `attempts_left_this_hour` and sometimes a hint, and treating it as a
	 * failure would throw both away.
	 */
	submitFlag(challengeId: string, flag: string) {
		return api.post<ApiResponse<{ outcome: FlagOutcome }>>(
			`/security/challenges/${challengeId}/flag`,
			{ flag }
		);
	},

	/**
	 * Submit the answers to a graded lab.
	 *
	 * `wrong_question_ids` comes back without the right answers, which is what
	 * makes a retry worth anything.
	 */
	submitAnswers(challengeId: string, answers: Record<string, string>) {
		return api.post<ApiResponse<{ outcome: LabOutcome }>>(
			`/security/challenges/${challengeId}/answers`,
			{ answers }
		);
	},

	/**
	 * A signed link to a defensive lab's artefact.
	 *
	 * Minted per request and short-lived: the object key never leaves the
	 * server, because the same private bucket holds the proofs attached to
	 * unpublished findings, and a client that held a key could guess its way
	 * across it.
	 *
	 * The lab's questions are not served anywhere yet (SKI-332), so this is
	 * the whole of what a lab can offer today — the artefact to open in your
	 * own tools, which is the half that was always meant to happen off-platform.
	 */
	labArtifact(challengeId: string) {
		return api.get<ApiResponse<LabArtifact>>(
			`/security/challenges/${encodeURIComponent(challengeId)}/artifact`
		);
	},

	/** Who has solved what. Public. */
	scoreboard() {
		return api.get<ApiResponse<{ all_time: ScoreboardRow[]; [key: string]: unknown }>>(
			'/security/ctf/scoreboard'
		);
	},

	// ─── Competitions ─────────────────────────────────────────────────

	/**
	 * Cyber competitions — SKI-149.
	 *
	 * There is no competitions table. Migration 0554 seeded five rows into
	 * `tournament_kinds` instead: `sec_ctf_jeopardy`, `sec_attack_defence`,
	 * `sec_bug_bash`, `sec_purple_exercise`, `sec_code_audit_rally`. A cyber
	 * competition *is* a tournament, which is why it already has registration,
	 * a leaderboard, prizes and a room to publish live events into — none of it
	 * built twice.
	 *
	 * Narrowed on `skill_domain` rather than on `kind`: the endpoint takes one
	 * kind and there are five, and a domain filter also returns the contests
	 * open to every domain — which a purple exercise or a bug bash often is.
	 * Grouping by kind afterwards is presentation, not filtering, so nothing
	 * falls out of the list on the way.
	 */
	competitions(params?: { status?: string; upcoming?: boolean; limit?: number }) {
		return tournamentApi.list({ skill_domain: 'security', ...params });
	},

	// ─── Reading what was found ───────────────────────────────────────

	/**
	 * One finding, as a stranger may read it.
	 *
	 * Everything identifying the defect is withheld until publication. A
	 * surface rendering this must not treat a null `title` as missing data: it
	 * is the embargo working.
	 */
	findingCard(id: string) {
		return api.get<ApiResponse<{ finding: FindingCard }>>(`/security/findings/${id}`);
	},

	/** The hall of fame. Cached server-side: it is a heavy read of a slowly
	 * changing set, and the page a disclosure gets shared to. */
	hallOfFame() {
		return api.get<ApiResponse<HallOfFame>>('/security/hall-of-fame');
	},

	/**
	 * The trust centre's figures.
	 *
	 * The same rows the hall of fame reads, plus what the platform says about
	 * itself. One source, so two pages cannot quote different numbers — the
	 * failure a trust page most needs to avoid, and the reason nothing here
	 * recomputes a statistic locally.
	 */
	trustSummary() {
		return api.get<ApiResponse<TrustSummary>>('/trust/summary');
	},

	// ─── Elsewhere ────────────────────────────────────────────────────

	/**
	 * Curated public bounty programmes.
	 *
	 * The response carries a `note` saying they are curated and not endorsed —
	 * this platform runs none of them — and every surface renders it. Showing a
	 * third-party programme as a Skilluv one would put us behind terms nobody
	 * here has read.
	 */
	externalBounties(params?: { platform?: string; topic?: string; paid_only?: boolean }) {
		return api.get<ApiResponse<{ programmes: BountyProgramme[]; note: string }>>(
			'/security/external-bounties',
			params
		);
	},

	/** Claims the caller filed for work done on another platform. */
	myBountyClaims() {
		return api.get<ApiResponse<{ claims: BountyClaim[] }>>('/security/external-bounties/claims');
	},

	/** Claim a bounty earned elsewhere. Stays `waiting` until a reviewer opens
	 * the report URL: the claimant's word is not the check. */
	claimBounty(payload: ClaimBountyRequest) {
		return api.post<ApiResponse<{ claim: BountyClaim }>>(
			'/security/external-bounties/claims',
			payload
		);
	},

	// ─── Research mode ────────────────────────────────────────────────

	/** The live token, minus the secret. */
	researchToken() {
		return api.get<ApiResponse<{ token: ResearchTokenView | null }>>('/security/research-token');
	},

	/**
	 * Issue a research token, replacing any live one.
	 *
	 * The plaintext comes back once and is never readable again. Any surface
	 * showing it must make copying obvious, because a reload loses it.
	 */
	issueResearchToken(payload?: IssueTokenRequest) {
		return api.post<ApiResponse<IssuedResearchToken>>('/security/research-token', payload ?? {});
	},

	/** Revoke it. */
	revokeResearchToken() {
		return api.delete<void>('/security/research-token');
	}
};

/**
 * Order findings worst-first.
 *
 * A severity is a word, not a number, and sorting it alphabetically puts
 * `critical` after `high` — which is how a triage queue starts being worked in
 * the wrong order.
 */
export const SEVERITY_ORDER: Record<string, number> = {
	critical: 0,
	high: 1,
	medium: 2,
	low: 3,
	informational: 4
};

export function bySeverity<T extends { severity_tier: string }>(rows: T[]): T[] {
	return [...rows].sort(
		(a, b) => (SEVERITY_ORDER[a.severity_tier] ?? 99) - (SEVERITY_ORDER[b.severity_tier] ?? 99)
	);
}

/**
 * The severity a hall-of-fame row's numeric `top_severity` stands for.
 *
 * The backend ranks 5 for critical down to 1 for informational, as a sort key.
 * Turning it back into a word is this function's whole job, and it returns
 * null rather than guessing on a value it does not know.
 */
export function severityFromRank(rank: number): string | null {
	return { 5: 'critical', 4: 'high', 3: 'medium', 2: 'low', 1: 'informational' }[rank] ?? null;
}

/** Whether a finding's details are readable yet. */
export function isPublished(finding: { status: string }): boolean {
	return finding.status === 'published';
}
