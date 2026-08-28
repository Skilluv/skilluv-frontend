/**
 * Types for the Skilluv Cyber programme (Linear SKI-116 … SKI-284).
 *
 * Four shapes the backend chose that every cyber surface follows:
 *
 * 1. **Three things are public and unauthenticated** — the scope, the hall of
 *    fame, and a finding's card. The backend's reason: "a disclosure
 *    programme that requires an account to read the scope is a programme
 *    nobody reads." Everything else is somebody's report or somebody's
 *    evidence.
 * 2. **A finding's card withholds the defect until publication.** No
 *    reproduction, no endpoint, no proof — only what a coordinated disclosure
 *    shows from outside. That is the claim an attestation on it makes, so it
 *    has to be readable; the rest must not be.
 * 3. **A cyber mission is a mission.** `/missions` carries `skill_domain`,
 *    exactly as it does for design. There is no parallel cyber marketplace.
 * 4. **The vocabulary is served, not hardcoded.** `GET /security/reference`
 *    exists so a client does not keep its own copy of the severity tiers, the
 *    statuses or the challenge kinds. The constants below mirror it for
 *    typing and for ordering, never as the authority.
 */

// ---------------------------------------------------------------------------
// The vocabulary — mirrored from `GET /security/reference`
// ---------------------------------------------------------------------------

/** Ordered worst-first, which is the order every list of findings uses. */
export const SEVERITY_TIERS = ['critical', 'high', 'medium', 'low', 'informational'] as const;

export type SeverityTier = (typeof SEVERITY_TIERS)[number];

/**
 * A finding's lifecycle.
 *
 * `duplicate` and `not_applicable` are outcomes, not failures: a report that
 * turns out to duplicate a known issue was still work, and the UI must not
 * render either as an error state.
 */
export const FINDING_STATUSES = [
	'submitted',
	'triaged',
	'confirmed',
	'duplicate',
	'not_applicable',
	'withdrawn',
	'fixed',
	'published'
] as const;

export type FindingStatus = (typeof FINDING_STATUSES)[number];

/** How much of a confirmed finding is public yet. */
export const DISCLOSURE_STAGES = [
	'embargoed',
	'extension_requested',
	'partially_disclosed',
	'public',
	'withheld'
] as const;

export type DisclosureStage = (typeof DISCLOSURE_STAGES)[number];

export const CHALLENGE_KINDS = [
	'ctf_flag',
	'defensive_lab',
	'machine_walkthrough',
	'training_ground',
	'analysis_exercise',
	'audit_exercise'
] as const;

export type SecurityChallengeKind = (typeof CHALLENGE_KINDS)[number];

export const DIFFICULTY_TIERS = ['easy', 'medium', 'hard', 'insane'] as const;

export const SECURITY_SLICE_SUBTYPES = [
	'finding_hunt',
	'code_audit',
	'threat_model',
	'governance_review',
	'detection_engineering',
	'purple_exercise',
	'incident_analysis'
] as const;

/** One entry of a served vocabulary that carries prose with it. */
export interface SecurityReferenceEntry {
	slug: string;
	name: string;
	description: string;
}

export interface SecurityOrientation extends SecurityReferenceEntry {
	/** Which reviewer group judges this orientation's work. */
	reviewer_group: string | null;
	tags: string[];
	secondary_domains: string[];
}

export interface AttestationBasis {
	basis: string;
	title: string;
	description: string;
	requires_deliverable: boolean;
}

/**
 * Everything a client would otherwise hard-code.
 *
 * Read rather than assumed: `fragments_by_severity` in particular is a payout
 * table, and a page quoting a stale number is a page making a promise the
 * platform will not keep.
 */
export interface SecurityReference {
	orientations: SecurityOrientation[];
	severity_tiers: string[];
	finding_statuses: string[];
	disclosure_stages: string[];
	challenge_kinds: string[];
	difficulty_tiers: string[];
	slice_subtypes: string[];
	round_kinds: SecurityReferenceEntry[];
	attestation_bases: AttestationBasis[];
	fragments_by_severity: Record<string, number>;
	triage_sla_days: number;
}

// ---------------------------------------------------------------------------
// The scope — public, and the same list that refuses a submission
// ---------------------------------------------------------------------------

/**
 * How a declared researcher raises their own rate limit.
 *
 * The token grants nothing but headroom. Saying so on the page matters: a
 * researcher who believes a token authorises them to test out of scope is one
 * the safe harbour will not protect.
 */
export interface ResearchModeInfo {
	header: string;
	handle_header: string;
	multiplier: number;
	how: string;
}

export interface SecurityScope {
	in_scope_hosts: string[];
	policy_url: string;
	contact: string;
	triage_sla_days: number;
	default_embargo_days: number;
	/** Stated as prose, one line each. Rendered verbatim: a paraphrase of an
	 * out-of-scope rule is a rule somebody can argue with. */
	out_of_scope: string[];
	research_mode: ResearchModeInfo;
}

// ---------------------------------------------------------------------------
// Reporting a vulnerability
// ---------------------------------------------------------------------------

export interface SubmitReportRequest {
	title: string;
	description_md: string;
	reproduction_steps_md: string;
	impact_md?: string | null;
	proposed_fix_md?: string | null;
	target_kind: string;
	target_host?: string | null;
	mission_slug?: string | null;
	project_slug?: string | null;
	affected_endpoint?: string | null;
	cvss_vector?: string | null;
	severity_tier?: string | null;
	cwe_id?: string | null;
	/**
	 * Keys from `POST /security/reports/uploads`, not URLs. The backend is
	 * explicit: a proof of an unfixed vulnerability does not get a stable
	 * address.
	 */
	proof_keys: string[];
	/** Reported without a name on the hall of fame. Still credited privately. */
	anonymous: boolean;
}

export interface SubmittedReport {
	id: string;
	title: string;
	status: string;
	severity_tier: string;
	cvss_score: number | null;
	/** What the published policy promises. Shown back immediately, because the
	 * promise is the reason somebody chose to report here. */
	triage_due_by: string;
	triage_skipped: boolean;
}

/** A round a reviewer opened, waiting on the reporter. */
export interface FindingRound {
	round_no: number;
	kind: string;
	notes_md: string;
}

/** A report as its own reporter reads it. */
export interface MyFinding {
	id: string;
	title: string;
	status: string;
	severity_tier: string;
	/** What the reporter claimed, kept next to what triage decided. */
	severity_reported_tier: string | null;
	cvss_score: number | null;
	cwe_id: string | null;
	target_kind: string;
	target_host: string | null;
	disclosure_stage: string | null;
	embargo_ends_at: string | null;
	created_at: string;
	writeup_url: string | null;
	/** Null when nothing is waiting on the reporter. */
	open_round: FindingRound | null;
}

/** Who reported, or the stable alias of somebody who chose not to be named. */
export interface FindingReporter {
	username?: string;
	display_name?: string | null;
	avatar_url?: string | null;
	alias?: string;
}

/**
 * A finding as a stranger may read it.
 *
 * `title` and `description_md` are null until publication, on purpose: what is
 * shown before then is that somebody found something of this severity, in this
 * weakness class, on this date — the claim the attestation makes, and nothing
 * that would help anyone reproduce it.
 */
export interface FindingCard {
	id: string;
	title: string | null;
	status: string;
	severity_tier: string;
	cvss_score: number | null;
	cwe_id: string | null;
	confirmed_at: string | null;
	published_at: string | null;
	writeup_url: string | null;
	disclosure_stage: string | null;
	reporter: FindingReporter;
	description_md?: string | null;
}

// ---------------------------------------------------------------------------
// The hall of fame, and the trust centre that quotes the same rows
// ---------------------------------------------------------------------------

export interface HallOfFameContributor {
	reporter: FindingReporter;
	findings: number;
	/** 5 for critical down to 1 for informational — a sort key, not a label. */
	top_severity: number;
	first_finding_at: string;
	rank: string | null;
}

export interface HallOfFameFinding {
	id: string;
	title: string;
	severity_tier: string;
	published_at: string;
	writeup_url: string | null;
	reporter: FindingReporter;
}

export interface SecurityStats {
	confirmed: number;
	published: number;
	fixed: number;
	by_severity: Record<string, number> | null;
	/** NUMERIC over JSON. Null while nothing has been published. */
	median_days_to_publication: string | null;
	reporters: number;
}

export interface HallOfFame {
	top_contributors: HallOfFameContributor[];
	recent_findings: HallOfFameFinding[];
	stats: SecurityStats;
}

/** What the platform says about itself, honestly. */
export interface ComplianceClaim {
	framework: string;
	/** `self_assessed`, `not_started`, … An unaudited claim says so. */
	state: string;
	note?: string;
}

/**
 * The trust centre's figures.
 *
 * The same rows the hall of fame reads, plus the platform's own claims. One
 * source, so two pages cannot quote different numbers — which is the failure a
 * trust page most needs to avoid.
 */
export interface TrustSummary {
	findings: SecurityStats;
	scope: string[];
	documents: Record<string, string>;
	compliance: ComplianceClaim[];
	contacts: Record<string, string>;
	disclosure_programme: {
		safe_harbour: boolean;
		default_embargo_days: number;
		triage_sla_days: number;
		hall_of_fame: string;
		[key: string]: unknown;
	};
}

// ---------------------------------------------------------------------------
// Practice — CTF flags and defensive labs
// ---------------------------------------------------------------------------

/**
 * What came of a flag submission.
 *
 * `attempts_left_this_hour` is returned on a wrong answer as well as a right
 * one, so a page can say how many tries remain instead of letting somebody
 * discover the limit by hitting it.
 */
export interface FlagOutcome {
	correct: boolean;
	attempt_no: number;
	attempts_left_this_hour: number;
	first_solve: boolean;
	fragments_awarded: number;
	/** Set on a solve that earned an attestation. */
	attestation_code: string | null;
	/** Server-authored, and only on a wrong answer. */
	hint: string | null;
}

/**
 * What came of a graded lab.
 *
 * `wrong_question_ids` says which answers missed without saying what the right
 * ones are — the whole point of a graded exercise somebody may retry.
 */
export interface LabOutcome {
	correct_count: number;
	total_count: number;
	score_percent: number;
	passed: boolean;
	wrong_question_ids: string[];
	hints: string[];
	attempt_number: number;
	attempts_left: number;
	fragments_awarded: number;
	attestation_code: string | null;
}

/**
 * A signed link to a defensive lab's artefact.
 *
 * Minted per request rather than stored: the link expires, and the object key
 * it was signed from never reaches a client. `filename` is the object's own
 * name, so the browser's save dialog offers something meaningful rather than
 * a UUID.
 */
export interface LabArtifact {
	url: string;
	expires_in_seconds: number;
	size_bytes: number;
	filename: string;
}

export interface ScoreboardRow {
	username: string;
	display_name: string | null;
	avatar_url: string | null;
	solves: number;
	/** Solved before anybody else. The number a scoreboard is actually read
	 * for. */
	first_solves: number;
	last_solve_at: string;
}

// ---------------------------------------------------------------------------
// External bounty programmes, and what somebody claims elsewhere
// ---------------------------------------------------------------------------

/**
 * A curated public programme.
 *
 * The backend's note ships with the list and is rendered with it: "Curated,
 * not endorsed. This platform does not run any of these." Presenting a
 * third-party programme as a Skilluv one would put us behind terms we have not
 * read.
 */
export interface BountyProgramme {
	[key: string]: unknown;
	platform?: string;
	name?: string;
	url?: string;
}

export const BOUNTY_CLAIM_STATES = ['waiting', 'confirmed', 'refused'] as const;

export type BountyClaimState = (typeof BOUNTY_CLAIM_STATES)[number];

/**
 * Work somebody did on another platform, claimed here.
 *
 * Declared until a reviewer confirms it, and `state` carries which. A claim is
 * never a Skilluv proof: it is the same deal a GitHub profile gets.
 */
export interface BountyClaim {
	id: string;
	platform: string;
	organisation: string;
	report_url: string;
	claimed_severity: string;
	/** What a reviewer settled on, once one has. */
	severity: string | null;
	cwe_id: string | null;
	summary_md: string;
	disclosed_on: string | null;
	state: string;
	refused_reason: string | null;
	created_at: string;
}

export interface ClaimBountyRequest {
	platform: string;
	organisation_name: string;
	report_url: string;
	claimed_severity: string;
	cwe_id?: string | null;
	summary_md: string;
	disclosed_on?: string | null;
	program_id?: string | null;
}

// ---------------------------------------------------------------------------
// Research mode
// ---------------------------------------------------------------------------

/**
 * A live research token, minus the token.
 *
 * Only `token_prefix` is ever readable again: the secret is shown once at
 * issue. A page that pretends it can show it later teaches somebody not to
 * copy it.
 */
export interface ResearchTokenView {
	id: string;
	token_prefix: string;
	label: string | null;
	issued_at: string;
	expires_at: string;
	last_used_at: string | null;
	requests_seen: number;
}

export interface IssuedResearchToken {
	/** Shown once, and never again. */
	token: string;
	details: ResearchTokenView;
	header: string;
	note: string;
}

export interface IssueTokenRequest {
	label?: string | null;
	days?: number | null;
}

// ---------------------------------------------------------------------------
// Self-declared credentials
// ---------------------------------------------------------------------------

/**
 * A certification somebody says they hold.
 *
 * It arrives claimed and stays claimed until a reviewer opens the issuer's
 * page. The backend's reason is the one every surface repeats: the person
 * adding it is the person it belongs to, which is exactly why their word is
 * not the check. `verified_at` is the only field that turns it into evidence.
 *
 * `is_current` is computed from `expires_on`: a lapsed certification is a fact
 * about the past, shown as such rather than hidden — hiding it would let
 * somebody quietly drop a credential that expired badly.
 */
export interface DeclaredCredential {
	id: string;
	issuer: string;
	name: string;
	level: string;
	credential_id: string | null;
	/** A public link somebody else can open. Required: a credential nobody can
	 * check is a sentence. */
	evidence_url: string;
	issued_on: string;
	expires_on: string | null;
	verified_at: string | null;
	is_current: boolean;
}

export interface DeclareCredentialRequest {
	issuer: string;
	name: string;
	level?: string | null;
	credential_id?: string | null;
	evidence_url: string;
	issued_on: string;
	expires_on?: string | null;
}
