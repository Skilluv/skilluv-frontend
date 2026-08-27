/**
 * The creators marketplace — templates, boilerplates, kits, samples.
 *
 * A whole pillar of the business model (`business-model/08-ecosystem-line.md`,
 * 08-01 and 08-06) that the backend served and no page called.
 */

/**
 * What a buyer is allowed to do with an item.
 *
 * Three values and no more, checked server-side. The summary that comes with
 * them is not decorative: `list_item` refuses a licence summary under twenty
 * characters, because a licence nobody can read is a licence nobody follows.
 */
export const MARKETPLACE_LICENSE_TYPES = [
	'personal_use',
	'commercial',
	'extended_commercial'
] as const;
export type MarketplaceLicenseType = (typeof MARKETPLACE_LICENSE_TYPES)[number];

export interface MarketplaceItem {
	id: string;
	slug: string;
	creator_user_id: string;
	item_type: string;
	skill_domain: string;
	title: string;
	description_md: string;
	thumbnail_url: string;
	preview_urls: string[];
	license_type: MarketplaceLicenseType;
	/** In a sentence a buyer can read. The backend enforces that it is one. */
	license_summary: string;
	/** NUMERIC over JSON: a decimal string, parsed once where it is drawn. */
	price: string;
	currency: string;
	downloads_count: number;
	/** NUMERIC again, and null until somebody has rated it. */
	rating_avg: string | null;
	rating_count: number;
	status: string;
}

/**
 * One item, with what a sale would divide into.
 *
 * The split is on the item's own page so a creator can work out their take
 * before listing rather than after selling. The commission is rounded down
 * and the creator takes the rest, so the two always add back to the price.
 */
export interface MarketplaceItemDetail {
	item: MarketplaceItem;
	creator_receives: string;
	platform_commission: string;
}

/**
 * What a purchase hands back.
 *
 * The link is a token with a life, not a URL to keep: forty-eight hours and
 * ten redemptions. Both are said out loud rather than left to be discovered.
 */
export interface MarketplacePurchase {
	purchase_id: string;
	download_url: string;
	valid_for_hours: number;
	downloads_allowed: number;
}

/**
 * What redeeming a download token answers today.
 *
 * Storage keys, not URLs — a browser can do nothing with them. Fixing that is
 * SKI-330; until it lands the page names the files and says they are not yet
 * fetchable rather than offering a dead button.
 */
export interface MarketplaceDownload {
	files: string[];
}

/**
 * What Skilluv keeps on a sale, by price.
 *
 * Twenty per cent below twenty euros, fifteen above. Mirrored here so a
 * creator sees the rate before they list; the figure that is charged is
 * always the one the backend computes.
 */
export const MARKETPLACE_COMMISSION_LOW_PERCENT = 20;
export const MARKETPLACE_COMMISSION_HIGH_PERCENT = 15;
export const MARKETPLACE_COMMISSION_THRESHOLD_EUR = 20;

/** A rating is one to five, and comes from a purchase. */
export const MARKETPLACE_RATING_MIN = 1;
export const MARKETPLACE_RATING_MAX = 5;
