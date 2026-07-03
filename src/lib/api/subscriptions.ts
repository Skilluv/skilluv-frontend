import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface EnterpriseSubscription {
	id: string;
	plan_slug: string;
	status: SubscriptionStatus;
	current_period_start: string | null;
	current_period_end: string | null;
	cancel_at_period_end: boolean;
	monthly_credit_grant: number;
}

export interface SubscribeResponse {
	checkout_url?: string;
	session_id?: string;
	message?: string;
	current_plan?: string;
	status?: SubscriptionStatus;
}

export const subscriptionsApi = {
	subscribe(planSlug: string) {
		return api.post<ApiResponse<SubscribeResponse>>('/enterprise/subscriptions/subscribe', {
			plan_slug: planSlug
		});
	},

	current() {
		return api.get<ApiResponse<{ subscription: EnterpriseSubscription | null }>>(
			'/enterprise/subscriptions/current'
		);
	},

	cancel() {
		return api.post<ApiResponse<{ cancel_at_period_end: boolean; current_period_end: string }>>(
			'/enterprise/subscriptions/cancel'
		);
	}
};
