import type {
	ApiResponse,
	ContestInvitation,
	MentorSubscription,
	MyEvent,
	NextChallengesResponse,
	ProjectStewardship
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * The reads behind the dashboard home.
 *
 * All five were served under `/users/me/**` and called by nothing, which is
 * why `/dashboard` had eight sub-pages and no entry point.
 *
 * Deliberately not here: `/users/me/performance` and
 * `/users/me/orientations/suggest`. Both go through the AI worker — one is
 * rate-limited to a refresh an hour, the other costs a model call — so they
 * belong to the assistant, not to a page that loads on every visit.
 */
export const dashboardApi = {
	/**
	 * What to do next, with the reasons.
	 *
	 * `domain` defaults to the account's own, and the call is refused when
	 * onboarding never named one. Cached an hour server-side: the inputs move
	 * over days, and advice that changed on every load would stop reading as
	 * advice.
	 */
	nextChallenges(params?: { domain?: string; limit?: number }) {
		// Not `/me/feed/challenges`, which is the other recommender and is
		// already consumed by `slicesApi.feedRecommended`. This one is the
		// suggestion engine that returns its reasons.
		return api.get<ApiResponse<NextChallengesResponse>>('/users/me/next-challenges', params);
	},

	/** Invitations to company contests. Declined ones are not served. */
	contestInvitations() {
		return api.get<ApiResponse<{ invitations: ContestInvitation[] }>>(
			'/users/me/contest-invitations'
		);
	},

	events() {
		return api.get<ApiResponse<{ events: MyEvent[] }>>('/users/me/events');
	},

	/** Both sides: the same row serves the mentor and the mentee. */
	mentorSubscriptions() {
		return api.get<ApiResponse<{ subscriptions: MentorSubscription[] }>>(
			'/users/me/mentor-subscriptions'
		);
	},

	/** Projects you steward. Ended ones are not served. */
	stewardships() {
		return api.get<ApiResponse<{ stewardships: ProjectStewardship[] }>>('/users/me/stewardships');
	}
};
