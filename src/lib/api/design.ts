import type {
	ApiResponse,
	DesignProfile,
	DesignTiers,
	DesignVerdict,
	Tournament
} from '$lib/types';
import { DESIGN_CONTEST_KIND } from '$lib/types';
import { createApiClient } from './client';
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
		return api.get<ApiResponse<unknown>>(`/design/slices/${sliceId}/reviews`);
	},

	review(sliceId: string, payload: DesignReviewRequest) {
		return api.post<ApiResponse<unknown>>(`/design/slices/${sliceId}/reviews`, payload);
	},

	/** What the caller is competent to judge. */
	reviewerQueue(limit?: number) {
		return api.get<ApiResponse<unknown>>('/design/reviews/queue', { limit });
	}
};

/**
 * Design contests, from the tournament listing.
 *
 * A design contest is a `brief_contest` scoped to the `design` domain — the
 * backend is explicit that a contest is the same event whatever its subject,
 * so there is no design-specific contest API to call.
 *
 * `GET /tournaments` takes no `kind` filter, so the narrowing happens here
 * over a page capped at 200. That is fine at launch volume and wrong at
 * scale; a `kind` query param is tracked backend-side.
 */
export async function listDesignContests(params?: {
	status?: string;
	upcoming?: boolean;
	limit?: number;
}): Promise<Tournament[]> {
	const res = await tournamentApi.list({ limit: 200, ...params });
	return (res.data?.tournaments ?? []).filter(
		(t) => t.kind === DESIGN_CONTEST_KIND && (t.skill_domain === 'design' || t.skill_domain === null)
	);
}
