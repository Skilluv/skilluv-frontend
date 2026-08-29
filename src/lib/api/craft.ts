import type { ApiResponse, AudioCraftProfile, CraftDomain, CraftProfile } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * The craft record of one person in one domain.
 *
 * There is no `/ai/profile` or `/audio/profile`: the endpoint is
 * `/users/{username}/{domain}-profile`, addressed by username like the design
 * one and unlike the id-addressed Post-MVP sections, so it works on anyone's
 * profile without resolving a UUID first.
 *
 * Not to be confused with `$api/ai`, which is the assistant. The backend split
 * those two deliberately — `/api/ai/**` is the domain of work, the assistant
 * moved to `/api/assistant` — and the front keeps the split.
 */
export const craftApi = {
	profile(domain: CraftDomain, username: string) {
		return api.get<ApiResponse<CraftProfile>>(`/users/${username}/${domain}-profile`);
	},

	/** The audio record, which additionally carries work worth hearing first. */
	audioProfile(username: string) {
		return api.get<ApiResponse<AudioCraftProfile>>(`/users/${username}/audio-profile`);
	}
};
