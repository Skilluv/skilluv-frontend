/**
 * The three ways a brand pays for reach on Skilluv, from the side of the
 * person who has the reach.
 *
 * A launch campaign buys pieces about a product, one at a time. An ambassador
 * programme buys months of somebody carrying a name. An audience plan is the
 * reader paying Skilluv rather than a brand paying anybody. All three were
 * served by the backend and read by nothing.
 *
 * ## Where the enterprise half lives
 *
 * `brand.rs` serves both sides, and most of its routes are `/enterprise/**`
 * or `/admin/**` — opening a campaign, judging a piece, signing a sponsorship.
 * Those belong to the enterprise console and the admin repo. What is here is
 * strictly the contributor's side: what is open, how to answer it, and what it
 * pays.
 *
 * ## The money is always a string
 *
 * `reward_per_piece`, `monthly_stipend`, `price` — decimals, sent as strings
 * and kept as strings. Parsing them to render is how a stipend displays a cent
 * under what it pays.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** A product launch somebody can write a piece for. */
export interface LaunchCampaign {
	id: string;
	enterprise_id: string;
	product_name: string;
	brief_md: string;
	product_launch_date: string;
	starts_at: string;
	ends_at: string;
	/** Only these types are accepted; anything else is refused with a 400. */
	content_types_wanted: string[];
	reward_pool: string;
	reward_per_piece: string;
	campaign_fee: string;
	currency: string;
	status: string;
	created_at: string;
}

/** A programme that pays somebody monthly to carry a name. */
export interface AmbassadorProgram {
	id: string;
	enterprise_id: string;
	name: string;
	brief_md: string;
	target_count: number;
	monthly_stipend: string;
	expected_deliverables_per_month: number;
	duration_months: number;
	swag_included: boolean;
	preview_products_access: boolean;
	activation_fee: string;
	management_monthly_fee: string;
	currency: string;
	/** The floor below which the invitation cannot be accepted. */
	minimum_rank: string;
	status: string;
	started_at: string | null;
}

export interface AudiencePlan {
	slug: string;
	label: string;
	description: string;
	price: string;
	currency: string;
	/** `monthly` or otherwise annual. */
	period: string;
}

export interface SponsorshipPackage {
	[key: string]: unknown;
}

export const brandApi = {
	/** Campaigns currently accepting pieces. Public. */
	openCampaigns() {
		return api.get<ApiResponse<{ campaigns: LaunchCampaign[] }>>('/launch-campaigns/open');
	},

	/**
	 * Submit a piece to a campaign.
	 *
	 * Refused with a 400 when the campaign is closed, the type is not one it
	 * wants, or **the pot is already spent** — that last one matters most to
	 * show as sent, because it means the work would not be paid and the person
	 * deserves to know before writing rather than after.
	 *
	 * The response carries `pot_remaining` and `pieces_still_payable`, which is
	 * the honest thing to render next.
	 */
	submitPiece(campaignId: string, piece: { content_type: string; title: string; url: string }) {
		return api.post<
			ApiResponse<{ piece_id: string; pot_remaining: string; pieces_still_payable: number }>
		>(`/launch-campaigns/${encodeURIComponent(campaignId)}/pieces`, piece);
	},

	/** Ambassador programmes currently recruiting. Public. */
	openAmbassadorPrograms() {
		return api.get<ApiResponse<{ programs: AmbassadorProgram[] }>>('/ambassador-programs/open');
	},

	/** The ambassador's own answer, and nobody else's. */
	respondToProgram(id: string, accept: boolean) {
		return api.post<ApiResponse<unknown>>(
			`/ambassador-programs/${encodeURIComponent(id)}/respond`,
			{ accept }
		);
	},

	/** The reader-facing subscription plans. Public. */
	audiencePlans() {
		return api.get<ApiResponse<{ plans: AudiencePlan[] }>>('/audience/plans');
	},

	subscribe(plan: string, paymentReference?: string) {
		return api.post<ApiResponse<unknown>>('/audience/subscribe', {
			plan,
			...(paymentReference ? { payment_reference: paymentReference } : {})
		});
	},

	cancelSubscription() {
		return api.post<ApiResponse<unknown>>('/audience/cancel', {});
	},

	/** Whether the caller currently has premium access. */
	myAudience() {
		return api.get<ApiResponse<{ premium: boolean }>>('/users/me/audience');
	},

	/**
	 * Record a month's deliverable as an ambassador.
	 *
	 * The gesture that makes a stipend legitimate: a programme pays monthly
	 * against a quota, and this is how the quota is met. Without it somebody
	 * accepts a year of obligation and has nowhere to discharge it.
	 *
	 * `counts_for_month` defaults to the current one server-side. Passing it is
	 * for the case that actually happens: filing late, for the month the work
	 * was really done in rather than the month somebody got round to it.
	 *
	 * A non-https link is refused with a 400, as is filing for a programme you
	 * are not on.
	 */
	recordDeliverable(
		programId: string,
		body: { kind: string; url?: string; note?: string; counts_for_month?: string }
	) {
		return api.post<ApiResponse<{ deliverable_id: string }>>(
			`/ambassador-programs/${encodeURIComponent(programId)}/deliverables`,
			body
		);
	},

	/**
	 * Record having visited a sponsor's stand at an event.
	 *
	 * This creates a lead the sponsor can read, which is the whole product they
	 * bought. So it is never fired on render or on scroll: it is somebody saying
	 * "I talked to these people", and a surface must ask before saying that on
	 * their behalf.
	 */
	visitStand(eventId: string, sponsorshipId: string, interaction: string) {
		return api.post<ApiResponse<unknown>>(
			`/events/${encodeURIComponent(eventId)}/stands/${encodeURIComponent(sponsorshipId)}`,
			{ interaction }
		);
	},

	/** What sponsoring costs. Public, and read here so the figure is not a secret. */
	sponsorshipPackages() {
		return api.get<ApiResponse<{ packages: SponsorshipPackage[] }>>('/sponsorship/packages');
	}
};

/** Whether a campaign is still inside its window. */
export function campaignIsOpen(c: LaunchCampaign, now = new Date()): boolean {
	const t = now.getTime();
	return new Date(c.starts_at).getTime() <= t && new Date(c.ends_at).getTime() > t;
}
