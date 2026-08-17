import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * One node of the public skill catalogue.
 *
 * Named apart from the `SkillNode` in `$types`, which is the profile's
 * fragment roll-up and shares only the word "skill" with this.
 */
export interface SkillCatalogEntry {
	id: string;
	slug: string;
	display_name: string;
	description: string | null;
	domain: string;
	parent_id: string | null;
	aliases: string[];
	is_skilluv_specific: boolean;
}

export const skillsApi = {
	/** Public catalogue, optionally narrowed to one domain. */
	list(domain?: string) {
		return api.get<ApiResponse<{ skills: SkillCatalogEntry[] }>>('/skills', { domain });
	}
};
