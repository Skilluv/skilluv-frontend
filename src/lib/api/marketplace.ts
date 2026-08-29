import type {
	ApiResponse,
	MarketplaceDownload,
	MarketplaceItem,
	MarketplaceItemDetail,
	MarketplacePurchase
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface RateItemRequest {
	/** One to five. Anything else is refused server-side. */
	rating: number;
	review?: string;
}

/**
 * The creators marketplace.
 *
 * Everything here was served and called by nothing — a whole pillar of the
 * business model with no screen. Two things it cannot do yet, both waiting on
 * SKI-330: producing the `file_keys` a listing needs, and turning a redeemed
 * download token into something a browser can fetch.
 */
export const marketplaceApi = {
	/**
	 * Ask for an upload slot.
	 *
	 * The file goes to object storage, not through this API — so this returns
	 * where to put it rather than taking the bytes.
	 */
	requestUpload(body: Record<string, unknown>) {
		return api.post<ApiResponse<Record<string, unknown>>>('/marketplace/uploads', body);
	},

	/** Published items only. `domain` narrows to one discipline. */
	browse(domain?: string) {
		return api.get<ApiResponse<{ items: MarketplaceItem[] }>>('/marketplace/items', { domain });
	},

	/**
	 * One item, with the sale split alongside — a creator sees their take
	 * before listing rather than after selling.
	 */
	get(id: string) {
		return api.get<ApiResponse<MarketplaceItemDetail>>(`/marketplace/items/${id}`);
	},

	/** Publish a draft. Only its creator; anyone else gets a 404, not a 403. */
	publish(id: string) {
		return api.post<ApiResponse<{ item: MarketplaceItem }>>(`/marketplace/items/${id}/publish`);
	},

	/**
	 * Buy. Answers a token, not a file: forty-eight hours and ten
	 * redemptions, both stated in the response rather than left to be found.
	 */
	purchase(id: string) {
		return api.post<ApiResponse<MarketplacePurchase>>(`/marketplace/items/${id}/purchase`);
	},

	/**
	 * Redeem a download token.
	 *
	 * Takes the path the purchase handed back — `/api/marketplace/downloads/{token}`
	 * — which already carries `/api`, so the prefix is stripped before it goes
	 * through the client.
	 *
	 * Server-provided rather than built here on purpose: the token is
	 * single-purpose and belongs to one purchase, and a client assembling the
	 * URL would be guessing at something it was handed.
	 */
	download(downloadUrl: string) {
		return api.get<ApiResponse<MarketplaceDownload>>(downloadUrl.replace(/^\/api/, ''));
	},

	/** Rate something you bought. A rating with no purchase behind it is noise. */
	rate(purchaseId: string, payload: RateItemRequest) {
		return api.post<ApiResponse<{ rated: number }>>(
			`/marketplace/purchases/${purchaseId}/rate`,
			payload
		);
	}
};
