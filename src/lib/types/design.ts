/**
 * Types for the Skilluv Design programme (Linear SKI-182 … SKI-268).
 *
 * Three shapes the backend chose that the tickets did not, and that the whole
 * front layer follows:
 *
 * 1. **A design contest is a tournament.** `services::design` says it in as
 *    many words: a `brief_contest` on the tournament routes, "because a
 *    contest is the same event whatever the subject". There is no
 *    `/design/contests` API and there should not be one.
 * 2. **A design mission is a mission.** `/missions` carries `skill_domain`,
 *    so the design marketplace is that endpoint filtered, not a parallel one.
 * 3. **The design profile is addressed by username**, unlike the id-addressed
 *    Post-MVP endpoints. It needs no UUID and is therefore unaffected by
 *    SKI-300.
 */

// ---------------------------------------------------------------------------
// Contests — tournaments of kind `brief_contest`
// ---------------------------------------------------------------------------

/**
 * Contest kinds that accept submissions.
 *
 * Mirrors `services::contest::KINDS_WITH_SUBMISSIONS`. Design uses
 * `brief_contest`; the others are here so a shared contest component does not
 * have to pretend they do not exist.
 */
export const CONTEST_KINDS_WITH_SUBMISSIONS = [
	'hackathon',
	'code_golf',
	'tdd_contest',
	'brief_contest',
	'duel'
] as const;

/** Kinds scored by a jury rather than measured. */
export const JURIED_CONTEST_KINDS = ['hackathon', 'tdd_contest', 'brief_contest'] as const;

/** The kind a design contest always is. */
export const DESIGN_CONTEST_KIND = 'brief_contest';

/**
 * Tournament lifecycle, from the CHECK in migration 0030.
 *
 * `concluded` is the one the results page keys on: a standing is published
 * only once the contest is over.
 */
export const TOURNAMENT_STATUSES = [
	'upcoming',
	'registration',
	'active',
	'concluded',
	'cancelled'
] as const;

export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

/**
 * A tournament as `GET /tournaments` and `GET /tournaments/{slug}` return it.
 *
 * Replaces the earlier hand-written shape in `$api/tournament`, which had
 * invented `max_participants` / `participants_count` and omitted `kind`,
 * `status` and `rules` — the three fields any contest surface is built on.
 */
export interface Tournament {
	id: string;
	season_id: string | null;
	slug: string;
	name: string;
	description: string | null;
	kind: string;
	format: string;
	prize_pool_fragments: number;
	prize_pool_gp: number;
	sponsor_enterprise_id: string | null;
	sponsor_logo_url: string | null;
	sponsor_blurb: string | null;
	registration_opens_at: string | null;
	starts_at: string;
	ends_at: string;
	/** Open on purpose: the status vocabulary grows server-side. */
	status: string;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	/** `null` means the contest is open to every domain. */
	skill_domain: string | null;
	/** What the contest asks for. Shape depends on `kind`. */
	rules: ContestRules;
	scoring_direction: string;
}

/**
 * The `rules` object of a `brief_contest`.
 *
 * `validate_rules` requires `brief` and `judging_criteria` for this kind;
 * everything else is optional and read defensively.
 */
export interface ContestRules {
	brief?: string;
	judging_criteria?: string;
	moodboard_url?: string;
	deliverables?: string[];
	[key: string]: unknown;
}

/** Submission lifecycle, from the CHECK in migration 0189. */
export const SUBMISSION_STATUSES = [
	'submitted',
	'accepted',
	'rejected',
	'disqualified'
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export interface ContestSubmission {
	id: string;
	tournament_id: string;
	participant_type: string;
	participant_id: string;
	submitted_by: string;
	artifact_url: string;
	artifact_type: string;
	secondary_url: string | null;
	summary: string;
	language: string | null;
	measured_value: number | null;
	status: string;
	judge_score: number | null;
	judged_by: string | null;
	judged_at: string | null;
	judge_notes: string | null;
	submitted_at: string;
	updated_at: string;
}

export interface ContestJuror {
	tournament_id: string;
	juror_user_id: string;
	invited_by_user_id: string | null;
	invited_at: string;
	accepted_at: string | null;
	declined_at: string | null;
	decline_reason: string | null;
}

/** One row of the community vote tally. */
export interface CommunityRankingRow {
	submission_id: string;
	votes: number;
}

/**
 * A standing on the contest leaderboard.
 *
 * No name: `leaderboard_of` is a `SELECT p.*` over `tournament_participants`
 * and joins nothing, so a row identifies its participant by UUID only. The UI
 * therefore ranks by number and marks the reader's own row rather than
 * inventing a display name it was never given.
 */
export interface TournamentParticipant {
	tournament_id: string;
	participant_type: string;
	participant_id: string;
	score: number;
	rank: number | null;
	prize_fragments_awarded: number;
	prize_gp_awarded: number;
	registered_at: string;
}

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

export const MISSION_PAYMENT_MODELS = [
	'fixed_price',
	'per_hour',
	'per_deliverable',
	'retainer_monthly',
	'revenue_share'
] as const;

export type MissionPaymentModel = (typeof MISSION_PAYMENT_MODELS)[number];

/**
 * How the output's rights are handled. Shown as a badge on every listing:
 * a designer must not have to read a brief to find out they are signing away
 * everything.
 */
export const MISSION_IP_TERMS = [
	'full_ownership_client',
	'open_source_output',
	'retain_reusable_components',
	'dual_license'
] as const;

export type MissionIpTerms = (typeof MISSION_IP_TERMS)[number];

export const MISSION_DELIVERABLE_FORMATS = [
	'github_pr',
	'repository_handover',
	'library_published',
	'consulting_report'
] as const;

export type MissionDeliverableFormat = (typeof MISSION_DELIVERABLE_FORMATS)[number];

export const MISSION_URGENCIES = ['low', 'normal', 'high', 'critical'] as const;

/** Statuses a mission moves through. It goes forward, or it is cancelled. */
export const MISSION_STATUSES = [
	'draft',
	'published',
	'applications_closed',
	'in_progress',
	'delivered',
	'closed',
	'cancelled'
] as const;

export type MissionStatus = (typeof MISSION_STATUSES)[number];

export interface Mission {
	id: string;
	slug: string;
	enterprise_id: string;
	mission_type_slug: string;
	skill_domain: string;
	title: string;
	description: string;
	acceptance_criteria: string;
	target_languages: string[];
	target_frameworks: string[];
	orientation_slug: string | null;
	deliverable_format: string;
	nda_required: boolean;
	ip_terms: string;
	payment_model: string;
	/** Decimals arrive as strings: a NUMERIC through JSON is not a float. */
	budget_eur: string | null;
	hourly_rate_eur: string | null;
	revenue_share_percent: string | null;
	commission_percent: string;
	remote_only: boolean;
	urgency: string;
	estimated_days: number | null;
	status: string;
	assigned_user_id: string | null;
	applications_close_at: string | null;
	published_at: string | null;
	created_at: string;
	/** Absent on the public listing, present for the enterprise that owns it. */
	application_count: number | null;
}

export interface MissionType {
	slug: string;
	skill_domain: string;
	name: string;
	description: string;
}

/** A row of `GET /users/me/missions` — the applicant's own view. */
export interface MyMissionApplication {
	mission_slug: string;
	mission_title: string;
	mission_status: string;
	application_status: string;
	decision_reason: string | null;
}

// ---------------------------------------------------------------------------
// Design profile — craft score, artefacts, standings
// ---------------------------------------------------------------------------

/** One weighted component of a craft score, with what it counted. */
export interface CraftScoreTerm {
	term: string;
	measured: number;
	points: number;
	explanation: string;
}

export interface CraftScore {
	score: number;
	tier_slug: string;
	tier_name: string;
	tier_description: string;
	/** The score at which the next tier starts, absent at the top. */
	next_tier_at: number | null;
	breakdown: CraftScoreTerm[];
	/** True when the total hit the ceiling, said out loud rather than inferred. */
	capped: boolean;
}

/**
 * A public design deliverable.
 *
 * `rounds` is the field this profile exists for: converging at four rounds
 * says more about a designer than passing at one.
 */
export interface DesignArtefact {
	deliverable_id: string;
	title: string;
	artifact_url: string;
	trade: string | null;
	subtype: string | null;
	rounds: number | null;
	/** NUMERIC over JSON, hence a string. */
	grid_average: string | null;
	verified_at: string | null;
}

export interface DesignContestStanding {
	name: string;
	rank: number | null;
	entrants: number;
}

export interface DesignTradeCount {
	trade: string;
	validated: number;
}

export interface DesignAttestationRef {
	basis: string;
	title: string;
	verification_code: string;
}

export interface DesignProfile {
	username: string;
	craft_score: CraftScore;
	artefacts: DesignArtefact[];
	contests: DesignContestStanding[];
	trades: DesignTradeCount[];
	attestations: DesignAttestationRef[];
}

export interface CraftScoreTier {
	slug: string;
	name: string;
	min_score: number;
	max_score: number | null;
	description: string;
}

export interface CraftScoreWeight {
	term: string;
	/** NUMERIC over JSON. */
	weight: string;
	kind: string;
	explanation: string;
}

export interface DesignTiers {
	cap: number;
	tiers: CraftScoreTier[];
	weights: CraftScoreWeight[];
}

// ---------------------------------------------------------------------------
// Domain profile — the onboarding wizard's answers
// ---------------------------------------------------------------------------

/** Domains the wizard can be run for. Mirrors `routes::domain_profile::DOMAINS`. */
export const PROFILE_DOMAINS = [
	'code',
	'design',
	'game',
	'security',
	'soft_skills',
	'ai',
	'ops'
] as const;

export type ProfileDomain = (typeof PROFILE_DOMAINS)[number];

export const DOMAIN_LEVELS = [
	'debutant',
	'apprentissage',
	'practitioner',
	'senior',
	'researcher'
] as const;

export type DomainLevel = (typeof DOMAIN_LEVELS)[number];

export const DOMAIN_WEEKLY_HOURS = ['lt3', '3_10', 'gt10', 'fulltime'] as const;

export type DomainWeeklyHours = (typeof DOMAIN_WEEKLY_HOURS)[number];

export const DOMAIN_GOALS = [
	'learning',
	'portfolio',
	'paid_missions',
	'academic_research',
	'startup'
] as const;

export type DomainGoal = (typeof DOMAIN_GOALS)[number];

/**
 * The answers the backend stores today.
 *
 * `deny_unknown_fields` is on, so sending a key it does not know is a 400 for
 * the whole request, not a partial save. The design wizard asks four further
 * questions the vocabulary has no room for yet — see `designWizardDraft`.
 */
export interface DomainProfileAnswers {
	level?: DomainLevel;
	weekly_hours?: DomainWeeklyHours;
	goal?: DomainGoal;
	/** AI domain only. */
	compute?: string;
	main_framework?: string;
	huggingface_username?: string;
}

// ---------------------------------------------------------------------------
// Design critique loop
// ---------------------------------------------------------------------------

/** The three answers a reviewer may give. Mirrors `design_reviews::Verdict`. */
export const DESIGN_VERDICTS = ['approve', 'iterate', 'reject'] as const;

export type DesignVerdict = (typeof DESIGN_VERDICTS)[number];
