/**
 * The craft record of the five domains that were served and never read.
 *
 * `code`, `quality`, `ops`, `leadership` and `security` all answer
 * `/users/{username}/{domain}-profile` with a `CraftScore` **nested** — under
 * `score` for four of them, under `craft_score` for code — plus the sections
 * that are the substance of each trade.
 *
 * That is a third shape, after the design one (nested, its own sections) and
 * the flat ai/audio one in `craft.ts`. The divergence is a backend ticket of
 * its own; until it lands, the front reads all three rather than pretending
 * only one exists. `CraftScoreValue` below is the nested form, shared by six
 * of the eight domains and therefore the majority.
 */

import type { CraftTerm } from './craft';

/** The score object, as five domains and design return it. */
export interface CraftScoreValue {
	score: number;
	tier_slug: string;
	tier_name: string;
	tier_description: string;
	/** The score at which the next tier starts, absent at the top. */
	next_tier_at: number | null;
	breakdown: CraftTerm[];
	/** True when the total hit the ceiling, said rather than left to be inferred. */
	capped: boolean;
}

/** Domains served by a nested-score `{domain}-profile` endpoint. */
export const RECORD_DOMAINS = ['code', 'quality', 'ops', 'leadership', 'security'] as const;
export type RecordDomain = (typeof RECORD_DOMAINS)[number];

/** A trade claimed through an orientation. */
export interface DomainOrientation {
	slug: string;
	name: string;
	reviewer_group?: string | null;
	is_primary?: boolean;
}

/** An attestation, as every one of these profiles lists it. */
export interface DomainAttestation {
	basis: string | null;
	title: string;
	verification_code: string;
	issued_at: string;
}

/** How much verified work was aimed at each domain. */
export interface TargetDomainShare {
	target_domain: string;
	name: string | null;
	artefacts: number;
}

/** A certification somebody else issued. Never mixed into the attestations. */
export interface DomainCredential {
	issuer: string;
	name: string;
	level: string | null;
	evidence_url: string | null;
	issued_on: string | null;
	expires_on: string | null;
	/** Security only: whether anybody actually checked it. */
	verified?: boolean;
}

// ---------------------------------------------------------------------------
// code
// ---------------------------------------------------------------------------

export interface CodeLanguageShare {
	language: string;
	artefacts: number;
}

export interface PublishedPackage {
	registry: string;
	package_name: string;
	latest_version: string | null;
	downloads_recent: number | null;
	downloads_total: number | null;
	/**
	 * When the figures were last read. Shown, because a number with no date is
	 * a number nobody can weigh.
	 */
	fetched_at: string | null;
}

export interface CodePortfolio {
	platform: string;
	handle: string;
	profile_url: string;
	verified: boolean;
	repos_count: number | null;
	stars_received: number | null;
	followers_count: number | null;
	contributions_last_year: number | null;
}

export interface CodeProfile {
	username: string;
	/** Nested here under `craft_score`, unlike the four below. */
	craft_score: CraftScoreValue;
	/** What the sorted listings use, next to the live figure so a gap shows. */
	stored_score: number | null;
	stored_score_computed_at: string | null;
	orientations: DomainOrientation[];
	attestations: DomainAttestation[];
	languages: CodeLanguageShare[];
	published_packages: PublishedPackage[];
	missions_completed: { mission_type: string; count: number }[];
	portfolios: CodePortfolio[];
}

// ---------------------------------------------------------------------------
// quality
// ---------------------------------------------------------------------------

/**
 * A defect whose fix shipped and was re-checked.
 *
 * The reproduction is deliberately absent: a public list of reproductions for
 * defects in other people's products would be a disclosure channel nobody
 * agreed to. The fix link is there so a reader can go and see the change
 * rather than take the count's word for it.
 */
export interface ConfirmedBug {
	title: string;
	severity: string;
	/** Whether a reviewer adjusted the severity, or the reporter's stands. */
	severity_reviewed: boolean;
	reproducibility: string | null;
	fix_url: string | null;
	fix_confirmed_at: string;
}

/** A test run a reviewer verified. Never the unverified ones. */
export interface VerifiedTestRun {
	source: string;
	report_url: string | null;
	tests_total: number | null;
	tests_failed: number | null;
	coverage_percent: number | null;
	imported_at: string;
}

export interface QualityProfile {
	username: string;
	display_name: string | null;
	orientations: DomainOrientation[];
	score: CraftScoreValue;
	confirmed_bugs: ConfirmedBug[];
	target_domain_breakdown: TargetDomainShare[];
	attestations: DomainAttestation[];
	verified_test_runs: VerifiedTestRun[];
}

// ---------------------------------------------------------------------------
// ops
// ---------------------------------------------------------------------------

/** An objective held, with the figure and where it came from. */
export interface OpsObjective {
	service_name: string;
	target_percent: number;
	achieved_percent: number | null;
	window_days: number;
	evidence_url: string | null;
	met: boolean | null;
}

export interface OpsIncident {
	severity: string;
	time_to_detect_minutes: number | null;
	time_to_resolve_minutes: number | null;
	postmortem_published_at: string | null;
}

/** Money taken out, and whether the service still met its objective after. */
export interface OpsCostWork {
	scope: string;
	monthly_before: string | number | null;
	monthly_after: string | number | null;
	currency: string | null;
	service_still_meets_slo: boolean | null;
}

export interface OpsProfile {
	username: string;
	display_name: string | null;
	orientations: DomainOrientation[];
	score: CraftScoreValue;
	objectives: OpsObjective[];
	incidents: OpsIncident[];
	cost_work: OpsCostWork[];
	attestations: DomainAttestation[];
	credentials: DomainCredential[];
}

// ---------------------------------------------------------------------------
// leadership
// ---------------------------------------------------------------------------

export interface LeadershipArtefact {
	title: string;
	subtype: string;
	/** `public`, `redacted`… what a reader is allowed to open. */
	redaction_state: string;
	target_domain: string | null;
	adopted: boolean | null;
	url: string | null;
	verified_at: string | null;
}

/**
 * Confidential work said in the abstract: what kind, at what scale, in what
 * industry — and never what or where.
 */
export interface ConfidentialSummary {
	subtype: string;
	context: string;
	verified_at: string | null;
}

/** A cohort led to its end, with the numbers that make the claim checkable. */
export interface LeadershipCohort {
	slug: string;
	target_domain: string | null;
	joined_total: number;
	graduated_total: number;
	/** Left for a job rather than dropped out — not a failure. */
	left_for_work: number;
	concluded_at: string | null;
	led_to_the_end: boolean;
}

/** A retrospective, and whether its action items actually landed. */
export interface LeadershipRetrospective {
	held_on: string;
	actions_total: number;
	actions_resolved_in_window: number;
	followed_through: boolean;
}

export interface LeadershipProfile {
	username: string;
	display_name: string | null;
	orientations: DomainOrientation[];
	score: CraftScoreValue;
	artefacts: LeadershipArtefact[];
	confidential_summary: ConfidentialSummary[];
	cohorts: LeadershipCohort[];
	retrospectives: LeadershipRetrospective[];
	target_domain_breakdown: TargetDomainShare[];
	attestations: DomainAttestation[];
}

// ---------------------------------------------------------------------------
// security
// ---------------------------------------------------------------------------

/**
 * A finding a reviewer confirmed.
 *
 * `title` is present only on the published ones — the title of an embargoed
 * finding is half the disclosure, and the backend withholds it rather than
 * trusting a client to hide it.
 */
export interface SecurityFinding {
	id: string;
	title: string | null;
	severity_tier: string;
	cvss_score: number | null;
	cwe_id: string | null;
	status: string;
	disclosure_stage: string;
	target_kind: string | null;
	writeup_url: string | null;
	/** Month, not a day: a precise date narrows an embargo window. */
	confirmed_month: string | null;
}

/** Solved practice, as a count. Forty rows of "solved a lab" is not a portfolio. */
export interface SecurityPractice {
	kind: string;
	tier: string;
	solved: number;
}

/** Reputation elsewhere, with the declared/verified distinction kept. */
export interface SecurityExternalPlatform {
	platform: string;
	name: string | null;
	handle: string;
	profile_url: string | null;
	items_label: string | null;
	items: number | null;
	reach_label: string | null;
	reach: number | null;
	/** True when the figures are what the person typed, not what the platform gave. */
	figures_are_declared: boolean;
	verified: boolean;
	last_synced_at: string | null;
}

export interface SecurityProfile {
	username: string;
	display_name: string | null;
	orientations: DomainOrientation[];
	score: CraftScoreValue;
	findings: SecurityFinding[];
	practice: SecurityPractice[];
	attestations: DomainAttestation[];
	credentials: DomainCredential[];
	external_platforms: SecurityExternalPlatform[];
}

/** Any of the five, for the shared parts of the section. */
export type DomainRecordProfile =
	| CodeProfile
	| QualityProfile
	| OpsProfile
	| LeadershipProfile
	| SecurityProfile;
