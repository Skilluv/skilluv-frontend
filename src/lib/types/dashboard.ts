/**
 * What the platform knows is waiting for you.
 *
 * Five endpoints served under `/users/me/**` that no page called, which is
 * why `/dashboard` had sub-pages and no home: there was nothing to put on it.
 */

/** A brief claimed alone, or one many people answer and that is ranked. */
export const SUGGESTION_FORMATS = ['individual', 'contest'] as const;
export type SuggestionFormat = (typeof SUGGESTION_FORMATS)[number];

/**
 * One thing worth doing next.
 *
 * `reasons` is the substance and not decoration: the backend returns it
 * rather than logging it, because a recommendation nobody can argue with is
 * a recommendation nobody trusts. One clause per point awarded.
 *
 * The list is cached for an hour server-side — its inputs move over days, and
 * advice that changed on every page load would stop reading as advice.
 */
export interface NextChallenge {
	/** A slice id for `individual`, a tournament id for `contest`. */
	id: string;
	slug: string | null;
	title: string;
	format: SuggestionFormat;
	orientation_slug: string | null;
	/** The reviewer family the trade belongs to. */
	family: string | null;
	difficulty: number | null;
	estimated_hours: number | null;
	/** When a contest stops taking entries. Absent on an individual brief. */
	closes_at: string | null;
	score: number;
	reasons: string[];
}

export interface NextChallengesResponse {
	suggestions: NextChallenge[];
	/** True when it came from the hour-long cache rather than a fresh pass. */
	cached?: boolean;
}

/** An invitation to a company's contest, waiting on an answer. */
export interface ContestInvitation {
	contest_id: string;
	slug: string;
	title: string;
	kind: string;
	deadline: string | null;
	invited_at: string;
	/** Null while it is still waiting on you. */
	accepted_at: string | null;
}

/** An event you joined, and what was counted for it. */
export interface MyEvent {
	event_slug: string;
	event_name: string;
	role: string;
	joined_at: string;
	/** The PR or repository counted for this event. */
	contribution_ref: string | null;
}

/**
 * A mentoring subscription, on either side.
 *
 * The same row serves the mentor and the mentee, so which one you are is read
 * from the ids rather than from a flag.
 */
export interface MentorSubscription {
	id: string;
	mentor_user_id: string;
	mentee_user_id: string;
	monthly_fee_cents: number;
	currency: string;
	/** NUMERIC over JSON: a decimal string. */
	platform_percent: string;
	sessions_included: number;
	current_period_end: string;
	/** False once somebody stopped it. What was paid for still runs to its end. */
	auto_renew: boolean;
}

/** A project you steward, and in what role. */
export interface ProjectStewardship {
	project_id: string;
	user_id: string;
	role: string;
	appointed_at: string;
	ended_at: string | null;
	appointed_by_user_id: string | null;
}
