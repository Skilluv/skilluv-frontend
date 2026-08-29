import type { ApiResponse, SkillTreeResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * Domains the tree can be narrowed to. Prerequisites are still evaluated
 * against the whole catalog, so a cross-domain prerequisite keeps unlocking
 * correctly under a filter.
 */
export const SKILL_TREE_DOMAINS = [
	'code',
	'design',
	'game',
	'security',
	'soft_skills',
	'ai',
	'ops'
] as const;

export type SkillTreeDomain = (typeof SKILL_TREE_DOMAINS)[number];

export const skillTreeApi = {
	forUser(userId: string, domain?: SkillTreeDomain) {
		return api.get<ApiResponse<SkillTreeResponse>>(`/users/${userId}/skill-tree`, { domain });
	}
};
