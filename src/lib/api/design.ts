import type {
	ApiResponse,
	DesignAutoCheck,
	DesignComparison,
	DesignIterationStory,
	DesignProfile,
	DesignReviewRound,
	DesignTiers,
	DesignVerdict,
	DesignVersionAtRound,
	NextChallenge,
	SetAvailabilityRequest,
	Tournament
} from '$lib/types';
import { DESIGN_CONTEST_KIND } from '$lib/types';
import { createApiClient } from './client';
import { dashboardApi } from './dashboard';
import { tournamentApi } from './tournament';

const api = createApiClient();

export interface SubmitVersionRequest {
	/** A versioned Figma node, a hosted board, a published project, a stored object. */
	artifact_url: string;
	/** What changed since the previous version — the most useful line on any revision. */
	notes_md?: string;
}

export interface DesignReviewRequest {
	verdict: DesignVerdict;
	/** Required for `iterate` and `reject`. */
	blocking_reason?: string;
	/** At least 40 characters when the verdict is not an approval. */
	feedback_md?: string;
	/** The family grid, filled in. Criteria live in `review_grids` server-side. */
	grid_scores?: Record<string, unknown>;
}

export const designApi = {
	/**
	 * A designer's public record: craft score with its breakdown, verified
	 * artefacts with the number of critique rounds each took, contest
	 * standings, validated trades and design attestations.
	 *
	 * Addressed by username, unlike the id-addressed Post-MVP endpoints, so
	 * it works on anyone's profile without the UUID that SKI-300 is about.
	 */
	profile(username: string) {
		return api.get<ApiResponse<DesignProfile>>(`/users/${username}/design-profile`);
	},

	/**
	 * Set your mission availability — the badge, the rate range, the next-free
	 * date.
	 *
	 * A whole-state write, not a patch: every field is stored as sent, so
	 * omitting one clears it. Callers send the complete object they rendered.
	 */
	setAvailability(payload: SetAvailabilityRequest) {
		return api.put<ApiResponse<unknown>>('/users/me/availability', payload);
	},

	/** Force a recompute of the caller's own score. */
	recomputeMine() {
		return api.post<ApiResponse<unknown>>('/users/me/design-profile/recompute');
	},

	/** Tier ladder and the weights behind the score, for the legend. */
	tiers() {
		return api.get<ApiResponse<DesignTiers>>('/design/tiers');
	},

	/** Hand in a new version of a design slice. */
	submitVersion(sliceId: string, payload: SubmitVersionRequest) {
		return api.post<ApiResponse<unknown>>(`/design/slices/${sliceId}/versions`, payload);
	},

	/** The whole critique trail on a slice. Readable by anyone. */
	reviewHistory(sliceId: string) {
		return api.get<ApiResponse<{ rounds: DesignReviewRound[] }>>(
			`/design/slices/${sliceId}/reviews`
		);
	},

	review(sliceId: string, payload: DesignReviewRequest) {
		return api.post<ApiResponse<unknown>>(`/design/slices/${sliceId}/reviews`, payload);
	},

	/** What the caller is competent to judge. */
	reviewerQueue(limit?: number) {
		return api.get<ApiResponse<unknown>>('/design/reviews/queue', { limit });
	},

	/**
	 * Two rounds side by side, and every critique written between them.
	 *
	 * `from` must be strictly before `to` or the server answers 400 — the
	 * caller orders the pair, because a comparison read backwards is a
	 * comparison that tells the wrong story about who moved.
	 */
	compare(sliceId: string, from: number, to: number) {
		return api.get<ApiResponse<{ comparison: DesignComparison }>>(
			`/design/slices/${sliceId}/compare`,
			{ from, to }
		);
	},

	/** One version, as it stood when it was reviewed. */
	versionAt(sliceId: string, round: number) {
		return api.get<ApiResponse<{ version: DesignVersionAtRound }>>(
			`/design/slices/${sliceId}/versions/${round}`
		);
	},

	/**
	 * What the automatic checks found, oldest round first.
	 *
	 * Public like the critique trail, and for the same reason: a reader who
	 * can see the verdict should be able to see what the machine said about
	 * it. None of it is a verdict — an `error` can sit on an approved version.
	 */
	autoChecks(sliceId: string) {
		return api.get<ApiResponse<{ checks: DesignAutoCheck[] }>>(
			`/design/slices/${sliceId}/auto-checks`
		);
	},

	/**
	 * Validated work that took three rounds or more, newest first.
	 *
	 * The one thing a portfolio of finished images can never show: a direction
	 * questioned, and somebody who came back.
	 */
	iterationStories(username: string, limit?: number) {
		return api.get<ApiResponse<{ stories: DesignIterationStory[] }>>(
			`/design/users/${encodeURIComponent(username)}/iteration-stories`,
			{ limit }
		);
	}
};

/**
 * The design domain's slice of the suggestion engine.
 *
 * A thin call over `dashboardApi.nextChallenges`, which is the one client for
 * `/users/me/next-challenges`: the endpoint is domain-parameterised and a
 * second client would be a second place for the shape to drift.
 */
export async function designSuggestions(limit?: number): Promise<NextChallenge[]> {
	const res = await dashboardApi.nextChallenges({ domain: 'design', limit });
	return res.data?.suggestions ?? [];
}

/**
 * Design contests, from the tournament listing.
 *
 * A design contest is a `brief_contest` scoped to the `design` domain — the
 * backend is explicit that a contest is the same event whatever its subject,
 * so there is no design-specific contest API to call.
 *
 * Narrowed **server-side** since SKI-302 added `kind` and `skill_domain` to the
 * query. This used to ask for a page capped at 200 and filter in memory, which
 * held at launch volume and would have silently dropped the oldest design
 * contests once the platform ran more than two hundred tournaments.
 *
 * `skill_domain=design` already returns the contests open to every domain
 * alongside the design ones, so nothing is added back here.
 */
export async function listDesignContests(params?: {
	status?: string;
	upcoming?: boolean;
	limit?: number;
}): Promise<Tournament[]> {
	const res = await tournamentApi.list({
		kind: DESIGN_CONTEST_KIND,
		skill_domain: 'design',
		...params
	});
	return res.data?.tournaments ?? [];
}
