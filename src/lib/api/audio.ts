import type {
	ApiResponse,
	AudioFile,
	AudioFileRole,
	AudioSources,
	AuditionRequest,
	CastingDetail,
	DeclareSourceRequest,
	OpenCastingRequest,
	VoiceCasting,
	WorkCredit
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

/**
 * One audio delivery: the files it is made of, and what it was built from.
 *
 * The two are separate endpoints because they answer to different people. The
 * measurements are readable by any signed-in account — they are what a
 * reviewer grades on, and hiding them would make the grid unusable — while the
 * bytes go through `listen`. The source declaration is public outright: the
 * provenance of a published piece is what a stranger has to be able to check
 * for the attestation on it to mean anything.
 */
export const audioDeliveryApi = {
	files(sliceId: string) {
		return api.get<ApiResponse<AudioFile[]>>(`/audio/slices/${sliceId}/files`);
	},

	/**
	 * Multipart, with a `role` part and a `file` part. The budget of the
	 * slice's subtype decides what fits, and it is a row rather than a
	 * constant, so the refusal comes from the server.
	 */
	upload(sliceId: string, file: File, role: AudioFileRole) {
		const form = new FormData();
		form.set('role', role);
		form.set('file', file);
		return api.upload<ApiResponse<{ id: string; analysis: string }>>(
			`/audio/slices/${sliceId}/files`,
			form
		);
	},

	sources(sliceId: string) {
		return api.get<ApiResponse<AudioSources>>(`/audio/slices/${sliceId}/sources`);
	},

	/**
	 * Adding a source after saying the list was complete makes it incomplete
	 * again, and the backend clears the declaration for exactly that reason.
	 * Callers should re-read rather than assume the statement survived.
	 */
	declareSource(sliceId: string, payload: DeclareSourceRequest) {
		return api.post<ApiResponse<{ id: string }>>(`/audio/slices/${sliceId}/sources`, payload);
	},

	/** The statement the attestation generators read. Not a row count. */
	completeSources(sliceId: string) {
		return api.post<ApiResponse<unknown>>(`/audio/slices/${sliceId}/sources/complete`);
	},

	/** Credits attested on a project's released work, each with its code. */
	projectCredits(slug: string) {
		return api.get<ApiResponse<WorkCredit[]>>(`/projects/${encodeURIComponent(slug)}/credits`);
	}
};
