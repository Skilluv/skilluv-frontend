import type { ApiResponse, Mission, MissionType, MyMissionApplication } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Platform cut, and the delivery count that lowers it. Mirrored for the copy. */
export const STANDARD_COMMISSION_PERCENT = 15;
export const FEATURED_COMMISSION_PERCENT = 10;
export const FEATURED_COMMISSION_THRESHOLD = 10;

export interface BrowseMissionsParams {
	/** `design`, `code`, `security`… The design marketplace is this filter. */
	skill_domain?: string;
	mission_type?: string;
	language?: string;
	framework?: string;
	orientation?: string;
	ip_terms?: string;
	payment_model?: string;
	min_budget_eur?: number;
	remote_only?: boolean;
	urgency?: string;
	limit?: number;
	offset?: number;
}

export interface ApplyToMissionRequest {
	cover_letter: string;
	portfolio_urls?: string[];
	/** `[{"name": "figma", "years": 3}]`. */
	expertise?: { name: string; years: number }[];
	past_similar_missions?: string;
	availability_hours_per_week?: number;
}

/**
 * Paid missions, one endpoint for every domain.
 *
 * There is no `/design/missions` API: `skill_domain` narrows the same
 * listing, which is why a design mission and a security mission share a
 * workflow, a commission and a dispute path.
 */
export const missionsApi = {
	/** The catalogue of mission types, grouped by domain server-side. */
	types() {
		return api.get<ApiResponse<{ mission_types: MissionType[] }>>('/missions/types');
	},

	browse(params?: BrowseMissionsParams) {
		return api.get<ApiResponse<{ missions: Mission[] }>>(
			'/missions',
			params as Record<string, string | number | boolean | undefined>
		);
	},

	get(slug: string) {
		return api.get<ApiResponse<{ mission: Mission }>>(`/missions/${slug}`);
	},

	apply(slug: string, payload: ApplyToMissionRequest) {
		return api.post<ApiResponse<{ application: unknown }>>(`/missions/${slug}/apply`, payload);
	},

	/** The applicant's own view: every application with both statuses. */
	mine() {
		return api.get<ApiResponse<{ applications: MyMissionApplication[] }>>('/users/me/missions');
	}
};
