import type { ApiResponse, DomainProfileAnswers, ProfileDomain } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface DomainProfileResponse {
	domain: string;
	/** Empty object when the wizard was never filled in. */
	answers: DomainProfileAnswers;
}

/**
 * The per-domain onboarding wizard's answers.
 *
 * Declared, never a claim: the backend module says so at the top of the file.
 * Level and goal sort what gets recommended; rank, badges and craft score read
 * proofs and none of this is one.
 *
 * The body is `deny_unknown_fields`, so a key the vocabulary does not know
 * rejects the **whole** request rather than saving part of it. Callers that
 * hold extra answers must therefore try the full body and fall back — see
 * `designWizard` in `$stores/design_wizard.svelte`.
 */
export const domainProfileApi = {
	get(domain: ProfileDomain) {
		return api.get<ApiResponse<DomainProfileResponse>>(`/users/me/domain-profile/${domain}`);
	},

	put(domain: ProfileDomain, answers: Record<string, unknown>) {
		return api.put<ApiResponse<DomainProfileResponse>>(
			`/users/me/domain-profile/${domain}`,
			answers
		);
	}
};
