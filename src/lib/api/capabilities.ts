import type { ApiResponse, Capability, UserCapability } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * What both capability endpoints answer: an envelope, not a bare array.
 *
 * They were typed as the array. `auth.refreshCapabilities` then guarded with
 * `Array.isArray(res.data) ? res.data : []`, which is false for an object — so
 * the list was empty for everybody, always, including admins, and every
 * `auth.can(...)` gate in the app stayed shut. The guard is what hid it: a
 * wrong shape came back as a plausible empty one instead of failing.
 */
export interface CapabilitiesResponse {
	user_id: string;
	capabilities: UserCapability[];
}

export const capabilitiesApi = {
	myCapabilities() {
		return api.get<ApiResponse<CapabilitiesResponse>>('/users/me/capabilities');
	},

	forUser(userId: string) {
		return api.get<ApiResponse<CapabilitiesResponse>>(`/users/${userId}/capabilities`);
	}
};

/** Helper client-only : le user a-t-il une capability active (non expirée) ? */
export function hasCapability(
	caps: UserCapability[] | Capability[] | undefined,
	target: Capability
): boolean {
	if (!caps || caps.length === 0) return false;
	const now = Date.now();
	for (const c of caps) {
		if (typeof c === 'string') {
			if (c === target) return true;
			continue;
		}
		if (c.capability !== target) continue;
		if (c.expires_at && new Date(c.expires_at).getTime() < now) continue;
		return true;
	}
	return false;
}
