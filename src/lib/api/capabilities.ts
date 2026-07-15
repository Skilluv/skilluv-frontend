import type { ApiResponse, Capability, UserCapability } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const capabilitiesApi = {
	myCapabilities() {
		return api.get<ApiResponse<UserCapability[]>>('/users/me/capabilities');
	},

	forUser(userId: string) {
		return api.get<ApiResponse<UserCapability[]>>(`/users/${userId}/capabilities`);
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
