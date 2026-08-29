import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types (P26 v2 candidature validateur) ---

export type ValidatorDomain =
	| 'code'
	| 'design'
	| 'game'
	| 'security'
	| 'ops'
	| 'ai'
	| 'soft_skills';

export type ValidatorApplicationStatus =
	| 'pending'
	| 'accepted'
	| 'rejected'
	| 'withdrawn';

export type ValidatorApplicationOrigin = 'user_apply' | 'admin_invite';

export interface ValidatorApplication {
	id: string;
	domain: ValidatorDomain;
	origin: ValidatorApplicationOrigin;
	status: ValidatorApplicationStatus;
	motivation: string | null;
	admin_notes: string | null;
	reviewer_admin_id: string | null;
	created_at: string;
	updated_at: string;
}

// Renseignes par le back via GET /users/me/stats pour la preview seuils.
export interface ValidatorEligibilityStats {
	rank: string;
	merged_prs_by_domain: Record<ValidatorDomain, number>;
	repos_covered_by_domain: Record<ValidatorDomain, number>;
	tenure_days: number;
}

// Seuils exposes par SKI-81 pour affichage cote front.
export const VALIDATOR_MIN_RANK = 'artisan';
export const VALIDATOR_MIN_MERGED_PRS = 10;
export const VALIDATOR_MIN_REPOS_COVERED = 3;
export const VALIDATOR_MIN_TENURE_DAYS = 90;

// --- API ---

export const validatorApplicationsApi = {
	// SKI-81 candidature user
	apply(payload: { domain: ValidatorDomain; motivation?: string }) {
		return api.post<ApiResponse<{ application_id: string }>>(
			'/me/apply-as-validator',
			payload
		);
	},

	// SKI-81 liste des candidatures/invitations du user
	list() {
		return api.get<ApiResponse<{ applications: ValidatorApplication[] }>>(
			'/me/validator-applications'
		);
	},

	// SKI-82 invitee-side accept
	accept(applicationId: string) {
		return api.post<ApiResponse<{ accepted: boolean }>>(
			`/validator-applications/${applicationId}/accept`
		);
	},

	// SKI-82 withdraw / decline
	withdraw(applicationId: string) {
		return api.post<ApiResponse<{ withdrawn: boolean }>>(
			`/validator-applications/${applicationId}/withdraw`
		);
	}
};
