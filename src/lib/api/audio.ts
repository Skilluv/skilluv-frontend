import type {
	ApiResponse,
	AuditionRequest,
	CastingDetail,
	OpenCastingRequest,
	VoiceCasting
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * Voice castings.
 *
 * The rest of the audio domain is not here on purpose: challenges, contests,
 * missions and badges are the platform's own surfaces keyed by domain, and
 * revisions and portfolios are `/slices/{id}/revisions` and `/portfolios`,
 * which serve every domain. Copying either per domain would mean one
 * enforcement of the round ceiling per copy.
 */
export const audioCastingsApi = {
	/**
	 * Castings still taking auditions. Closed ones are not served at all — a
	 * listing that keeps showing them teaches people to stop reading it.
	 *
	 * `language` is BCP-47 and matched exactly, so `fr` does not answer for
	 * `fr-BE`. In this trade that is the point.
	 */
	list(language?: string) {
		return api.get<ApiResponse<VoiceCasting[]>>('/audio/castings', { language });
	},

	get(castingId: string) {
		return api.get<ApiResponse<CastingDetail>>(`/audio/castings/${castingId}`);
	},

	open(payload: OpenCastingRequest) {
		return api.post<ApiResponse<{ id: string }>>('/audio/castings', payload);
	},

	/** A second take replaces the first: the actor chose which one to send. */
	audition(castingId: string, payload: AuditionRequest) {
		return api.post<ApiResponse<{ id: string }>>(
			`/audio/castings/${castingId}/auditions`,
			payload
		);
	},

	/**
	 * Choose a voice. Only whoever opened the casting — anyone else gets a
	 * 403, which is the only way the client can learn it was not theirs.
	 * Selecting also lifts the blind: everybody who auditioned deserves to
	 * know who got it.
	 */
	select(castingId: string, submissionId: string) {
		return api.post<ApiResponse<{ selected: boolean }>>(`/audio/castings/${castingId}/select`, {
			submission_id: submissionId
		});
	},

	/**
	 * A short-lived signed URL for one stored file.
	 *
	 * Nothing in this domain returns a stable link to audio: unreleased work
	 * for a paying client is the normal case, and a URL that outlives the
	 * request that asked for it outlives the embargo.
	 */
	listen(fileId: string) {
		return api.get<ApiResponse<{ url: string; expires_in_seconds: number }>>(
			`/audio/files/${fileId}/listen`
		);
	}
};
