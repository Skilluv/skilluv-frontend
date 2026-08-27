import type {
	ApiResponse,
	CodeProfile,
	LeadershipProfile,
	OpsProfile,
	QualityProfile,
	SecurityProfile
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * The craft record of the five domains served with a nested score.
 *
 * One function per domain rather than one generic call: the shared part is
 * the score, and everything else — confirmed defects, objectives held,
 * findings, cohorts led — differs enough that a single return type would be
 * a bag of optionals nobody could read.
 *
 * Addressed by username, like the design, AI and audio records. A hidden
 * profile answers 404 rather than an empty object, so the absence cannot be
 * read as "this person has done nothing".
 */
export const domainProfilesApi = {
	code(username: string) {
		return api.get<ApiResponse<CodeProfile>>(`/users/${username}/code-profile`);
	},

	/**
	 * Recompute the caller's own code score. The sweep runs hourly; this
	 * exists so somebody who has just had an attestation issued does not have
	 * to wait an hour to see it counted.
	 */
	recomputeCode() {
		return api.post<ApiResponse<unknown>>('/users/me/code-profile/recompute');
	},

	quality(username: string) {
		return api.get<ApiResponse<QualityProfile>>(`/users/${username}/quality-profile`);
	},

	ops(username: string) {
		return api.get<ApiResponse<OpsProfile>>(`/users/${username}/ops-profile`);
	},

	leadership(username: string) {
		return api.get<ApiResponse<LeadershipProfile>>(`/users/${username}/leadership-profile`);
	},

	security(username: string) {
		return api.get<ApiResponse<SecurityProfile>>(`/users/${username}/security-profile`);
	}
};
