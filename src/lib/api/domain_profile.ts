import type {
	ApiResponse,
	DomainProfileAnswers,
	DomainQuestionSpec,
	DomainRecommendation,
	MentorMatches,
	ProfileDomain
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface DomainProfileResponse {
	domain: string;
	/** Empty object when the wizard was never filled in. */
	answers: DomainProfileAnswers;
	/** When the wizard was answered. Null means never. */
	completed_at: string | null;
	/**
	 * When somebody said stop asking.
	 *
	 * Not the same as having answered nothing: the first means "stop", the
	 * second means "ask again". Anything deciding whether to prompt has to
	 * read this one and not the emptiness of `answers`.
	 */
	skipped_at: string | null;
	/**
	 * What to do first, given what was just said.
	 *
	 * Present on the answer to `put` and absent everywhere else — it is the
	 * reply to having answered, not a property of the profile, and a read
	 * carrying one would invite showing month-one advice to somebody in their
	 * sixth month.
	 */
	recommendation?: DomainRecommendation;
}

/**
 * The per-domain onboarding wizard's answers.
 *
 * Declared, never a claim: the backend module says so at the top of the file.
 * Level and goal sort what gets recommended; rank, badges and craft score read
 * proofs and none of this is one.
 *
 * Which keys a domain accepts is served by `questions` below rather than
 * hardcoded anywhere. A body carrying a key the domain does not ask is
 * refused **whole** rather than saved in part, so a caller that guesses the
 * vocabulary loses every answer in the request and not just the wrong one —
 * which is the reason to render the form from the registry instead.
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
