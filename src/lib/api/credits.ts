import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export interface CreditBalance {
	balance: string;
	total_purchased: number;
	total_used: string;
	total_refunded: string;
	updated_at: string;
}

export interface CreditTransaction {
	id: string;
	delta: string;
	balance_after: string;
	reason: string;
	related_interest_request_id: string | null;
	related_payment_id: string | null;
	related_promo_code_id: string | null;
	notes: string | null;
	actor_user_id: string | null;
	expires_at: string | null;
	created_at: string;
}

export interface CheckoutSessionResponse {
	session_id: string;
	checkout_url: string;
}

export interface PromoRedeemResult {
	code: string;
	kind: 'fixed' | 'percent' | 'bonus_credits';
	credits_added: string;
	new_balance: string;
}

// --- API ---

export const creditsApi = {
	/** Solde + total achats/utilisation/refunds pour l'entreprise courante. */
	getBalance() {
		return api.get<ApiResponse<CreditBalance>>('/enterprise/credits');
	},

	/** Historique paginé des transactions (achats, dépenses, refunds, grants). */
	getTransactions(params?: { page?: number; per_page?: number; reason?: string }) {
		return api.get<ApiResponse<{ transactions: CreditTransaction[]; total: number; page: number }>>(
			'/enterprise/credits/transactions',
			params as Record<string, string | number>
		);
	},

	/** Lance une session Stripe Checkout pour un pack. Redirect à effectuer côté client. */
	createCheckout(packSlug: string) {
		return api.post<ApiResponse<CheckoutSessionResponse>>('/enterprise/credits/checkout', {
			pack_slug: packSlug
		});
	},

	/** Session Stripe Billing Portal (mise à jour moyen de paiement / résiliation).
	 * Backend l'expose sous /enterprise/billing/portal (owner-only). */
	openBillingPortal() {
		return api.post<ApiResponse<{ portal_url: string }>>('/enterprise/billing/portal');
	},

	/** Redeem d'un code promo. */
	redeemPromo(code: string) {
		return api.post<ApiResponse<PromoRedeemResult>>('/enterprise/credits/redeem', { code });
	}
};
