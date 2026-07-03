import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export interface PricingPack {
	slug: string;
	credits: number;
	kind: 'credits' | 'subscription';
	price: number;
	price_cents: number;
	price_eur: number;
	per_credit: number;
	fx_rate_applied: number | null;
	fx_margin_pct: number | null;
}

export interface PricingSubscription {
	slug: string;
	credits_included: number;
	price: number;
	price_cents: number;
	kind: string;
}

export interface RefundPolicy {
	refused: number;
	timeout_days: number;
	timeout_refund: number;
}

export interface PricingResponse {
	currency: string;
	psp: string;
	packs: PricingPack[];
	subscriptions: PricingSubscription[];
	refund_policy: RefundPolicy;
}

// --- API ---

export const pricingApi = {
	/**
	 * Récupère la grille tarifaire dynamique.
	 * - Sans paramètres → EUR / Stripe
	 * - country=NG → NGN / Paystack
	 * - country=SN → XOF / Flutterwave (etc.)
	 * - currency=USD → force la devise
	 */
	get(params?: { country?: string; currency?: string }) {
		return api.get<ApiResponse<PricingResponse>>('/pricing', params as Record<string, string | undefined>);
	}
};
