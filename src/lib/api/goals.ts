import type { ApiResponse, GoalKind, GoalProgress } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface CreateGoalRequest {
	kind: GoalKind;
	/**
	 * Meaning depends on `kind`: a rank slug, a proficiency level, a
	 * capability slug, or a deliverable count.
	 */
	target_value: string;
	/** Required for `skill_level`, rejected for every other kind. */
	target_skill_id?: string;
	/** ISO date. Must be in the future. */
	deadline?: string;
}

export interface UpdateGoalRequest {
	/**
	 * Explicit `null` clears the deadline; omitting the field leaves it
	 * untouched. The backend distinguishes the two, so do not normalise
	 * `undefined` to `null` here.
	 */
	deadline?: string | null;
}

export const goalsApi = {
	create(payload: CreateGoalRequest) {
		return api.post<ApiResponse<{ goal: GoalProgress }>>('/users/me/goals', payload);
	},

	listMine(includeArchived = false) {
		return api.get<ApiResponse<{ goals: GoalProgress[] }>>('/users/me/goals', {
			include_archived: includeArchived
		});
	},

	fetch(id: string) {
		return api.get<ApiResponse<{ goal: GoalProgress }>>(`/users/me/goals/${id}`);
	},

	update(id: string, payload: UpdateGoalRequest) {
		return api.patch<ApiResponse<{ goal: GoalProgress }>>(`/users/me/goals/${id}`, payload);
	},

	/** Hard delete: an abandoned goal is not history worth keeping. */
	remove(id: string) {
		return api.delete<void>(`/users/me/goals/${id}`);
	}
};
