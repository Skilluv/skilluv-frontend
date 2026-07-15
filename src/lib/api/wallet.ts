import type {
	ApiPaginatedResponse,
	ApiResponse,
	PayoutMethod,
	PayoutRequest,
	WalletBalance,
	WalletTransaction
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface RequestPayoutBody {
	method: PayoutMethod;
	amount_fragments: number;
	stripe_account_id?: string;
	momo_provider?: 'orange' | 'mtn';
	momo_number?: string;
}

export interface StripeConnectOnboarding {
	url: string;
	account_id: string;
	expires_at: string;
}

export const walletApi = {
	balance() {
		return api.get<ApiResponse<WalletBalance>>('/talent/wallet/balance');
	},

	history(params?: { page?: number; per_page?: number }) {
		return api.get<ApiPaginatedResponse<WalletTransaction>>('/talent/wallet/history', params);
	},

	payouts(params?: { page?: number; per_page?: number }) {
		return api.get<ApiPaginatedResponse<PayoutRequest>>('/talent/wallet/payouts', params);
	},

	requestPayout(body: RequestPayoutBody) {
		return api.post<ApiResponse<PayoutRequest>>('/talent/wallet/payouts', body);
	},

	stripeOnboarding() {
		return api.post<ApiResponse<StripeConnectOnboarding>>('/talent/wallet/stripe/onboarding');
	},

	stripeStatus() {
		return api.get<ApiResponse<{ connected: boolean; account_id?: string }>>(
			'/talent/wallet/stripe/status'
		);
	},

	momoRegister(payload: { provider: 'orange' | 'mtn'; number: string }) {
		return api.post<ApiResponse<{ verified: boolean }>>(
			'/talent/wallet/mobile-money/register',
			payload
		);
	}
};
