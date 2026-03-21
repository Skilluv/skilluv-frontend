// ============================================
// Types Skilluv — basés sur API-ROUTES.md
// ============================================

// --- Enums ---

export type SkillDomain = 'code' | 'design' | 'game' | 'security';
export type Title = 'apprenti' | 'artisan' | 'maitre' | 'legende';
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
export type Theme = 'forge' | 'neon' | 'arena' | 'terminal';

export type NotificationType =
	| 'interest_request_received'
	| 'interest_accepted'
	| 'interest_declined'
	| 'new_message'
	| 'challenge_approved'
	| 'challenge_rejected'
	| 'account_banned'
	| 'account_unbanned';

// --- Modèles principaux ---

export interface UserPrivate {
	id: string;
	email: string;
	username: string;
	first_name: string;
	last_name: string;
	display_name: string;
	skill_domain: SkillDomain;
	title: Title;
	golden_stars: number;
	total_fragments: number;
	streak_current: number;
	trust_score: number;
	country: string | null;
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
}

export interface UserPublic {
	username: string;
	display_name: string;
	title: Title;
	golden_stars: number;
	skill_domain: SkillDomain;
	country: string | null;
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
	};
	meta: ApiMeta;
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
	AUTH_EMAIL_2FA_INVALID: 'AUTH_EMAIL_2FA_INVALID',
	CHALLENGE_PREREQUISITE_NOT_MET: 'CHALLENGE_PREREQUISITE_NOT_MET',
	RATE_LIMITED: 'RATE_LIMITED',
	CONTACT_COOLDOWN_ACTIVE: 'CONTACT_COOLDOWN_ACTIVE',
	CONTACT_ALREADY_REQUESTED: 'CONTACT_ALREADY_REQUESTED',
	CONTACT_BLOCKED: 'CONTACT_BLOCKED',
	CONVERSATION_CLOSED: 'CONVERSATION_CLOSED'
} as const;
