import type { ApiResponse, TalentOffer, TalentOfferListing, TalentOfferType } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Cap on live offers per talent, mirrored so the form can stop before the 400. */
export const MAX_OFFERS_PER_USER = 5;

export interface CreateOfferRequest {
	offer_type: TalentOfferType;
	skill_id?: string;
	/** Hours per week, 1..20. Defaults to 2. */
	availability_hours?: number;
	/** Omit or `null` for a free offer. A price requires a verified payout account. */
	price_cents_per_hour?: number | null;
	description?: string;
}

export interface UpdateOfferRequest {
	availability_hours?: number;
	/**
	 * Explicit `null` makes the offer free; omitting leaves the price
	 * unchanged. The backend distinguishes the two.
	 */
	price_cents_per_hour?: number | null;
	description?: string;
	active?: boolean;
}

export interface BrowseOffersParams {
	offer_type?: TalentOfferType;
	/** Skill slug, not id — this is the public browse surface. */
	skill?: string;
	free_only?: boolean;
	limit?: number;
	offset?: number;
}

export const talentOffersApi = {
	/**
	 * Open a reverse-recruitment posting: a person saying what they want, for
	 * companies to answer.
	 *
	 * The direction is the point — everywhere else a company posts and people
	 * apply. A surface must not present it as a job listing, because the person
	 * reading their own posting is the one being pitched to.
	 */
	createPosting(body: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>('/reverse-recruitment/postings', body);
	},

	/** A company pitches a posting. */
	sendPitch(postingId: string, body: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>(
			`/reverse-recruitment/postings/${encodeURIComponent(postingId)}/pitch`,
			body
		);
	},

	create(payload: CreateOfferRequest) {
		return api.post<ApiResponse<{ offer: TalentOffer }>>('/talent-offers', payload);
	},

	browse(params?: BrowseOffersParams) {
		return api.get<ApiResponse<{ offers: TalentOfferListing[]; limit: number; offset: number }>>(
			'/talent-offers',
			params as Record<string, string | number | boolean | undefined>
		);
	},

	update(id: string, payload: UpdateOfferRequest) {
		return api.patch<ApiResponse<{ offer: TalentOffer }>>(`/talent-offers/${id}`, payload);
	},

	remove(id: string) {
		return api.delete<void>(`/talent-offers/${id}`);
	},

	/** `can_publish` reflects the Artisan rank floor, so the UI explains rather than fails. */
	listMine() {
		return api.get<ApiResponse<{ offers: TalentOffer[]; can_publish: boolean }>>(
			'/users/me/talent-offers'
		);
	}
};
