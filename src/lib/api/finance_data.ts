/**
 * Two lines the backend built and nothing read: money owed early, and data
 * shared on purpose.
 *
 * They ship together because they are the two places where somebody trades
 * something durable for something immediate — a slice of an invoice for cash
 * now, a slice of their record for a share of what it earns. Both deserve the
 * same treatment: the cost stated before the gesture, never after.
 *
 * ## What the numbers are
 *
 * Every amount here arrives as a **decimal string**, not a number. That is
 * correct and this module keeps it: parsing `fee_amount` into a float to
 * render it is how a fee shows a cent less than it charges. Formatting happens
 * at the edge, on a string the server sent.
 *
 * ## The asymmetry consent has
 *
 * Withdrawing consent stops what has not been produced yet. A dataset shipped
 * last month cannot be unshipped, and the backend says so in the response to
 * every write. Any surface built on this has to repeat it at the moment
 * somebody withdraws — not in a policy page they will not open.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** An advance requested against one's own issued invoice. */
export interface Advance {
	id: string;
	user_id: string;
	invoice_id: string;
	/** Decimal strings, all of them. */
	expected_payment: string;
	advance_percent: string;
	advance_amount: string;
	fee_percent: string;
	fee_amount: string;
	currency: string;
	status: string;
	created_at: string;
}

/** One reason the platform asks to use somebody's record. */
export interface DataPurpose {
	slug: string;
	label: string;
	description: string;
	/** Whether the use earns money. The one field that changes the decision. */
	commercial: boolean;
}

export interface DataConsent {
	purpose: string;
	granted_at: string;
	/** Set once withdrawn; the row is kept rather than deleted. */
	revoked_at: string | null;
	revenue_share_percent: string;
	/** The exact wording agreed to, stored with the agreement. */
	wording_agreed: string;
}

/** The percentage bounds the server enforces on an advance. */
export const ADVANCE_MIN_PERCENT = 30;
export const ADVANCE_MAX_PERCENT = 90;

/** The two guarantee tiers the server accepts. */
export const GUARANTEE_TIERS = ['basic', 'premium'] as const;

/** A financing partner Skilluv can introduce somebody to. */
export interface Partnership {
	id: string;
	partner_org: string;
	kind: string;
	/** Where it operates. An introduction outside these is not on offer. */
	countries: string[];
	commission_percent: string;
	/**
	 * The licence it operates under, and where to check it. Null when the
	 * partner declares none, which is itself the useful thing to show: an
	 * unregulated lender is a decision, not a detail.
	 */
	regulatory_basis: string | null;
	registry_url: string | null;
	min_rank: string | null;
	status: string;
}

/** A plan for programmatic access to the talent score. */
export interface ApiPlan {
	slug: string;
	label: string;
	monthly_quota: number | null;
	daily_ceiling: number | null;
	monthly_fee: string;
	currency: string;
	/** Whether using it obliges the caller to credit Skilluv. */
	attribution_required: boolean;
	sla: boolean;
}

/** A corporate learning plan, priced per seat. */
export interface LearningPlan {
	slug: string;
	label: string;
	monthly_fee_per_seat: string;
	currency: string;
	features: string[];
}

export const financeApi = {
	/** Advances already requested, newest first. */
	advances() {
		return api.get<ApiResponse<{ advances: Advance[] }>>('/users/me/advances');
	},

	/**
	 * Ask for an advance on an invoice you issued.
	 *
	 * `advance_percent` travels as a string for the same reason it comes back
	 * as one. The server refuses anything outside 30–90, plus a rank floor and
	 * an outstanding write-off — all 400s with their own message, which a
	 * caller should show rather than replace.
	 */
	requestAdvance(invoiceId: string, advancePercent: number) {
		return api.post<ApiResponse<unknown>>('/users/me/advances', {
			invoice_id: invoiceId,
			advance_percent: String(advancePercent)
		});
	},

	/**
	 * Financing partners open to an introduction, optionally in one country.
	 *
	 * Narrow by country wherever one is known. A partner that cannot operate
	 * where somebody lives is not an option, and listing it as one spends the
	 * only thing this feature has: the reader's belief that the introduction is
	 * actually possible.
	 */
	partners(country?: string) {
		return api.get<ApiResponse<{ partners: Partnership[] }>>(
			'/finance/partners',
			country ? { country } : undefined
		);
	},

	/**
	 * Ask to be introduced to a partner.
	 *
	 * The response returns `shared_with_partner`: the exact snapshot passed on.
	 * It comes back deliberately, and a surface must render it. The snapshot is
	 * about the person asking, they are entitled to see it without asking again,
	 * and it is what the partner priced on. Discarding it hides the substance of
	 * the transaction from its subject.
	 */
	requestReferral(input: {
		partnership_id: string;
		purpose: string;
		amount_requested?: string;
		coverage_requested?: string;
		currency?: string;
	}) {
		return api.post<ApiResponse<{ referral_id: string; shared_with_partner: unknown }>>(
			'/finance/referrals',
			input
		);
	},

	/** Subscribe to the payment guarantee at one of its two tiers. */
	subscribeGuarantee(tier: string) {
		return api.post<ApiResponse<unknown>>('/finance/guarantee', { tier });
	}
};

export const plansApi = {
	/** Plans for programmatic access to the talent score. Public. */
	apiPlans() {
		return api.get<ApiResponse<{ plans: ApiPlan[] }>>('/api-plans');
	},

	/** Corporate learning plans, priced per seat. Public. */
	learningPlans() {
		return api.get<ApiResponse<{ plans: LearningPlan[] }>>('/learning/plans');
	}
};

export const dataConsentApi = {
	/** Every purpose the platform asks about. Public. */
	purposes() {
		return api.get<ApiResponse<{ purposes: DataPurpose[] }>>('/data/purposes');
	},

	/** What the caller has agreed to, including what they have withdrawn. */
	mine() {
		return api.get<ApiResponse<{ consent: DataConsent[] }>>('/users/me/data-consent');
	},

	/**
	 * Agree to a purpose, or withdraw from it.
	 *
	 * The response carries a server-authored `note` saying that withdrawal
	 * applies to what has not been produced yet. It is returned on every write
	 * because it is the part people get wrong, and a surface that swallows it
	 * lets somebody believe they recalled something they did not.
	 */
	set(purpose: string, agree: boolean) {
		return api.post<ApiResponse<{ consent: DataConsent[]; note?: string }>>(
			`/users/me/data-consent/${encodeURIComponent(purpose)}`,
			{ agree }
		);
	},

	/** The partners allowed to see an aggregated identity. */
	partners() {
		return api.get<ApiResponse<{ partners: string[] }>>('/users/me/identity-partners');
	},

	/**
	 * Allow a partner, or take one back.
	 *
	 * Refused with a 400 when `identity_aggregation` has not been agreed to:
	 * naming a partner before agreeing to the aggregation at all would be
	 * consent to a use of something that does not exist yet.
	 */
	setPartner(partnerSlug: string, allow: boolean) {
		return api.post<ApiResponse<unknown>>('/users/me/identity-partners', {
			partner_slug: partnerSlug,
			allow
		});
	},

	/**
	 * The aggregated score, recomputed on the way out.
	 *
	 * 404 when nothing has been computed yet, which is not an error to show as
	 * one. Recomputed for the owner alone — the one reader who should always
	 * see the current figure, and the one who will want to check what a
	 * partner would see.
	 */
	unifiedProfile() {
		return api.get<ApiResponse<{ profile: unknown; partners_allowed: string[] }>>(
			'/users/me/unified-profile'
		);
	}
};

/**
 * Whether a consent row is currently live.
 *
 * Read from `revoked_at` rather than from the row existing: withdrawn consent
 * is kept, not deleted, so presence means "was agreed once" and not "is agreed
 * now".
 */
export function isLive(row: DataConsent): boolean {
	return row.revoked_at === null;
}
