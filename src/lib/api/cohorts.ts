import type {
	ApiResponse,
	Cohort,
	CohortDetail,
	CohortListing,
	CohortMember,
	CohortMemberListing,
	CohortMessage,
	CohortMilestone,
	CohortRole,
	MyCohort
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface CreateCohortRequest {
	slug: string;
	name: string;
	description?: string;
	starts_at: string;
	ends_at: string;
	/** 2..30, defaults to 20 server-side. */
	max_members?: number;
	orientation_id?: string;
	/** Public cohorts are discoverable and self-serve joinable. */
	is_public?: boolean;
}

export interface UpdateCohortRequest {
	name?: string;
	description?: string;
	ends_at?: string;
	max_members?: number;
	is_public?: boolean;
	/** One-way freeze: an archived cycle is never resurrected. */
	archive?: boolean;
}

export interface ListCohortsParams {
	/** Orientation slug, not id — this is the discovery surface. */
	orientation?: string;
	/** Only cohorts that have not started, the ones joinable from day one. */
	upcoming_only?: boolean;
	limit?: number;
	offset?: number;
}

export interface CreateMilestoneRequest {
	title: string;
	description?: string;
	/** ISO date. */
	target_date: string;
}

export interface ListMessagesParams {
	limit?: number;
	/** Cursor: messages strictly older than this instant. */
	before?: string;
}

export const cohortsApi = {
	create(payload: CreateCohortRequest) {
		return api.post<ApiResponse<{ cohort: Cohort }>>('/cohorts', payload);
	},

	list(params?: ListCohortsParams) {
		return api.get<ApiResponse<{ cohorts: CohortListing[]; limit: number; offset: number }>>(
			'/cohorts',
			params as Record<string, string | number | boolean | undefined>
		);
	},

	fetch(id: string) {
		return api.get<ApiResponse<CohortDetail>>(`/cohorts/${id}`);
	},

	update(id: string, payload: UpdateCohortRequest) {
		return api.patch<ApiResponse<{ cohort: Cohort }>>(`/cohorts/${id}`, payload);
	},

	join(id: string) {
		return api.post<ApiResponse<{ member: CohortMember }>>(`/cohorts/${id}/join`);
	},

	leave(id: string) {
		return api.delete<void>(`/cohorts/${id}/leave`);
	},

	/** Invite-only path for private cohorts; re-posting promotes or demotes. */
	addMember(id: string, userId: string, role?: CohortRole) {
		return api.post<ApiResponse<{ member: CohortMember }>>(`/cohorts/${id}/members`, {
			user_id: userId,
			role
		});
	},

	removeMember(id: string, userId: string) {
		return api.delete<void>(`/cohorts/${id}/members/${userId}`);
	},

	members(id: string) {
		return api.get<ApiResponse<{ members: CohortMemberListing[] }>>(`/cohorts/${id}/members`);
	},

	createMilestone(id: string, payload: CreateMilestoneRequest) {
		return api.post<ApiResponse<{ milestone: CohortMilestone }>>(
			`/cohorts/${id}/milestones`,
			payload
		);
	},

	milestones(id: string) {
		return api.get<ApiResponse<{ milestones: CohortMilestone[] }>>(`/cohorts/${id}/milestones`);
	},

	removeMilestone(id: string, milestoneId: string) {
		return api.delete<void>(`/cohorts/${id}/milestones/${milestoneId}`);
	},

	postMessage(id: string, body: string) {
		return api.post<ApiResponse<{ message: CohortMessage }>>(`/cohorts/${id}/messages`, { body });
	},

	messages(id: string, params?: ListMessagesParams) {
		return api.get<ApiResponse<{ messages: CohortMessage[]; limit: number }>>(
			`/cohorts/${id}/messages`,
			params as Record<string, string | number | undefined>
		);
	},

	listMine() {
		return api.get<ApiResponse<{ cohorts: MyCohort[] }>>('/users/me/cohorts');
	}
};
