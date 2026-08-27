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

/**
 * What somebody says they are open to.
 *
 * A declaration, never a credential, and the payload keeps it separate from
 * everything above it for that reason. `day_rate_range` is a range rather than
 * a price on purpose: a range can be filtered on and negotiated from, a price
 * only anchors.
 */
export interface DesignAvailability {
	available_for_missions: boolean;
	looking_for: string | null;
	day_rate_range: string | null;
	available_from: string | null;
}

/** How much paid work somebody has delivered, and how it was received. */
export interface DesignMissionRecord {
	delivered: number;
	by_type: { mission_type: string; delivered: number }[];
	/** Null, not zero, for somebody nobody has rated yet. */
	rating_average: number | null;
	rating_count: number;
}

export interface DesignProfile {
	username: string;
	craft_score: CraftScore;
	/**
	 * The same object as `craft_score`, under the key every domain now answers
	 * so one client reads all eight. Both hold the same thing until the front
	 * moves over; `craft_score` stays the one this section reads.
	 */
	score?: CraftScore;
	artefacts: DesignArtefact[];
	contests: DesignContestStanding[];
	trades: DesignTradeCount[];
	attestations: DesignAttestationRef[];
	/**
	 * Served inline since the fix batch, so the mission record no longer costs
	 * its own round trip. Optional while an older deployment answers.
	 */
	missions?: DesignMissionRecord;
	/** Null for somebody who has never said. */
	availability?: DesignAvailability | null;
}

export interface SetAvailabilityRequest {
	/**
	 * Every field is written as sent, so omitting one clears it: this is the
	 * whole availability state, not a patch.
	 */
	available_for_missions: boolean;
	looking_for?: string | null;
	day_rate_range?: string | null;
	available_from?: string | null;
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

/**
 * Domains the wizard can be run for.
 *
 * Mirrors `validators::SKILL_DOMAINS`, which is what
 * `routes::domain_profile` guards the path segment against — all twelve, not
 * the seven that existed when the design wizard shipped. A domain missing
 * here is a wizard the front cannot address at all, even though the backend
 * would answer.
 */
export const PROFILE_DOMAINS = [
	'code',
	'design',
	'game',
	'security',
	'ops',
	'ai',
	'soft_skills',
	'audio',
	'quality',
	'leadership',
	'communication',
	'education'
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
	/**
	 * Plural and a list: somebody who writes in two frameworks answers two,
	 * and the question is `closed_multi` server-side. It was `main_framework`
	 * here, singular, which the validator would have refused.
	 */
	main_frameworks?: string[];
	huggingface_username?: string;
	/** Sub-orientations, where the domain has families to offer. */
	preferred_families?: string[];
}

// ---------------------------------------------------------------------------
// Design critique loop
// ---------------------------------------------------------------------------

/** The three answers a reviewer may give. Mirrors `design_reviews::Verdict`. */
export const DESIGN_VERDICTS = ['approve', 'iterate', 'reject'] as const;

export type DesignVerdict = (typeof DESIGN_VERDICTS)[number];

// ---------------------------------------------------------------------------
// Version trail — rounds, comparison, automatic checks
// ---------------------------------------------------------------------------

/**
 * One decided round on a design slice, as `GET /design/slices/{id}/reviews`
 * returns them: oldest first, and public on purpose.
 *
 * The endpoint's own words: the sequence of rounds is the most convincing
 * thing a designer can show. `reviewed_artifact_url` is the version the
 * critique was written against, which is not necessarily the one on screen
 * now — that is exactly why it is carried per round.
 */
export interface DesignReviewRound {
	round: number;
	/** `approve`, `iterate` or `reject`. Open: the vocabulary is server-side. */
	decision: string;
	blocking_reason: string | null;
	reason: string | null;
	reviewed_artifact_url: string | null;
	reviewed_artifact_notes_md: string | null;
	/** Free-form so a family grid can be revised without a migration. */
	grid_scores: Record<string, unknown> | null;
	decided_at: string;
}

/** A version as it stood at one round, with the critique that closed it. */
export interface DesignVersionAtRound {
	round: number;
	artifact_url: string | null;
	author_notes_md: string | null;
	decision: string;
	blocking_reason: string | null;
	reason: string | null;
	grid_scores: Record<string, unknown> | null;
	decided_at: string;
}

/**
 * Two rounds side by side, and everything said between them.
 *
 * No diff is computed server-side and none should be: the backend has neither
 * the pixels nor the fonts, and rendering somebody's Figma node would mean
 * holding their design account. `diff_strategy` is the backend telling the
 * client which comparison this subtype makes meaningful, so the front does
 * not keep its own copy of the twelve subtypes and guess wrong.
 */
export interface DesignComparison {
	slice_id: string;
	design_subtype: string | null;
	diff_strategy: string | null;
	from: DesignVersionAtRound;
	to: DesignVersionAtRound;
	critiques_between: DesignReviewRound[];
}

/** Severity vocabulary of `design_auto_checks::Severity`. */
export const DESIGN_CHECK_SEVERITIES = ['info', 'warning', 'error'] as const;

export type DesignCheckSeverity = (typeof DESIGN_CHECK_SEVERITIES)[number];

/**
 * What an automatic check found on one round.
 *
 * Nothing here is a verdict, and the UI must not present it as one: the
 * backend is explicit that a version can carry an `error` and still be
 * approved, because no check knows whether a mark is right for a cooperative.
 */
export interface DesignAutoCheck {
	round: number;
	check_type: string;
	/** Open type: severities are compared against the constant, not narrowed. */
	severity: string;
	message: string;
	details: Record<string, unknown> | null;
	ran_at: string;
}

/**
 * Validated work that took three rounds or more.
 *
 * Three rather than two, and the backend explains why: two rounds is one
 * critique and a fix, which happens to everybody. Three is where a direction
 * was questioned and the person came back.
 */
export interface DesignIterationStory {
	slice_id: string;
	title: string;
	design_subtype: string | null;
	orientation_slug: string | null;
	rounds: number;
	first_artifact_url: string | null;
	final_artifact_url: string | null;
	validated_at: string | null;
}

// ---------------------------------------------------------------------------
// Curated briefs — a member proposes, an admin publishes
// ---------------------------------------------------------------------------

/** Statuses a proposal moves through, from `services::design_briefs`. */
export const BRIEF_PROPOSAL_STATUSES = ['pending', 'published', 'rejected', 'withdrawn'] as const;

export type BriefProposalStatus = (typeof BRIEF_PROPOSAL_STATUSES)[number];

/** A brief a member proposed, in whatever state the queue left it. */
export interface DesignBriefProposal {
	id: string;
	proposed_by: string;
	author_username: string | null;
	title: string;
	brief_md: string;
	orientation_id: string;
	orientation_slug: string | null;
	design_subtype: string;
	difficulty: number;
	estimated_hours: number | null;
	expected_rounds: number | null;
	format: string;
	status: string;
	/** Why it was refused. The only field that makes a rejection actionable. */
	review_feedback: string | null;
	/** Set once an admin published it: the challenge the brief became. */
	published_slice_id: string | null;
	created_at: string;
}

export interface ProposeBriefRequest {
	title: string;
	brief_md: string;
	orientation_slug: string;
	design_subtype: string;
	difficulty: number;
	estimated_hours?: number | null;
	expected_rounds?: number | null;
	format: string;
}

// ---------------------------------------------------------------------------
// Cloud design tools — Figma, Miro, Webflow
// ---------------------------------------------------------------------------

/** Providers `design_cloud::Provider::parse` accepts. */
export const DESIGN_CLOUD_PROVIDERS = ['figma', 'miro', 'webflow'] as const;

export type DesignCloudProvider = (typeof DESIGN_CLOUD_PROVIDERS)[number];

export interface DesignCloudConnection {
	provider: string;
	scopes: string[];
	remote_handle: string | null;
	expires_at: string | null;
	connected_at: string;
}

export interface DesignCloudStart {
	authorize_url: string;
	/**
	 * Echoed back and checked at the callback. Without it, anybody could hand
	 * somebody a callback URL and attach their own account.
	 */
	state: string;
}

/**
 * What a pasted link turns out to be. A null `source` on the inspection means
 * it is not a design tool link at all.
 */
export interface DesignCloudSource {
	provider: string;
	key: string | null;
	node_id: string | null;
	/**
	 * False for a link a reviewer without an account cannot open — the whole
	 * reason the inspect endpoint exists.
	 */
	opens_without_account: boolean;
}

/** The two things the inspector can warn about. Codes, not sentences. */
export const INSPECT_WARNING_CODES = ['unrecognised_link', 'needs_public_sharing'] as const;

export type InspectWarningCode = (typeof INSPECT_WARNING_CODES)[number];

export interface DesignCloudInspection {
	source: DesignCloudSource | null;
	/**
	 * The French sentence the endpoint used to return, kept by the backend for
	 * the transition. Not rendered: this endpoint is public and serves an FR/EN
	 * audience, and a French warning is worst exactly when an English reader
	 * has to act on it.
	 */
	warning: string | null;
	/**
	 * What is wrong, as a code the client renders in the reader's language.
	 * Null when the link is fine.
	 */
	warning_code?: string | null;
	/**
	 * The provider the sharing warning is about, so the client can name it in
	 * its own sentence. Null unless `warning_code` is `needs_public_sharing`.
	 */
	warning_provider?: string | null;
}

// ---------------------------------------------------------------------------
// Large uploads — presigned multipart, straight to the object store
// ---------------------------------------------------------------------------

/**
 * The twelve deliverable subtypes, from `models::DesignSubtype`.
 *
 * Ordered as the backend's ceiling table reads them: vectors and words first,
 * then screens and drawings, then the ones that are genuinely enormous.
 */
export const DESIGN_SUBTYPES = [
	'brand_kit',
	'icon_set',
	'type_family',
	'copy_deck',
	'research_document',
	'interface',
	'design_system',
	'illustration_set',
	'sound',
	'motion',
	'video',
	'three_d_scene'
] as const;

export type DesignSubtype = (typeof DESIGN_SUBTYPES)[number];

/**
 * How large a file of each subtype may be, mirroring
 * `design_uploads::max_bytes`.
 *
 * Duplicated client-side to refuse a file before five gigabytes have moved,
 * not to replace the server check. The ceiling is a refusal there too, and
 * telling somebody after the upload is telling them too late.
 */
export const DESIGN_SUBTYPE_MAX_BYTES: Record<DesignSubtype, number> = {
	brand_kit: 200 * 1024 * 1024,
	icon_set: 200 * 1024 * 1024,
	type_family: 200 * 1024 * 1024,
	copy_deck: 100 * 1024 * 1024,
	research_document: 100 * 1024 * 1024,
	interface: 500 * 1024 * 1024,
	design_system: 500 * 1024 * 1024,
	illustration_set: 1024 * 1024 * 1024,
	sound: 500 * 1024 * 1024,
	motion: 2 * 1024 * 1024 * 1024,
	video: 5 * 1024 * 1024 * 1024,
	three_d_scene: 5 * 1024 * 1024 * 1024
};

/**
 * Subtypes whose source a browser cannot open, and which therefore have to
 * arrive with a preview. Mirrors `design_uploads::REQUIRES_PREVIEW`.
 *
 * `init` also returns `preview_required`, which is the authority; this list
 * exists only so the form can say so before a file is chosen.
 */
export const DESIGN_SUBTYPES_REQUIRING_PREVIEW: readonly DesignSubtype[] = [
	'motion',
	'video',
	'three_d_scene',
	'sound'
];

export interface DesignUploadPart {
	part_number: number;
	url: string;
	/**
	 * Every part but the last is exactly this many bytes, or the store refuses
	 * the assembly.
	 */
	bytes: number;
}

export interface DesignUploadInitiated {
	session_id: string;
	part_size: number;
	parts: DesignUploadPart[];
	preview_required: boolean;
	expires_at: string;
}

export interface DesignUploadSession {
	id: string;
	user_id: string;
	slice_id: string | null;
	design_subtype: string;
	filename: string;
	content_type: string;
	declared_bytes: number;
	stored_bytes: number | null;
	part_size: number;
	part_count: number;
	storage_key: string;
	preview_key: string | null;
	status: string;
	created_at: string;
	completed_at: string | null;
	expires_at: string;
}

/**
 * A part as the object store handed its ETag back. Passed through untouched,
 * quotes and all: the store compares it with its own.
 */
export interface DesignUploadCompletedPart {
	part_number: number;
	etag: string;
}

export interface InitUploadRequest {
	design_subtype: string;
	filename: string;
	content_type: string;
	declared_bytes: number;
	slice_id?: string | null;
}

// ---------------------------------------------------------------------------
// External portfolios — declared, and said to be declared
// ---------------------------------------------------------------------------

/** A platform the backend knows how to link to. */
export interface PortfolioPlatform {
	slug: string;
	skill_domain: string | null;
	name: string;
	profile_url_pattern: string | null;
	/**
	 * The display words the endpoint seeded, in French. Kept by the backend for
	 * the transition and **not rendered**: this endpoint is public and serves
	 * an FR/EN audience.
	 */
	items_label: string | null;
	reach_label: string | null;
	/**
	 * Language-neutral keys for the two labels — `downloads`, `stars`,
	 * `repositories`. Rendered instead of the words above, so the reader's
	 * language decides. Optional while an older deployment answers.
	 */
	items_label_key?: string | null;
	reach_label_key?: string | null;
	/**
	 * False for every design platform today, which is why the figures below
	 * are declared rather than fetched.
	 */
	has_public_api: boolean;
}

/**
 * A portfolio somebody declared.
 *
 * `figures_are_declared` is the field the UI is built around: Behance and
 * Dribbble expose no public API here, so the counts are the person's own word
 * and every surface showing them says so. Nothing declared is a proof.
 */
export interface PortfolioDeclaration {
	id: string;
	platform: string;
	skill_domain: string | null;
	handle: string;
	profile_url: string;
	items_count: number | null;
	reach_count: number | null;
	figures_are_declared: boolean;
	verified_at: string | null;
	last_synced_at: string | null;
}

export interface DeclarePortfolioRequest {
	platform: string;
	handle: string;
	profile_url: string;
	items_count?: number | null;
	reach_count?: number | null;
}

// ---------------------------------------------------------------------------
// Plagiarism cases on contest entries
// ---------------------------------------------------------------------------

export const PLAGIARISM_CASE_STATUSES = ['open', 'answered', 'upheld', 'dismissed'] as const;

export type PlagiarismCaseStatus = (typeof PLAGIARISM_CASE_STATUSES)[number];

/**
 * An accusation against a contest entry, and the answer to it.
 *
 * Not public, and deliberately: an open case is an allegation, and publishing
 * allegations before they are decided is how a dismissed case still ruins
 * somebody. Only the accused and the reviewers can read one.
 *
 * `respond_by` is the whole point of the table. Being disqualified by a
 * process nobody told you about is the failure it exists to prevent, so the
 * accused is notified with the accusation in full and given a deadline to
 * answer before anybody decides.
 *
 * `upheld_against_accused` counts previously upheld cases against the same
 * person. It is context for a reviewer, never a verdict on this case.
 */
export interface PlagiarismCase {
	id: string;
	submission_id: string;
	accused_username: string | null;
	raised_by_username: string | null;
	reason_md: string;
	evidence_url: string;
	raised_at: string;
	respond_by: string;
	response_md: string | null;
	responded_at: string | null;
	status: string;
	decision_md: string | null;
	decided_at: string | null;
	upheld_against_accused: number;
}

export interface FlagPlagiarismRequest {
	reason_md: string;
	/** One link, and required: an accusation with nothing to look at is one
	 * nobody can check and the accused cannot answer. */
	evidence_url: string;
}

export interface RespondToPlagiarismRequest {
	response_md: string;
}

// ---------------------------------------------------------------------------
// Mission execution — NDA, applications, delivery rounds, ratings, invoices
// ---------------------------------------------------------------------------

/**
 * An application to a mission, as the publishing enterprise reads it.
 *
 * `verified_attestations` is the field that separates this from a CV: it is a
 * count of Skilluv-verified work, computed server-side, and it sits next to
 * `portfolio_urls`, which are links the applicant typed. The UI keeps the two
 * visually apart for the same reason the platform keeps proofs and signals
 * apart everywhere else.
 */
export interface MissionApplication {
	id: string;
	mission_id: string;
	user_id: string;
	username: string;
	cover_letter: string;
	portfolio_urls: string[];
	/** Free-form: the shape depends on the mission type's questions. */
	expertise: Record<string, unknown> | null;
	past_similar_missions: string | null;
	availability_hours_per_week: number | null;
	status: string;
	decision_reason: string | null;
	verified_attestations: number;
	created_at: string;
}

export const MISSION_APPLICATION_DECISIONS = ['accepted', 'rejected'] as const;

export interface MissionDecisionRequest {
	status: string;
	/** Required to reject. A refusal with no reason teaches nothing and is the
	 * one thing an applicant can act on. */
	reason?: string | null;
}

/**
 * The agreement a mission asks to be signed, rendered for a locale.
 *
 * `sha256` is not decoration: it is echoed back when signing, and a mismatch
 * answers 409 rather than silently recording a signature on a document that
 * changed after it was shown. `is_reviewed` says whether a lawyer has been
 * over this template, and the UI says so too — presenting an unreviewed
 * template as settled law is the failure mode worth avoiding.
 */
export interface MissionNdaAgreement {
	template: string;
	title: string;
	body_md: string;
	sha256: string;
	version: number | null;
	is_reviewed: boolean;
	locale: string;
}

export interface SignNdaRequest {
	typed_name: string;
	/** The hash of the document actually displayed. */
	document_sha256: string;
	locale?: string | null;
}

/**
 * A signature already given, or `null`.
 *
 * `released_at` is set rather than the row being deleted: that the obligation
 * existed is a fact, and erasing it would erase the release too.
 */
export interface MissionNdaSignature {
	id: string;
	template: string;
	document_sha256: string;
	document_url: string | null;
	typed_name: string;
	signed_at: string;
	released_at: string | null;
	released_reason: string | null;
}

/**
 * One delivery round.
 *
 * Two or three rounds is the normal case for design work, not a failure: the
 * mission stays `in_progress` until a round is accepted, because the rounds
 * live on the delivery and nothing about the mission regresses.
 *
 * `beyond_agreed_rounds` is the honest flag — it marks a round past what the
 * brief allowed for without refusing it, which is the difference between a
 * record and a gate.
 */
export interface MissionDelivery {
	id: string;
	mission_id: string;
	round: number;
	delivered_by: string;
	artifact_url: string;
	notes_md: string | null;
	delivered_at: string;
	/** `accepted`, `changes_requested`, or null while it waits. */
	decision: string | null;
	decision_reason: string | null;
	decided_at: string | null;
	beyond_agreed_rounds: boolean;
}

export interface DeliverRoundRequest {
	artifact_url: string;
	notes_md?: string | null;
}

export interface RequestChangesRequest {
	/** At least twenty characters server-side: "not quite" costs a round and
	 * teaches nothing. */
	reason: string;
}

/**
 * A rating, once it is readable.
 *
 * Written blind: nothing is returned until both sides have written or
 * fourteen days have passed. A rating one side can read before writing their
 * own is a negotiation, and one a silent client can suppress for ever is
 * worse. The list simply comes back empty in the meantime — "nobody has said
 * anything yet" and "it is not your turn to read" look the same from outside,
 * on purpose.
 */
export interface MissionRating {
	mission_id: string;
	direction: string;
	rater_id: string;
	rated_id: string;
	rating: number;
	comment_md: string | null;
	created_at: string;
}

export interface RateMissionRequest {
	/** 1 to 5. */
	rating: number;
	comment_md?: string | null;
}

/**
 * What somebody's revealed ratings average to.
 *
 * `average` is null rather than zero when nothing is revealed yet: an unrated
 * person is not a badly rated one, and a zero on a profile says the opposite.
 */
export interface MissionStanding {
	received: number;
	average: number | null;
}

/**
 * A line on a mission's account: the whole job, a month of a retainer, a batch
 * of approved hours.
 *
 * NUMERIC over JSON, so `amount`, `commission_percent` and `hours` arrive as
 * strings. Parsing them into floats to display them is how rounding errors get
 * onto an invoice.
 */
export interface MissionInvoice {
	id: string;
	mission_id: string;
	sequence: number;
	label: string;
	amount: string;
	currency: string;
	commission_percent: string;
	period_start: string | null;
	period_end: string | null;
	hours: string | null;
	status: string;
	payment_id: string | null;
	issued_at: string;
}

export interface IssueInvoiceRequest {
	label: string;
	amount?: string | null;
	period_start?: string | null;
	period_end?: string | null;
	hours?: string | null;
	expense_evidence_url?: string | null;
}

// ---------------------------------------------------------------------------
// Mentor matching — one endpoint, seven domains
// ---------------------------------------------------------------------------

/**
 * A mentor worth suggesting, and why.
 *
 * `because` ships with every match on purpose, and the backend says why: a
 * recommendation nobody can argue with is one nobody can correct, and the
 * first thing this will get wrong is who should be suggested to whom. So the
 * UI renders the clauses rather than a bare ranked list.
 *
 * `shared_families` and `shared_tools` are the two axes O-03 asked for —
 * cross-family pairing and a shared toolset. `timezone_gap_hours` is null
 * when either side declared no offset, never zero: "we did not know" and "the
 * same timezone" are different answers and only one of them is good news.
 */
export interface MentorMatch {
	mentor_user_id: string;
	username: string;
	headline: string;
	craft_score: number;
	score: number;
	shared_families: string[];
	shared_tools: string[];
	timezone_gap_hours: number | null;
	active_mentees: number;
	because: string[];
}

export interface MentorMatches {
	mentors: MentorMatch[];
	/**
	 * True when this person handed in three pieces in the domain and none was
	 * validated — the backend's own definition of somebody a mentor would
	 * help. Shown as an invitation, never as a judgement: three unvalidated
	 * hand-ins is a normal place to be, and phrasing it as a deficiency is how
	 * somebody stops handing anything in.
	 */
	suggested: boolean;
}

// ---------------------------------------------------------------------------
// The annual awards
// ---------------------------------------------------------------------------

/**
 * Where an edition is in its year. Each verb is refused outside its phase.
 *
 * From the CHECK in migration 0190: categories exist but nothing is public
 * (`draft`), anybody may put work forward (`nominations`), the shortlist is
 * fixed and the vote is open (`voting`), counted and published and nothing
 * moves after it (`concluded`).
 */
export const AWARD_EDITION_STATUSES = ['draft', 'nominations', 'voting', 'concluded'] as const;

export type AwardEditionStatus = (typeof AWARD_EDITION_STATUSES)[number];

/**
 * One year of awards.
 *
 * `year` is the year the **work happened in**, not the year the ceremony is
 * held. The two weights add to a hundred and are shown wherever a standing is:
 * a weighted result presented without its weights is a number nobody can
 * reproduce.
 */
export interface AwardEdition {
	id: string;
	year: number;
	status: string;
	community_weight: number;
	jury_weight: number;
	nominations_close_at: string | null;
	voting_closes_at: string | null;
	/** Per category, in euros. NUMERIC over JSON, so a string. Null for an
	 * edition that runs on recognition rather than money. */
	prize_amount_eur: string | null;
}

/** What kind of thing a category nominates. */
export const AWARD_SUBJECT_TYPES = ['user', 'project', 'deliverable'] as const;

export type AwardSubjectType = (typeof AWARD_SUBJECT_TYPES)[number];

/**
 * An award category.
 *
 * Carries no `skill_domain`, so a client cannot narrow the list to the design
 * ones. Every category the platform holds appears on every awards surface
 * until the backend says which domain each belongs to.
 */
export interface AwardCategory {
	slug: string;
	name: string;
	description: string;
	subject_type: string;
	sort_order: number;
}

/**
 * A nominee, with the running count behind it.
 *
 * `community_votes` and `jury_votes` are raw tallies; `weighted_score` is what
 * actually orders the standing, and the two are shown together so a reader can
 * see why a nominee with fewer votes sits higher.
 *
 * `shortlisted` gates voting: a vote for a nominee nobody shortlisted is a
 * 400, so the UI offers the ballot only where it can land.
 */
export interface AwardNominee {
	id: string;
	category_slug: string;
	subject_type: string;
	subject_id: string;
	subject_label: string | null;
	citation: string;
	shortlisted: boolean;
	community_votes: number;
	jury_votes: number;
	/** NUMERIC over JSON. */
	weighted_score: string;
}

export interface NominateRequest {
	category_slug: string;
	subject_id: string;
	/** Why this deserves it. Required: voters cannot weigh a name. */
	citation: string;
}

// ---------------------------------------------------------------------------
// Practice — the toolkit of a domain, and where to contribute
// ---------------------------------------------------------------------------

/** One curated tool, course or community. */
export interface ToolkitRow {
	slug: string;
	display_name: string;
	category: string;
	url: string;
	summary: string;
	/**
	 * What it costs to reach: free, trial, paid, student licence. The field the
	 * listing exists for — recommending a tool somebody cannot afford wastes
	 * the week it was meant to save.
	 */
	access_note: string;
	/** Empty means the whole domain, not "none". */
	orientation_slugs: string[];
}

export interface ToolkitResponse {
	domain: string;
	resources: ToolkitRow[];
	/** Echoed back so a filtered view can say what it filtered on. */
	category: string | null;
	orientation: string | null;
}

/**
 * An upstream project somebody researched as a good place to contribute.
 *
 * A shortlist entry, not a terrain: it becomes one when a steward takes it,
 * which is what `adopted` and `project_slug` record. A declined proposal keeps
 * its reason so the next person researching the domain does not propose it
 * again.
 */
export interface TerrainProposal {
	slug: string;
	name: string;
	kind: string;
	upstream_url: string;
	ingestion_labels: string[];
	why_md: string;
	adopted: boolean;
	adopted_at: string | null;
	project_slug: string | null;
	declined_at: string | null;
	declined_reason: string | null;
}

// ---------------------------------------------------------------------------
// Featured talent
// ---------------------------------------------------------------------------

/** One week's pick in one domain. */
export interface FeaturedTalent {
	skill_domain: string;
	/** The Monday the week starts on, as a date rather than a timestamp. */
	week_of: string;
	user_id: string;
	username: string | null;
	display_name: string | null;
	avatar_url: string | null;
	/** Why this person, in the editor's words. A featuring with no stated
	 * reason is a popularity contest with extra steps. */
	reason_md: string;
	deliverable_id: string | null;
	created_at: string;
}

// ---------------------------------------------------------------------------
// Series — contests that belong together
// ---------------------------------------------------------------------------

/**
 * A group of contests read as one event.
 *
 * `kind` decides how it reads: an `awards_edition` lists thirteen podiums, a
 * `sprint` lists one plus the run behind it, a `programme` is anything grouped
 * for editorial reasons. Stored rather than inferred from the number of
 * contests, so one set of routes serves all three.
 */
export interface TournamentSeries {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	kind: string;
	/** Null for a series open to every domain. */
	skill_domain: string | null;
	starts_at: string;
	ends_at: string;
	created_at: string;
}

/**
 * One line of a podium.
 *
 * Carries `username` and `display_name`, unlike a bare tournament leaderboard
 * row — which is what lets a series result name its winners rather than rank
 * anonymous UUIDs.
 */
export interface PodiumLine {
	rank: number;
	participant_type: string;
	participant_id: string;
	username: string | null;
	display_name: string | null;
	score: number;
}

/** One contest inside a series, with who came out on top of it. */
export interface CategoryStanding {
	/** The family this contest stands for, on an awards edition. */
	category: string | null;
	tournament_id: string;
	tournament_slug: string;
	tournament_name: string;
	status: string;
	ends_at: string;
	podium: PodiumLine[];
}
