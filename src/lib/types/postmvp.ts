/**
 * Types for the Post-MVP backlog tiers 1 to 3 (Linear SKI-36 … SKI-47).
 *
 * Kept in their own module rather than appended to `index.ts`: these twelve
 * features share nothing with the MVP surface except the response envelope,
 * and the index was already long enough that a reader could not tell which
 * half they were in. `index.ts` re-exports everything here, so consumers
 * still import from `$types`.
 *
 * Every shape below mirrors a payload the backend actually emits. Handlers
 * wrap their body in `{ data, meta }` and nest it under a named key
 * (`{ "bookmarks": [...] }`), so the API modules type the inner object and
 * let `ApiResponse<T>` supply the envelope.
 */

// ---------------------------------------------------------------------------
// T1-01 Bookmarks / T1-02 Notes — shared polymorphic targets
// ---------------------------------------------------------------------------

/**
 * What a bookmark or a note may point at.
 *
 * Mirrors `services::saved_items::TARGET_TYPES`. Bounties are deliberately
 * absent — the backend addresses that work through `slice`.
 */
export const SAVED_TARGET_TYPES = [
	'challenge_template',
	'project',
	'user',
	'team',
	'deliverable',
	'slice'
] as const;

export type SavedTargetType = (typeof SAVED_TARGET_TYPES)[number];

/** Display label resolved server-side from the target's own table. */
export interface SavedTargetLabel {
	target_type: SavedTargetType;
	target_id: string;
	title: string;
	/** Stable slug or handle when the target has one, so a link needs no second lookup. */
	slug: string | null;
}

export interface Bookmark {
	id: string;
	target_type: SavedTargetType;
	target_id: string;
	folder_slug: string | null;
	notes: string | null;
	created_at: string;
	/** Absent from the create response, present on every list row. */
	target?: SavedTargetLabel;
}

export interface BookmarkFolder {
	/** `null` stands for the unfiled bucket. */
	folder_slug: string | null;
	count: number;
}

export interface UserNote {
	target_type: SavedTargetType;
	target_id: string;
	body: string;
	created_at: string;
	updated_at: string;
	target?: SavedTargetLabel;
}

// ---------------------------------------------------------------------------
// T1-03 Goals
// ---------------------------------------------------------------------------

export const GOAL_KINDS = ['rank', 'skill_level', 'capability', 'artifact_count'] as const;
export type GoalKind = (typeof GOAL_KINDS)[number];

export interface Goal {
	id: string;
	user_id: string;
	kind: GoalKind;
	target_value: string;
	target_skill_id: string | null;
	/** ISO date (no time) — this is a `NaiveDate` server-side. */
	deadline: string | null;
	created_at: string;
	achieved_at: string | null;
	archived_at: string | null;
}

/**
 * One measurable component of a goal.
 *
 * `name` is a stable identifier (`verified_deliverables`, `attestations`,
 * `mentor_capability`, `proficiency_level`, `capability`) that the UI keys
 * its copy off, so a criterion added server-side degrades to its raw name
 * rather than breaking the render.
 */
export interface GoalCriterion {
	name: string;
	current: number;
	required: number;
}

export interface GoalProgress {
	goal: Goal;
	/** 0..=100, one decimal. */
	progress_pct: number;
	achieved: boolean;
	criteria: GoalCriterion[];
	/** `null` when there is no measurable pace, or the work does not accumulate. */
	eta_days_at_current_pace: number | null;
}

// ---------------------------------------------------------------------------
// T1-04 Timeline
// ---------------------------------------------------------------------------

export const TIMELINE_EVENT_TYPES = [
	'signup',
	'orientation_added',
	'deliverable_verified',
	'rank_promoted',
	'capability_granted',
	'attestation_received',
	'event_participation',
	'first_bounty_earned',
	'first_mentor_session'
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export interface TimelineEvent {
	id: string;
	user_id: string;
	/** Open on purpose: the backend allowlist grows without a frontend release. */
	event_type: string;
	event_at: string;
	metadata: Record<string, unknown>;
	dedup_key: string;
}

// ---------------------------------------------------------------------------
// T2-01 Cohorts
// ---------------------------------------------------------------------------

export type CohortRole = 'member' | 'organizer';

export interface Cohort {
	id: string;
	slug: string;
	name: string;
	description: string;
	starts_at: string;
	ends_at: string;
	max_members: number;
	orientation_id: string | null;
	created_by: string | null;
	is_public: boolean;
	archived_at: string | null;
	created_at: string;
	updated_at: string;
}

/** Browse row: the cohort plus the counters the list needs. */
export interface CohortListing {
	cohort: Cohort;
	orientation_slug: string | null;
	member_count: number;
	seats_left: number;
}

/** Detail payload — same counters plus the caller's own membership. */
export interface CohortDetail extends CohortListing {
	/** `null` when the caller is not a member (or not signed in). */
	my_role: CohortRole | null;
}

/** Membership row as join / add-member return it. */
export interface CohortMember {
	cohort_id: string;
	user_id: string;
	role: CohortRole;
	joined_at: string;
}

/** Roster row: the membership with the member's name already resolved. */
export interface CohortMemberListing {
	user_id: string;
	display_name: string;
	role: CohortRole;
	joined_at: string;
}

export interface CohortMilestone {
	id: string;
	cohort_id: string;
	title: string;
	description: string;
	/** ISO date, no time. */
	target_date: string;
	created_at: string;
}

export interface CohortMessage {
	id: string;
	cohort_id: string;
	/** `null` once the author's account is gone. */
	sender_id: string | null;
	body: string;
	created_at: string;
}

/** A cohort the caller belongs to, with the role they hold in it. */
export interface MyCohort {
	cohort: Cohort;
	role: CohortRole;
}

// ---------------------------------------------------------------------------
// T2-02 Peer matching
// ---------------------------------------------------------------------------

export interface PeerEnrollment {
	user_id: string;
	orientation_id: string;
	/** Sessions per week, 1..5. */
	weekly_cadence: number;
	active: boolean;
	enrolled_at: string;
	updated_at: string;
}

export interface PeerEnrollmentListing {
	enrollment: PeerEnrollment;
	orientation_slug: string;
	orientation_name: string;
}

/** Why the matcher put this person forward — rendered under the proposal. */
export interface PeerProposalReason {
	rank_distance: number;
	/** `null` when either side has not declared a timezone. */
	timezone_distance_hours: number | null;
	shared_languages: string[];
}

export interface PeerProposal {
	user_id: string;
	display_name: string;
	rank: string;
	timezone: string | null;
	working_languages: string[];
	weekly_cadence: number;
	/** 0..=100, one decimal. */
	score: number;
	reason: PeerProposalReason;
}

export interface PeerMatch {
	id: string;
	user_a: string;
	user_b: string;
	orientation_id: string;
	weekly_cadence: number;
	matched_at: string;
	active: boolean;
	ended_at: string | null;
	match_reason: Record<string, unknown>;
}

/** Match row as the "my matches" list returns it: the peer already resolved. */
export interface PeerMatchListing {
	match: PeerMatch;
	peer: { user_id: string; display_name: string };
	orientation_slug: string;
}

export interface PeerSession {
	id: string;
	match_id: string;
	session_at: string;
	notes_a: string | null;
	notes_b: string | null;
	rating_a: number | null;
	rating_b: number | null;
	canceled: boolean;
	canceled_by: string | null;
	created_at: string;
}

// ---------------------------------------------------------------------------
// T2-03 External signals
// ---------------------------------------------------------------------------

export const EXTERNAL_SIGNAL_PROVIDERS = [
	'github',
	'medium',
	'dev_to',
	'conf_ref',
	'behance',
	'dribbble',
	'artstation',
	'vimeo',
	'foundry'
] as const;

export type ExternalSignalProvider = (typeof EXTERNAL_SIGNAL_PROVIDERS)[number];

export interface ExternalSignal {
	id: string;
	user_id: string;
	provider: ExternalSignalProvider;
	url: string;
	title: string;
	verified_at: string | null;
	verification_method: string | null;
	verified_by: string | null;
	meta: Record<string, unknown>;
	created_at: string;
}

/**
 * Signals split by confirmation state.
 *
 * The split is the whole point of the feature: verified means "we confirmed
 * this person owns the account", never "Skilluv attests to the work". The
 * backend ships a `disclaimer` string in the payload so no client can render
 * these next to badges by accident; the UI shows its own translated copy.
 */
export interface ExternalSignalBuckets {
	verified: ExternalSignal[];
	declared: ExternalSignal[];
	disclaimer: string;
}

// ---------------------------------------------------------------------------
// T3-01 AI companion
// ---------------------------------------------------------------------------

export const AI_INTERACTION_TYPES = [
	'explain',
	'generate_exercises',
	'pre_review',
	'debug_help'
] as const;

export type AiInteractionType = (typeof AI_INTERACTION_TYPES)[number];

export interface AiCompanionItem {
	title: string;
	body_markdown: string;
	kind: string;
	priority: number;
}

export interface AiCompanionAnswer {
	interaction_id: string;
	answer_markdown: string;
	items: AiCompanionItem[];
	disclosure_label: string;
	model_version: string | null;
	/** Served from cache: no model call, no quota consumed. */
	cached: boolean;
	quota_remaining: number;
}

export interface AiInteraction {
	id: string;
	user_id: string;
	interaction_type: AiInteractionType;
	prompt: string;
	skill_slug: string | null;
	status: string;
	disclosure_label: string;
	model_version: string | null;
	tokens_used: number;
	disclosed_on_deliverable_id: string | null;
	disclosed_at: string | null;
	request_hash: string | null;
	created_at: string;
}

export interface AiCompanionQuota {
	daily_quota: number;
	used: number;
	remaining: number;
	/** How far back the disclosure sweep reaches when a deliverable is submitted. */
	disclosure_window_days: number;
}

// ---------------------------------------------------------------------------
// T3-02 Talent offers
// ---------------------------------------------------------------------------

export const TALENT_OFFER_TYPES = [
	'pair_programming',
	'code_review',
	'whiteboard',
	'mock_interview',
	'career_advice'
] as const;

export type TalentOfferType = (typeof TALENT_OFFER_TYPES)[number];

export interface TalentOffer {
	id: string;
	user_id: string;
	offer_type: TalentOfferType;
	skill_id: string | null;
	availability_hours: number;
	/** `null` means free. */
	price_cents_per_hour: number | null;
	description: string;
	active: boolean;
	created_at: string;
	updated_at: string;
}

/** Browse row: the offer with its author and skill already resolved. */
export interface TalentOfferListing {
	id: string;
	user_id: string;
	display_name: string;
	username: string;
	rank: string;
	offer_type: TalentOfferType;
	skill_id: string | null;
	skill_slug: string | null;
	availability_hours: number;
	price_cents_per_hour: number | null;
	description: string;
	created_at: string;
}

// ---------------------------------------------------------------------------
// T3-03 Vouchings
// ---------------------------------------------------------------------------

export type VouchingStake = 'rank_temporary' | 'reputation_only';

export interface Vouching {
	id: string;
	voucher_id: string;
	vouched_id: string;
	active_until: string;
	at_stake_kind: VouchingStake;
	statement: string;
	broken_at: string | null;
	break_reason: string | null;
	broken_by: string | null;
	created_at: string;
}

/**
 * Public row on a profile: who vouched, what they said, what they staked.
 *
 * SKI-301 added `voucher_username`. Profiles are addressed by username, so
 * the display name alone could never be turned into a link — it 404s on the
 * first space or accent. Both are nullable because the backend resolves them
 * through a LEFT JOIN: a deleted account leaves the vouching without a party
 * rather than failing the whole listing.
 */
export interface PublicVouching {
	id: string;
	voucher_id: string;
	voucher_username: string | null;
	voucher_display_name: string | null;
	statement: string;
	active_until: string;
	at_stake_kind: VouchingStake;
}

/**
 * One row of `GET /users/me/vouchings`, carrying the *other* party.
 *
 * Which side "other" means depends on the bucket: on `given` it is the person
 * backed, on `received` it is the backer. The vouching fields are flattened
 * into the same object server-side, so this extends `Vouching` rather than
 * nesting it.
 */
export interface VouchingWithParty extends Vouching {
	other_user_id: string;
	other_username: string | null;
	other_display_name: string | null;
}

/** The three states a vouching can be listed under in moderation. */
export const VOUCHING_QUEUE_STATUSES = ['live', 'broken', 'expired'] as const;
export type VouchingQueueStatus = (typeof VOUCHING_QUEUE_STATUSES)[number];

/**
 * One row of the moderation queue (SKI-297).
 *
 * Both parties are resolved, and `vouched_user_flagged` is what turns a
 * listing into a queue: the backend sorts on it, so a mentee already under
 * suspicion comes first. `voucher_rank` is the raw rank — what breaking the
 * vouching would cost, shown before the moderator imposes it.
 */
export interface VouchingQueueRow {
	id: string;
	status: VouchingQueueStatus;
	voucher_id: string;
	voucher_username: string | null;
	voucher_display_name: string | null;
	voucher_rank: string;
	vouched_id: string;
	vouched_username: string | null;
	vouched_display_name: string | null;
	vouched_user_flagged: boolean;
	at_stake_kind: VouchingStake;
	statement: string;
	active_until: string;
	created_at: string;
	broken_at: string | null;
	broken_by: string | null;
	break_reason: string | null;
}

// ---------------------------------------------------------------------------
// T3-04 Skill tree
// ---------------------------------------------------------------------------

export const SKILL_TREE_STATUSES = ['locked', 'unlocked', 'in_progress', 'mastered'] as const;
export type SkillTreeStatus = (typeof SKILL_TREE_STATUSES)[number];

export interface MissingPrerequisite {
	id: string;
	slug: string;
	display_name: string;
}

export interface SkillTreeNode {
	id: string;
	slug: string;
	display_name: string;
	domain: string;
	display_category: string;
	parent_id: string | null;
	prerequisite_skill_ids: string[];
	/** What to surface on a locked node: the prerequisites still unproven. */
	missing_prerequisites: MissingPrerequisite[];
	status: SkillTreeStatus;
	proven_count: number;
	proficiency_level: number;
	children: SkillTreeNode[];
}

export interface SkillTreeResponse {
	user_id: string;
	tree: SkillTreeNode[];
	/** Node count per status, so a summary needs no tree walk. */
	counts: Partial<Record<SkillTreeStatus, number>>;
}
