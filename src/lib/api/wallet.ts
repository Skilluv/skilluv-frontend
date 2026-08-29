import type { ApiResponse, Wallet, WalletTransaction } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Réponse de POST /users/me/wallet/stripe/onboard. */
export interface StripeOnboardResponse {
	account_id: string;
	onboarding_url: string;
	expires_at: string;
}

/**
 * Body de POST /users/me/wallet/withdraw.
 *
 * Un seul endpoint pour tous les rails. Il y en avait deux —
 * `/withdraw/stripe` et `/withdraw/momo` — que ce client appelait encore
 * alors qu'ils n'existent plus côté backend : le retrait était cassé.
 *
 * Le rail n'est pas un choix du client. Quel opérateur atteint quelqu'un
 * dépend de son pays et de sa devise ; c'est une question de routage que
 * le backend tranche avec `payout_routes`. On envoie un montant.
 */
export interface WithdrawBody {
	/** Montant en devise, pas en centimes. Ex "12.50" EUR, "5000" XOF. */
	amount: string;
	/** Déduite du pays de résidence quand absente. */
	currency?: 'EUR' | 'XOF';
	/**
	 * Force un rail. À ne renseigner que si l'utilisateur a explicitement
	 * choisi une destination, jamais pour « aider » le backend.
	 */
	rail?: 'bank_account' | 'mobile_money';
}

export interface WithdrawResponse {
	amount: string;
	currency: string;
	/** Qui a payé, décidé par le routage. À afficher, pas à choisir. */
	provider: string;
	reference: string;
	/** `pending` sur Mobile Money : accepté, confirmé plus tard. */
	status: 'pending' | 'completed' | 'rejected';
}

/** Body de POST /users/me/wallet/momo/phone. */
export interface MomoRegisterBody {
	phone: string;
	/** Opérateur détecté côté serveur mais peut être fourni en indicatif. */
	provider?: 'orange' | 'mtn' | 'wave';
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

	/**
	 * POST /users/me/wallet/withdraw — un endpoint, tous les rails.
	 *
	 * Le montant part du solde `available`, qui ne contient que l'argent
	 * dont la fenêtre de libération est passée. Les fonds retenus ne sont
	 * pas retirables, et c'est précisément pourquoi on les retient.
	 */
	withdraw(body: WithdrawBody) {
		return api.post<ApiResponse<WithdrawResponse>>('/users/me/wallet/withdraw', body);
	},

	/** POST /users/me/wallet/momo/phone — enregistre le numéro Mobile Money. */
	momoRegister(body: MomoRegisterBody) {
		return api.post<ApiResponse<{ wallet: Wallet }>>('/users/me/wallet/momo/phone', body);
	},

	/** GET /users/me/wallet/statement.csv — dump audit compliance. */
	statementCsvUrl(): string {
		return '/api/users/me/wallet/statement.csv';
	}
};
