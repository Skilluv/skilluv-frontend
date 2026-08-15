import type { ApiResponse, SkillDomain } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * A project as served by the catalogue.
 *
 * `github_repo_owner` and `github_repo_name` are nullable: a project can exist
 * without GitHub coordinates, and the repo badge only means something once they
 * are set.
 */
export interface Project {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	repo_url: string | null;
	github_repo_owner: string | null;
	github_repo_name: string | null;
	skill_domains: SkillDomain[];
	tech_stack: string[];
	is_oss: boolean;
	looking_for_contributors: boolean;
	curated_by_admin: boolean;
	health_score: number | null;
	owner_id: string;
	owner_type: string;
	archived_at: string | null;
	created_at: string;
	updated_at: string;
}

export const projectsApi = {
	/**
	 * GET /u/{username}/projects — projects owned by a user. Public.
	 *
	 * Not paginated: a user owns a handful of projects and the profile renders
	 * them all at once (SKI-291).
	 */
	forUser(username: string) {
		return api.get<ApiResponse<{ projects: Project[] }>>(
			`/u/${encodeURIComponent(username)}/projects`
		);
	}
};
