/**
 * What companies are asking of you.
 *
 * The talent half of the TALENT pillar (`business-model/02-talent-line.md`).
 * Five reads and four gestures, all served and none called — which is why
 * somebody could publish a "job wanted", receive pitches, and never see one.
 */

// ---------------------------------------------------------------------------
// Reverse recruitment — you post, companies pitch to you
// ---------------------------------------------------------------------------

/**
 * The "job wanted" you published.
 *
 * `pitches_left_this_month` is on the posting rather than hidden in a quota
 * table: it is what a company needs to know before writing four hundred words.
 */
export interface ReverseRecruitmentPosting {
	id: string;
	talent_user_id: string;
	username: string;
	title: string;
	desired_role: string;
	desired_domain: string;
	desired_orientations: string[];
	desired_salary_range: Record<string, unknown> | null;
	remote_only: boolean;
	preferred_countries: string[];
	available_from: string;
	/** What you do not want to be pitched. Read by companies before they write. */
	not_looking_for: string | null;
	status: string;
	pitches_left_this_month: number;
}

/**
 * A company's argument for hiring you.
 *
 * Reading the list marks the sent ones as read, because a company that spent
 * credits is owed the knowledge that their argument was opened. That is not
 * an answer and the page does not present it as one.
 */
export interface ReverseRecruitmentPitch {
	id: string;
	posting_id: string;
	enterprise_id: string;
	company_name: string;
	pitch_md: string;
	/** NUMERIC over JSON: a decimal string. */
	offered_salary: string | null;
	currency: string | null;
	/** `sent`, `read`, `interested`, `declined`. */
	status: string;
	decline_reason: string | null;
	created_at: string;
}

export interface PitchResponse {
	interested: boolean;
	/**
	 * Optional on purpose: somebody declining ten pitches should not have to
	 * justify each one.
	 */
	reason?: string;
}

// ---------------------------------------------------------------------------
// Managed recruitment campaigns
// ---------------------------------------------------------------------------

/** A campaign you were shortlisted for. */
export interface RecruitmentInvitation {
	campaign_id: string;
	title: string;
	target_role: string;
	company_name: string;
	brief_md: string;
	salary_range: Record<string, unknown> | null;
	/** Your own state in the shortlist, not the campaign's. */
	my_status: string;
}

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

/** One proposed time. Both ends, because a start with no end is not a slot. */
export interface InterviewSlot {
	start: string;
	end: string;
}

export interface Interview {
	id: string;
	/** What the interview came out of — a contest, a campaign, a posting. */
	source_type: string;
	source_id: string;
	talent_user_id: string;
	enterprise_id: string;
	proposed_slots: InterviewSlot[];
	confirmed_slot: InterviewSlot | null;
	platform: string | null;
	meeting_url: string | null;
	location: string | null;
	status: string;
	created_at: string;
}

// ---------------------------------------------------------------------------
// Trial periods
// ---------------------------------------------------------------------------

/**
 * A paid trial before a permanent hire.
 *
 * `approved_hours` counts only what the company signed off. Claimed but
 * unapproved is not money owed, and showing it as a total would be showing a
 * figure nobody agreed to — so the two are separate fields and stay separate
 * on the page.
 */
export interface Trial {
	id: string;
	enterprise_id: string;
	talent_user_id: string;
	username: string;
	duration_weeks: number;
	hourly_rate: string;
	currency: string;
	platform_fee_percent: string;
	converted_success_fee_percent: string | null;
	started_at: string;
	ends_at: string;
	ended_at: string | null;
	outcome: string | null;
	approved_hours: string;
	pending_hours: string;
}

/** A day claimed on a trial. The summary is what the client approves against. */
export interface TrialHoursEntry {
	id: string;
	worked_on: string;
	hours: string;
	summary: string;
	approved_at: string | null;
	rejected_at: string | null;
	rejection_reason: string | null;
}

export interface TrialHours {
	hours: TrialHoursEntry[];
	approved_total: string;
	pending_total: string;
}

export interface LogHoursRequest {
	/** A date, not a timestamp: a day of work is claimed as a day. */
	worked_on: string;
	/** NUMERIC over JSON, sent as a string so nothing is lost on the way. */
	hours: string;
	summary: string;
}

/** Longest summary the backend accepts, mirrored for the form. */
export const TRIAL_SUMMARY_MAX = 2000;
export const PITCH_DECLINE_REASON_MAX = 2000;
