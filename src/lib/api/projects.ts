/**
 * Projects: the things slices hang off, and the people on them.
 *
 * ## Two very different lists
 *
 * `looking-for-contributors` is what a project *says about itself* — a flag
 * its owner set. `curated` is what Skilluv put its name behind. Presenting
 * them as one list would let anybody into the second by ticking a box, so they
 * stay separate and are labelled as what they are.
 *
 * `recommendations/projects` is a third thing again: matched against the
 * caller's own record, with `match_score`, `matched_domains` and the WPC
 * behind the match returned alongside. A recommendation that cannot say why it
 * matched is a recommendation nobody can argue with, which is the same rule
 * the next-challenge suggestions follow.
 *
 * ## Interest is not membership
 *
 * `users/me/interests/projects` records that somebody wants to hear about a
 * project. It does not put them on it — that is `contributors`, which the
 * owner adds to. Conflating the two would let anybody claim to be on any
 * project by ticking interest, which is exactly what the separation prevents.
 */

import type { ApiResponse, SkillDomain } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface Project {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	repo_url: string | null;
	/**
	 * Nullable: a project can exist without GitHub coordinates, and the repo
	 * badge only means something once they are set.
	 */
	github_repo_owner: string | null;
	github_repo_name: string | null;
	demo_url: string | null;
	/** Null when nothing has been measured, which is not a score of zero. */
	health_score: number | null;
	tech_stack: string[];
	is_oss: boolean;
	/** The owner's own flag, not a Skilluv judgement. */
	looking_for_contributors: boolean;
	owner_type: string;
	owner_id: string;
	/** Skilluv put its name behind this one. A different claim entirely. */
	curated_by_admin: boolean;
	created_at: string;
	updated_at: string;
	archived_at: string | null;
	skill_domains: SkillDomain[];
}

export interface CreateProjectInput {
	slug: string;
	name: string;
	description?: string;
	repo_url?: string;
	demo_url?: string;
	tech_stack: string[];
	is_oss: boolean;
	looking_for_contributors: boolean;
	owner_type: string;
	owner_id: string;
}

/** A project matched against somebody's record, with the reason. */
export interface ProjectRecommendation {
	project: Project;
	match_score: number;
	matched_domains: string[];
	/** The weighted proof count behind the match — what earned the score. */
	user_wpc_on_matched_domains: number;
}

export interface ProjectWithInterest {
	project: Project;
	interest_score: number;
}

export interface ProjectContributor {
	project_id: string;
	user_id: string;
	role: string;
	commits_count: number;
	added_at: string;
	username: string;
	display_name: string;
}

export const projectsApi = {
	/**
	 * Projects owned by a user. Public.
	 *
	 * Not paginated: a user owns a handful of projects and the profile renders
	 * them all at once (SKI-291).
	 */
	forUser(username: string) {
		return api.get<ApiResponse<{ projects: Project[] }>>(
			`/u/${encodeURIComponent(username)}/projects`
		);
	},

	create(input: CreateProjectInput) {
		return api.post<ApiResponse<{ project: Project }>>('/projects', input);
	},

	/** What projects say about themselves. */
	lookingForContributors() {
		return api.get<ApiResponse<{ projects: Project[] }>>('/projects/looking-for-contributors');
	},

	/** What Skilluv put its name behind. Not the same list. */
	curated() {
		return api.get<ApiResponse<{ projects: Project[] }>>('/projects/curated');
	},

	bySlug(slug: string) {
		return api.get<ApiResponse<{ project: Project }>>(
			`/projects/${encodeURIComponent(slug)}`
		);
	},

	contributors(slug: string) {
		return api.get<ApiResponse<{ contributors: ProjectContributor[] }>>(
			`/projects/${encodeURIComponent(slug)}/contributors`
		);
	},

	/** The owner's act. Being interested in a project does not put you on it. */
	addContributor(slug: string, userId: string, role?: string) {
		return api.post<ApiResponse<unknown>>(
			`/projects/${encodeURIComponent(slug)}/contributors`,
			{ user_id: userId, ...(role ? { role } : {}) }
		);
	},

	removeContributor(slug: string, userId: string) {
		return api.delete<void>(
			`/projects/${encodeURIComponent(slug)}/contributors/${encodeURIComponent(userId)}`
		);
	},

	/**
	 * Archive a project.
	 *
	 * Archived rather than deleted: slices, attestations and contribution
	 * records point at it, and removing the row would orphan somebody's proof
	 * of having worked on it.
	 */
	archive(slug: string) {
		return api.post<ApiResponse<{ archived: boolean }>>(
			`/projects/${encodeURIComponent(slug)}/archive`,
			{}
		);
	},

	byGuild(guildSlug: string) {
		return api.get<ApiResponse<{ projects: Project[] }>>(
			`/guilds/${encodeURIComponent(guildSlug)}/projects`
		);
	},

	/** Matched against the caller's record, with what earned each match. */
	recommendations() {
		return api.get<ApiResponse<{ recommendations: ProjectRecommendation[]; count: number }>>(
			'/users/me/recommendations/projects'
		);
	},

	myInterests() {
		return api.get<ApiResponse<{ interests: ProjectWithInterest[] }>>(
			'/users/me/interests/projects'
		);
	},

	/** Mark interest in several at once — the onboarding does exactly this. */
	markInterested(projectIds: string[]) {
		return api.post<ApiResponse<unknown>>('/users/me/interests/projects', {
			project_ids: projectIds
		});
	},

	unmarkInterested(projectId: string) {
		return api.delete<void>(
			`/users/me/interests/projects/${encodeURIComponent(projectId)}`
		);
	}
};

/** Whether a project is still live. */
export function isActive(p: Project): boolean {
	return p.archived_at === null;
}
