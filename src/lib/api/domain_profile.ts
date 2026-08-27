import type {
	ApiResponse,
	DomainProfileAnswers,
	DomainQuestionSpec,
	MentorMatches,
	ProfileDomain
} from '$lib/types';
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
	},

	/**
	 * Which questions this domain asks, and what each accepts.
	 *
	 * The vocabulary lives server-side and changes as the wizard is reworded,
	 * so a wizard that ships its own copy of the list is a wizard that goes
	 * stale silently — it would keep offering a value the validator has
	 * stopped accepting, and the refusal would land on the user.
	 */
	questions(domain: ProfileDomain) {
		return api.get<ApiResponse<DomainQuestionSpec[]>>(
			`/users/me/domain-profile/${domain}/questions`
		);
	},

	/** An onboarding nobody can leave is a wall. */
	skip(domain: ProfileDomain) {
		return api.post<void>(`/users/me/domain-profile/${domain}/skip`);
	},

	/**
	 * Mentors worth suggesting in one domain, with the reasoning attached.
	 *
	 * One endpoint for the seven domains rather than one each. The backend
	 * consolidated it after the per-domain copies drifted — some took a
	 * `limit` and some hardcoded ten, some answered a bare array and some an
	 * envelope, and the two domains added last had no endpoint at all.
	 *
	 * A domain with no mentorship rules answers **400, not an empty list**:
	 * how many mentees somebody can carry and what their tools are called
	 * differ per domain, and guessing them would match people badly rather
	 * than not at all. Callers surface that message rather than rendering
	 * "no mentors" over a domain that was never configured.
	 */
	mentorMatches(domain: ProfileDomain, limit?: number) {
		return api.get<ApiResponse<MentorMatches>>(`/domains/${domain}/mentors/for-me`, { limit });
	},

	/**
	 * What this domain's wizard asks, with the vocabulary each answer accepts.
	 *
	 * Served so a form is rendered from the platform rather than from the
	 * client's own copy of the list — the copy that goes stale the first time a
	 * domain adds a question and nobody tells the web team. Used here to fill
	 * the closed questions' options, so a value added server-side appears
	 * without a release.
	 */
	questions(domain: ProfileDomain) {
		return api.get<ApiResponse<DomainQuestionSpec[]>>(
			`/users/me/domain-profile/${domain}/questions`
		);
	},

	/**
	 * Stop asking.
	 *
	 * Recorded separately from "answered nothing", and the distinction is the
	 * whole point: without it the wizard reappears for ever for exactly the
	 * people who least wanted it. Saving partial answers is **not** the same
	 * call and does not set it.
	 *
	 * Answers 204 with no body, because the write touches `skipped_at` and
	 * nothing else.
	 */
	skip(domain: ProfileDomain) {
		return api.post<void>(`/users/me/domain-profile/${domain}/skip`);
	}
};

/**
 * The values a closed question accepts, or `null` when the platform did not
 * describe that question.
 *
 * Null rather than an empty list on purpose: "no vocabulary" and "this build
 * has not heard of the question" are different, and only the second is a
 * reason to fall back on a hardcoded constant.
 */
export function allowedFor(specs: DomainQuestionSpec[], key: string): string[] | null {
	const spec = specs.find((s) => s.key === key);
	if (!spec) return null;
	return spec.allowed.length > 0 ? spec.allowed : null;
}
