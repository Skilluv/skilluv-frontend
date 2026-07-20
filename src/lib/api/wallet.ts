import type { ApiResponse, Wallet, WalletTransaction } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Réponse de POST /users/me/wallet/stripe/onboard. */
export interface StripeOnboardResponse {
	account_id: string;
	onboarding_url: string;
	expires_at: string;
}

/** Body de POST /users/me/wallet/withdraw/stripe. */
export interface StripeWithdrawBody {
	/** Montant en devise (pas en cents). Ex "12.50". */
	amount: string;
	currency?: 'EUR';
}

/** Body de POST /users/me/wallet/withdraw/momo. */
export interface MomoWithdrawBody {
	amount: string;
	currency?: 'XOF';
}

/** Body de POST /users/me/wallet/momo/phone. */
export interface MomoRegisterBody {
	phone: string;
	/** Opérateur détecté côté serveur mais peut être fourni en indicatif. */
	provider?: 'orange' | 'mtn' | 'wave';
}

export interface StripeWithdrawResponse {
	transaction_id: string;
	stripe_transfer_id: string;
	amount_cents: number;
}

export interface MomoWithdrawResponse {
	transaction_id: string;
	momo_reference: string;
}

export const walletApi = {
	/** GET /users/me/wallet — balances EUR/XOF + statuts providers. */
	get() {
		return api.get<ApiResponse<{ wallet: Wallet }>>('/users/me/wallet');
	},

	/** GET /users/me/wallet/transactions?limit=20 — ledger récent. */
	transactions(params?: { limit?: number }) {
		return api.get<ApiResponse<{ transactions: WalletTransaction[] }>>(
			'/users/me/wallet/transactions',
			params
		);
	},

	/** POST /users/me/wallet/residency — déclare le pays de résidence (ISO alpha-2). */
	setResidency(country: string) {
		return api.post<ApiResponse<{ wallet: Wallet }>>('/users/me/wallet/residency', { country });
	},

	/** POST /users/me/wallet/stripe/onboard — crée compte Connect + retourne l'URL hébergée. */
	stripeOnboard(country: string) {
		return api.post<ApiResponse<StripeOnboardResponse>>('/users/me/wallet/stripe/onboard', {
			country: country.toUpperCase()
		});
	},

	/** POST /users/me/wallet/withdraw/stripe — nécessite stripe_kyc_status='verified'. */
	stripeWithdraw(body: StripeWithdrawBody) {
		return api.post<ApiResponse<StripeWithdrawResponse>>(
			'/users/me/wallet/withdraw/stripe',
			body
		);
	},

	/** POST /users/me/wallet/momo/phone — enregistre le numéro Mobile Money. */
	momoRegister(body: MomoRegisterBody) {
		return api.post<ApiResponse<{ wallet: Wallet }>>('/users/me/wallet/momo/phone', body);
	},

	/** POST /users/me/wallet/withdraw/momo — nécessite momo_phone_verified=true. */
	momoWithdraw(body: MomoWithdrawBody) {
		return api.post<ApiResponse<MomoWithdrawResponse>>('/users/me/wallet/withdraw/momo', body);
	},

	/** GET /users/me/wallet/statement.csv — dump audit compliance. */
	statementCsvUrl(): string {
		return '/api/users/me/wallet/statement.csv';
	}
};
