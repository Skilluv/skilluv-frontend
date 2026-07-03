import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export type CertLevel = 'foundation' | 'intermediate' | 'advanced' | 'expert';
export type AttemptStatus = 'pending' | 'paid' | 'started' | 'passed' | 'failed' | 'expired' | 'refunded';

export interface Certification {
	id: string;
	slug: string;
	title: string;
	description: string;
	skill_domain: string;
	level: CertLevel;
	price_eur_cents: number;
	duration_minutes: number;
	passing_score: number;
	validity_months: number;
	challenges_count: number;
}

export interface PurchaseResponse {
	attempt_id: string;
	checkout_url?: string;
	session_id?: string;
	status?: string;
	message?: string;
}

export interface StartResponse {
	attempt_id: string;
	challenge_ids: string[];
	duration_minutes: number;
	deadline: string;
}

export interface SubmitResponse {
	attempt_id: string;
	status: AttemptStatus;
	score: number;
	passing_score: number;
	passed: boolean;
	overtime: boolean;
	certification_title: string;
	diploma_id: string | null;
	verification_code: string | null;
}

export interface DiplomaVerification {
	verification_code: string;
	status: 'valid' | 'revoked' | 'expired';
	holder: { username: string; display_name: string };
	certification: { title: string; skill_domain: string; level: CertLevel };
	issued_at: string;
	expires_at: string;
	revoked_at: string | null;
	revoke_reason: string | null;
}

export interface MyDiploma {
	diploma_id: string;
	verification_code: string;
	issued_at: string;
	expires_at: string;
	status: 'valid' | 'revoked' | 'expired';
	certification: { title: string; skill_domain: string; level: CertLevel };
}

// --- API ---

export const certificationsApi = {
	list() {
		return api.get<ApiResponse<{ certifications: Certification[] }>>('/certifications');
	},

	purchase(slug: string) {
		return api.post<ApiResponse<PurchaseResponse>>(`/certifications/${slug}/purchase`);
	},

	startAttempt(attemptId: string) {
		return api.post<ApiResponse<StartResponse>>(`/certifications/attempts/${attemptId}/start`);
	},

	submitAttempt(attemptId: string) {
		return api.post<ApiResponse<SubmitResponse>>(`/certifications/attempts/${attemptId}/submit`);
	},

	// Public — no auth required
	verifyDiploma(code: string) {
		return api.get<ApiResponse<DiplomaVerification>>(`/diplomas/verify/${code}`);
	},

	myDiplomas() {
		return api.get<ApiResponse<{ diplomas: MyDiploma[] }>>('/diplomas/my');
	}
};
