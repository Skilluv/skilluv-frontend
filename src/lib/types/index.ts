// ============================================
// Types Skilluv — basés sur API-ROUTES.md + MVP.md P16-P25
// ============================================

// Réutilisation source de vérité unique pour les types badge/rang.
// Voir src/lib/components/badges/types.ts pour les définitions primitives.
import type {
	Rarity,
	RankLevel,
	BadgeFamily,
	SkillCategory,
	KeyType,
	BadgeSize
} from '$lib/components/badges/types';
export type { Rarity, RankLevel, BadgeFamily, SkillCategory, KeyType, BadgeSize };
export { RANK_NAMES } from '$lib/components/badges/types';

// --- Enums ---

export type SkillDomain = 'code' | 'design' | 'game' | 'security';

/** @deprecated Remplacé par Rank (5 valeurs) — voir MVP §0.7. Reste supporté 6 mois pour portfolios historiques. */
export type Title = 'apprenti' | 'artisan' | 'maitre' | 'legende';

/** Rang canonique P17 — 5 paliers Apprenti → Doyen. */
export type Rank = 'apprenti' | 'ranger' | 'artisan' | 'maitre' | 'doyen';
export type ChallengeDifficulty = 1 | 2 | 3 | 4 | 5;
export type ChallengeMode = 'solo' | 'team';
export type ChallengeTone = 'serious' | 'fun' | 'educational';
export type ChallengeStatus = 'draft' | 'published' | 'archived';
export type CommunityStatus = 'draft' | 'review' | 'approved' | 'rejected' | null;
export type LeaderboardDomain = 'global' | 'code' | 'design' | 'game' | 'security';
export type LeaderboardPeriod = 'alltime' | 'weekly' | 'monthly';
export type ReportTargetType = 'user' | 'challenge' | 'message' | 'enterprise';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'cheating' | 'fake_profile' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';
export type InterestStatus = 'pending' | 'accepted' | 'declined';
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
export type UserRole = 'user' | 'recruiter' | 'enterprise' | 'admin';
export type ThemeBase = 'forge' | 'vesperal' | 'arena' | 'scriptorium' | 'sakura';
export type ThemeMode = 'dark' | 'light';
export type Theme = ThemeBase | `${ThemeBase}-light`;

export type NotificationType =
	| 'interest_request_received'
	| 'interest_accepted'
	| 'interest_declined'
	| 'new_message'
	| 'challenge_approved'
	| 'challenge_rejected'
	| 'account_banned'
	| 'account_unbanned'
	| 'rank_promotion'
	| 'badge_earned'
	| 'team_slot_match'
	| 'payout_status_change';

/** Capabilities P18.4 — sources de permissions user (mentor, curator, etc.). */
export type Capability =
	| 'challenger'
	| 'mentor'
	| 'project_steward'
	| 'pr_reviewer'
	| 'bounty_funder'
	| 'issue_proposer'
	| 'jury_tournament'
	| 'admin'
	| 'enterprise_recruiter'
	| 'community_moderator'
	| 'forum_moderator'
	| 'plagiarism_reviewer'
	| 'kyc_reviewer'
	| 'community_curator';

/** Type d'entreprise P24 — drive les sections conditionnelles dashboard/register. */
export type EnterpriseType = 'direct_hire' | 'staffing_agency' | 'remote_international';

/** Mode d'engagement d'un user sur une orientation. */
export type OrientationMode = 'learning' | 'active';

/** Statut d'une demande de payout wallet. */
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';

/** Méthode de payout supportée (Stripe Connect ou Mobile Money Afrique). */
export type PayoutMethod = 'stripe' | 'mobile_money';

// --- Modèles principaux ---

export interface UserPrivate {
	id: string;
	email: string;
	username: string;
	first_name: string;
	last_name: string;
	display_name: string;
	/** Global role — 'user' (candidate), 'recruiter', 'enterprise' (workspace
	 * owner), or 'admin'. Drives the enterprise layout guard client-side. */
	role: UserRole;
	/** NULL until the OAuth/magic-link user picks their domain during onboarding. */
	skill_domain: SkillDomain | null;
	/** True once the user has picked a skill_domain AND accepted the terms. Drives the
	 * onboarding gate in `hooks.server.ts`. */
	profile_completed: boolean;
	title: Title;
	golden_stars: number;
	total_fragments: number;
	streak_current: number;
	trust_score: number;
	country: string | null;
	city: string | null;
	bio: string | null;
	avatar_url: string | null;
	github: string | null;
	linkedin: string | null;
	website: string | null;
	twitter: string | null;
	email_verified: boolean;
	totp_enabled: boolean;
	email_2fa_enabled: boolean;
	profile_active: boolean;
	created_at: string;
	/** Present on recruiter/enterprise accounts — the tenant the user
	 * belongs to. NULL for regular candidates. Populated by the backend
	 * on /auth/me and consumed by enterprise pages that scope resources
	 * to the current company (e.g. bounties list filter). */
	enterprise_name?: string | null;
	/** P18.4 — capabilities de contribution actives. Peuplé par /users/me/capabilities. */
	capabilities?: Capability[];
	/** P16 — orientations métier choisies (1-3). Cap enforced côté UI. */
	orientations?: UserOrientation[];
	/** P17 — rang canonique 5 paliers. Remplace progressivement `title`. */
	rank?: Rank;
	/** P24 — type d'entreprise pour comptes enterprise/recruiter. */
	enterprise_type?: EnterpriseType;
}

export interface UserPublic {
	/** User id — surfaced so enterprise flows can reference the target
	 * user (add to a list, open messaging, promote to pipeline, etc.).
	 * Backend returns it in the public projection for authenticated
	 * enterprise/recruiter callers; kept optional to preserve backward
	 * compatibility with candidate-facing consumers. */
	id?: string;
	username: string;
	display_name: string;
	title: Title;
	golden_stars: number;
	skill_domain: SkillDomain;
	country: string | null;
	city: string | null;
	bio: string | null;
	avatar_url: string | null;
	github: string | null;
	linkedin: string | null;
	website: string | null;
	twitter: string | null;
	member_since: string;
}

export interface Challenge {
	id: string;
	title: string;
	description: string;
	instructions: string;
	skill_domain: SkillDomain;
	difficulty: ChallengeDifficulty;
	mode: ChallengeMode;
	duration_minutes: number | null;
	ai_allowed: boolean;
	tone: ChallengeTone;
	language: string | null;
	prerequisite_fragments: number;
	reward_fragments: number;
	is_onboarding: boolean;
	status: ChallengeStatus;
	is_community: boolean;
	community_status: CommunityStatus;
	featured: boolean;
	vote_count: number;
	test_cases: unknown | null;
	expected_output: string | null;
	created_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface Submission {
	id: string;
	challenge_id: string;
	user_id: string;
	code: string;
	language: string | null;
	status: string;
	fragments_earned: number;
	started_at: string;
	submitted_at: string | null;
	evaluated_at: string | null;
}

export interface Notification {
	id: string;
	user_id: string;
	notification_type: NotificationType;
	title: string;
	body: string | null;
	data: unknown | null;
	read: boolean;
	created_at: string;
}

export interface Message {
	id: string;
	conversation_id: string;
	sender_id: string;
	content: string;
	read_at: string | null;
	created_at: string;
}

export interface Conversation {
	id: string;
	closed: boolean;
	other_party: {
		type: 'user' | 'enterprise';
		name: string;
		username?: string;
	};
	last_message?: Message;
	unread_count: number;
	created_at: string;
}

export interface InterestRequest {
	id: string;
	talent_id?: string;
	talent_username?: string;
	talent_display_name?: string;
	enterprise_id?: string;
	enterprise_name?: string;
	enterprise_logo?: string;
	status: InterestStatus;
	initial_message: string;
	created_at: string;
}

export interface Enterprise {
	id: string;
	company_name: string;
	description: string | null;
	website: string | null;
	logo_url: string | null;
	industry: string | null;
	company_size: CompanySize;
	country: string | null;
}

export interface SkillNode {
	domain: SkillDomain;
	total_fragments: number;
	skills: {
		name: string;
		fragments: number;
		max_fragments: number;
	}[];
}

export interface HeatmapEntry {
	activity_date: string;
	challenges_completed: number;
	fragments_earned: number;
}

export interface LeaderboardEntry {
	rank: number;
	user_id: string;
	username: string;
	display_name: string;
	title: Title;
	golden_stars: number;
	country: string | null;
	score: number;
}

export interface TalentCard {
	id: string;
	username: string;
	display_name: string;
	skill_domain: SkillDomain;
	title: Title;
	golden_stars: number;
	total_fragments: number;
	streak_current: number;
	country: string | null;
	member_since: string;
	top_skills?: { name: string; fragments: number }[];
	badge_count?: number;
	is_bookmarked?: boolean;
}

export interface Report {
	id: string;
	target_type: ReportTargetType;
	target_id: string;
	reason: ReportReason;
	details: string | null;
	status: ReportStatus;
	created_at: string;
}

export interface PrivacySettings {
	show_email: boolean;
	show_heatmap: boolean;
	show_skill_tree: boolean;
	show_badges: boolean;
	show_streak: boolean;
	allow_interest_requests: boolean;
}

export interface Team {
	id: string;
	name: string;
	challenge_id: string;
	max_members: number | null;
	members: { user_id: string; username: string; display_name: string }[];
	member_count: number;
}

export interface SandboxExecution {
	execution: {
		stdout: string | null;
		stderr: string | null;
		compile_output: string | null;
		time: string | null;
		memory: number | null;
		status: { id: number; description: string };
	};
	verdict: string;
	success: boolean;
}

export interface SandboxLanguage {
	id: number;
	name: string;
}

// --- P16 : Orientations métier ---

/** Catalogue orientation (public). 31 orientations curated côté backend. */
export interface Orientation {
	id: string;
	slug: string;
	name: string;
	description: string;
	primary_domain: SkillDomain;
	secondary_domains: SkillDomain[];
	tags: string[];
	is_curated: boolean;
	is_archived: boolean;
}

/** Orientation user (relation many-to-many enrichie). */
export interface UserOrientation {
	orientation_slug: string;
	orientation_name: string;
	mode: OrientationMode;
	is_primary: boolean;
	started_at: string;
	ended_at?: string | null;
	working_languages: string[];
	timezone?: string;
	notes?: string;
}

/** Item playlist onboarding orientation (challenges + team slots recommandés). */
export interface OrientationPlaylistItem {
	type: 'challenge' | 'team_slot';
	id: string;
	title: string;
	description?: string;
	difficulty?: ChallengeDifficulty;
	reward_fragments?: number;
	role_slug?: string;
	team_id?: string;
	challenge_id?: string;
}

// --- P18.4 : Capabilities ---

export interface UserCapability {
	capability: Capability;
	granted_at: string;
	granted_reason: string;
	expires_at?: string | null;
}

// --- P17 : Badges Proof Engine ---

/** Item badge polymorphique (utilisé dans UserBadgesResponse). */
export interface BadgeItem {
	rule_slug?: string;
	output_type?: BadgeFamily;
	output_variant?: string;
	display_name?: string;
	rarity: Rarity;
	earned_at: string;
	source_proofs_count: number;
}

/** Sous-structure rang dans UserBadgesResponse. */
export interface RankStatus {
	rank: Rank;
	achieved_at: string;
	previous_rank?: Rank;
}

/** Réponse GET /api/users/{id}/badges — projection polymorphique. */
export interface UserBadgesResponse {
	user_id: string;
	rank: RankStatus;
	skill_patches: BadgeItem[];
	medals: BadgeItem[];
	challenge_seals_count: number;
	event_stamps_count: number;
	guild_crests: BadgeItem[];
	total_badges: number;
}

/** Règle catalogue (GET /api/badge-rules). */
export interface BadgeRule {
	slug: string;
	output_type: BadgeFamily;
	output_variant?: string;
	display_name: string;
	description: string;
	rarity: Rarity;
	criteria: Record<string, unknown>;
}

// --- P17.6 : Events + participation ---

export interface BadgeEvent {
	id: string;
	slug: string;
	name: string;
	description: string;
	starts_at: string;
	ends_at?: string;
	visual_theme: Record<string, unknown>;
	is_partner: boolean;
}

export interface UserBadgeEvent {
	event: BadgeEvent;
	joined_at: string;
	stamp_earned: boolean;
}

// --- P24 : Enterprise types + agency clients ---

export interface TypeConfigStaffing {
	commission_rate?: number;
	brand_white_label?: boolean;
	default_client_id?: string;
}

export interface TypeConfigRemoteIntl {
	eor_provider?: 'deel' | 'remote' | 'oyster';
	preferred_currency?: string;
	timezone_requirement?: string;
	tax_withholding_country?: string;
}

export type EnterpriseTypeConfig = TypeConfigStaffing | TypeConfigRemoteIntl | Record<string, never>;

export interface AgencyClient {
	id: string;
	client_name: string;
	client_contact_email?: string;
	notes?: string;
	active: boolean;
	created_at: string;
}

// --- P10 + P15.3 : Team marketplace + role slots ---

export interface TeamRoleSlot {
	slot_id: string;
	role_slug: string;
	role_display_name?: string;
	min_proficiency_level: number;
	required_skill_slug?: string;
	filled_by?: string | null;
	created_at: string;
}

export interface TeamMarketplaceSlot extends TeamRoleSlot {
	team_id: string;
	team_name: string;
	challenge_id: string;
	challenge_title: string;
}

// --- P13 : Talent wallet + payouts (aligné backend) ---

/** Statut KYC Stripe Connect côté wallet backend. */
export type StripeKycStatus = 'pending' | 'verified' | 'rejected' | 'restricted';

/** Wallet complet retourné par GET /users/me/wallet — balances dual devise
 * (EUR pour Stripe, XOF pour Mobile Money) + statuts providers embarqués. */
export interface Wallet {
	user_id: string;
	balance_eur: string;
	balance_xof: string;
	residency_country: string | null;
	stripe_account_id: string | null;
	stripe_kyc_status: StripeKycStatus;
	momo_phone: string | null;
	momo_phone_verified: boolean;
	created_at: string;
	updated_at: string;
}

/** Ligne du ledger — inclut hash-chain audit trail. */
export interface WalletTransaction {
	id: string;
	user_id: string;
	delta: string;
	currency: 'EUR' | 'XOF';
	reason: string;
	related_slice_id?: string | null;
	related_provider_txn_id?: string | null;
	notes?: string | null;
	ledger_hash: string;
	prev_ledger_hash?: string | null;
	created_at: string;
}

// --- P25 : Moderation inline (aligné backend) ---

/** Actions supportées par POST /forum/posts/{id}/moderate. */
export type ForumModerateAction = 'hide' | 'unhide' | 'lock' | 'unlock';

/** Scope d'un mute forum : réduit à un espace ou étendu. */
export type MuteScope = 'forum' | 'community' | 'all';

export interface ModerationAction {
	action: ForumModerateAction | 'approve' | 'reject' | 'mark_valid' | 'revoke';
	reason?: string;
	duration_hours?: number;
}

// --- Utilitaires migration Title ↔ Rank ---

/** Migration douce Title (legacy P5) → Rank (P17). Voir MVP §0.7. */
export function rankFromTitle(title: Title): Rank {
	switch (title) {
		case 'apprenti':
			return 'apprenti';
		case 'artisan':
			return 'artisan';
		case 'maitre':
			return 'maitre';
		case 'legende':
			return 'doyen';
	}
}

// --- Réponses API ---

export interface ApiMeta {
	request_id: string;
	timestamp: string;
}

export interface ApiPagination {
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}

export interface ApiResponse<T> {
	data: T;
	meta: ApiMeta;
}

export interface ApiPaginatedResponse<T> {
	data: T[];
	pagination: ApiPagination;
	meta: ApiMeta;
}

export interface ApiErrorBody {
	error: {
		code: string;
		message: string;
		details?: unknown;
		/** Present on AUTH_SSO_REQUIRED — points at the enterprise SSO start URL
		 * the user must redirect to. */
		start_url?: string;
	};
	meta: ApiMeta;
}

/** How the current session was authenticated. Drives the mandatory-TOTP
 * bypass for `role in ('enterprise', 'recruiter')` when set to `sso` (the
 * external IdP is responsible for MFA). */
export type LoginMethod = 'password' | 'oauth' | 'sso' | 'magic_link' | 'webauthn';

/** Response payload from GET /api/enterprise/sso/discover?email=x@y */
export interface SsoDiscoverResponse {
	sso_available: boolean;
	start_url?: string;
}

/** Extension to login/register responses: when true, the caller must complete
 * TOTP setup before accessing `/enterprise/*` endpoints. */
export interface RequiresTotpSetup {
	requires_totp_setup?: boolean;
}

// --- Codes d'erreur connus ---

export const ERROR_CODES = {
	RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
	AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
	AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
	AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	AUTH_TOTP_REQUIRED: 'AUTH_TOTP_REQUIRED',
	AUTH_TOTP_INVALID: 'AUTH_TOTP_INVALID',
	/** Enterprise/recruiter account tried to access `/enterprise/*` without
	 * having completed TOTP setup. Redirect to /settings/security. */
	AUTH_TOTP_SETUP_REQUIRED: 'AUTH_TOTP_SETUP_REQUIRED',
	/** Password login refused because the email domain is behind an enforced
	 * SSO. Redirect to `error.start_url`. */
	AUTH_SSO_REQUIRED: 'AUTH_SSO_REQUIRED',
	/** Write endpoints and /enterprise/* refuse the call until the user has
	 * clicked the verification link in their email. The EmailVerificationBanner
	 * (mounted in the root layout) is the standing prompt to resend. */
	AUTH_EMAIL_VERIFY_REQUIRED: 'AUTH_EMAIL_VERIFY_REQUIRED',
	AUTH_EMAIL_2FA_INVALID: 'AUTH_EMAIL_2FA_INVALID',
	CHALLENGE_PREREQUISITE_NOT_MET: 'CHALLENGE_PREREQUISITE_NOT_MET',
	RATE_LIMITED: 'RATE_LIMITED',
	CONTACT_COOLDOWN_ACTIVE: 'CONTACT_COOLDOWN_ACTIVE',
	CONTACT_ALREADY_REQUESTED: 'CONTACT_ALREADY_REQUESTED',
	CONTACT_BLOCKED: 'CONTACT_BLOCKED',
	CONVERSATION_CLOSED: 'CONVERSATION_CLOSED'
} as const;
