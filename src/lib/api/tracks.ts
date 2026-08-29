import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** A learning track as returned by `GET /tracks`. */
export interface Track {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	target_domain: string;
	target_phase: string;
	estimated_hours: number | null;
	active: boolean;
	created_at: string;
	updated_at: string;
}

/**
 * An enrolment, as returned by `GET /users/me/tracks`.
 *
 * Note the field names differ from `Track`: the backend returns `title` here
 * and `name` there, and identifies the track by `track_id`.
 */
export interface UserTrack {
	track_id: string;
	slug: string;
	title: string;
	started_at: string;
	completed_at: string | null;
	current_challenge_id: string | null;
}

export const tracksApi = {
	/**
	 * Whether the caller may start a challenge, and what is missing if not.
	 *
	 * Read before offering the start button rather than after refusing it. A
	 * prerequisite somebody discovers by being turned away reads as a judgement
	 * of them; the same fact shown beforehand reads as a next step.
	 */
	challengeEligibility(challengeId: string) {
		return api.get<ApiResponse<Record<string, unknown>>>(
			`/challenges/${encodeURIComponent(challengeId)}/eligibility`
		);
	},

	/** How far the caller is through a track. */
	progress(trackId: string) {
		return api.get<ApiResponse<Record<string, unknown>>>(
			`/tracks/${encodeURIComponent(trackId)}/progress`
		);
	},

	/** GET /tracks — public catalogue. */
	list() {
		return api.get<ApiResponse<{ tracks: Track[] }>>('/tracks');
	},

	/** GET /tracks/{slug} */
	getBySlug(slug: string) {
		return api.get<ApiResponse<{ track: Track }>>(`/tracks/${encodeURIComponent(slug)}`);
	},

	/** GET /users/me/tracks — the current user's enrolments. */
	mine() {
		return api.get<ApiResponse<{ user_tracks: UserTrack[] }>>('/users/me/tracks');
	},

	/** POST /tracks/{slug}/enroll — idempotent, re-enrolling returns the existing row. */
	enroll(slug: string) {
		return api.post<ApiResponse<{ user_track: UserTrack; message: string }>>(
			`/tracks/${encodeURIComponent(slug)}/enroll`
		);
	}
};
