import type {
	ApiResponse,
	DeliverRoundRequest,
	IssueInvoiceRequest,
	Mission,
	MissionApplication,
	MissionDecisionRequest,
	MissionDelivery,
	MissionInvoice,
	MissionNdaAgreement,
	MissionNdaSignature,
	MissionRating,
	MissionStanding,
	MissionType,
	MyMissionApplication,
	RateMissionRequest,
	RequestChangesRequest,
	SignNdaRequest
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Platform cut, and the delivery count that lowers it. Mirrored for the copy. */
export const STANDARD_COMMISSION_PERCENT = 15;
export const FEATURED_COMMISSION_PERCENT = 10;
export const FEATURED_COMMISSION_THRESHOLD = 10;

export interface BrowseMissionsParams {
	/** `design`, `code`, `security`… The design marketplace is this filter. */
	skill_domain?: string;
	mission_type?: string;
	language?: string;
	framework?: string;
	orientation?: string;
	ip_terms?: string;
	payment_model?: string;
	min_budget_eur?: number;
	remote_only?: boolean;
	urgency?: string;
	limit?: number;
	offset?: number;
}

export interface ApplyToMissionRequest {
	cover_letter: string;
	portfolio_urls?: string[];
	/** `[{"name": "figma", "years": 3}]`. */
	expertise?: { name: string; years: number }[];
	past_similar_missions?: string;
	availability_hours_per_week?: number;
	/** Ops missions only, and ignored elsewhere. Carried because the body is
	 * `deny_unknown_fields`-free here but the shape is shared across domains. */
	oncall_available?: boolean;
	oncall_experience?: string;
}

/**
 * Paid missions, one endpoint for every domain.
 *
 * There is no `/design/missions` API: `skill_domain` narrows the same
 * listing, which is why a design mission and a security mission share a
 * workflow, a commission and a dispute path.
 */
export const missionsApi = {
	/** The catalogue of mission types, grouped by domain server-side. */
	types() {
		return api.get<ApiResponse<{ mission_types: MissionType[] }>>('/missions/types');
	},

	browse(params?: BrowseMissionsParams) {
		return api.get<ApiResponse<{ missions: Mission[] }>>(
			'/missions',
			params as Record<string, string | number | boolean | undefined>
		);
	},

	get(slug: string) {
		return api.get<ApiResponse<{ mission: Mission }>>(`/missions/${slug}`);
	},

	apply(slug: string, payload: ApplyToMissionRequest) {
		return api.post<ApiResponse<{ application: MissionApplication }>>(
			`/missions/${slug}/apply`,
			payload
		);
	},

	/** The applicant's own view: every application with both statuses. */
	mine() {
		return api.get<ApiResponse<{ applications: MyMissionApplication[] }>>('/users/me/missions');
	},

	/**
	 * Move a mission along. The publishing enterprise only.
	 *
	 * Cancelling requires a reason; every other transition does not. A mission
	 * goes forward or it is cancelled, so a refused transition is a 400 rather
	 * than a silent no-op.
	 */
	setStatus(slug: string, status: string, reason?: string) {
		return api.post<ApiResponse<{ mission: Mission }>>(`/missions/${slug}/status`, {
			status,
			reason: reason ?? null
		});
	},

	// ─── The agreement ────────────────────────────────────────────────

	/**
	 * The NDA a mission asks for, rendered in a locale.
	 *
	 * 404 when the mission asks for no agreement, which is the common case and
	 * not an error to report. `is_reviewed` says whether a lawyer has been over
	 * the template; the surface repeats that rather than presenting an
	 * unreviewed template as settled law.
	 */
	nda(slug: string, locale?: string) {
		return api.get<ApiResponse<{ agreement: MissionNdaAgreement }>>(`/missions/${slug}/nda`, {
			locale
		});
	},

	/**
	 * Sign it.
	 *
	 * `document_sha256` is the hash of what was actually displayed. A mismatch
	 * answers 409 instead of recording a signature against a document that
	 * changed after it was shown — so callers pass back the hash from the
	 * agreement they rendered, never one they recomputed.
	 */
	signNda(slug: string, payload: SignNdaRequest) {
		return api.post<ApiResponse<{ signature: MissionNdaSignature }>>(
			`/missions/${slug}/nda`,
			payload
		);
	},

	/** The signature I gave, or null. */
	myNdaSignature(slug: string) {
		return api.get<ApiResponse<{ signature: MissionNdaSignature | null }>>(
			`/missions/${slug}/nda/signature`
		);
	},

	// ─── Applications, from the other side ────────────────────────────

	/** Every application to a mission. The publishing enterprise only. */
	applications(slug: string) {
		return api.get<ApiResponse<{ applications: MissionApplication[] }>>(
			`/missions/${slug}/applications`
		);
	},

	/**
	 * Accept or reject one application.
	 *
	 * Addressed by application id, not by mission: the decision is about a
	 * person, and a mission with ten applicants has ten of these.
	 */
	decide(applicationId: string, payload: MissionDecisionRequest) {
		return api.post<ApiResponse<{ application: MissionApplication }>>(
			`/mission-applications/${applicationId}/decision`,
			payload
		);
	},

	// ─── Delivery rounds ──────────────────────────────────────────────

	/**
	 * Every round of a mission, oldest first — the trail an arbitration reads.
	 *
	 * Design missions iterate, so this is normally several rows and the UI
	 * treats that as the expected case rather than as trouble.
	 */
	deliveries(slug: string) {
		return api.get<ApiResponse<{ rounds: MissionDelivery[] }>>(`/missions/${slug}/deliveries`);
	},

	/** Hand in a round. Only the person the mission is assigned to. */
	deliver(slug: string, payload: DeliverRoundRequest) {
		return api.post<ApiResponse<{ delivery: MissionDelivery }>>(
			`/missions/${slug}/deliveries`,
			payload
		);
	},

	/** Accept the waiting round. The mission becomes `delivered`. */
	acceptDelivery(slug: string) {
		return api.post<ApiResponse<{ delivery: MissionDelivery }>>(
			`/missions/${slug}/deliveries/accept`
		);
	},

	/** Ask for another round. The mission stays in progress. */
	requestChanges(slug: string, payload: RequestChangesRequest) {
		return api.post<ApiResponse<{ delivery: MissionDelivery }>>(
			`/missions/${slug}/deliveries/request-changes`,
			payload
		);
	},

	// ─── Ratings ──────────────────────────────────────────────────────

	/**
	 * The ratings on a mission, once they are readable.
	 *
	 * Empty while they are still blind. Callers must not read an empty list as
	 * "nobody rated": the backend returns the same thing for "not your turn to
	 * read", on purpose, and the difference is not worth leaking.
	 */
	ratings(slug: string) {
		return api.get<ApiResponse<{ ratings: MissionRating[] }>>(`/missions/${slug}/ratings`);
	},

	/** Rate the other side. Written blind, and readable only once both have. */
	rate(slug: string, payload: RateMissionRequest) {
		return api.post<ApiResponse<{ rating: MissionRating }>>(`/missions/${slug}/ratings`, payload);
	},

	/** What somebody's revealed ratings average to, by username. */
	standing(username: string) {
		return api.get<ApiResponse<{ standing: MissionStanding }>>(
			`/users/${encodeURIComponent(username)}/mission-standing`
		);
	},

	// ─── Invoicing ────────────────────────────────────────────────────

	/** What is owed. The publishing enterprise and the person doing the work —
	 * those are the two parties to it. */
	invoices(slug: string) {
		return api.get<ApiResponse<{ invoices: MissionInvoice[] }>>(`/missions/${slug}/invoices`);
	},

	/** Put an amount on the mission's account. The enterprise only. */
	issueInvoice(slug: string, payload: IssueInvoiceRequest) {
		return api.post<ApiResponse<{ invoice: MissionInvoice }>>(
			`/missions/${slug}/invoices`,
			payload
		);
	},

	/** Start payment for one invoice. Answers with wherever the payer goes next. */
	checkoutInvoice(invoiceId: string) {
		return api.post<ApiResponse<Record<string, unknown>>>(
			`/mission-invoices/${invoiceId}/checkout`
		);
	}
};

/**
 * The round waiting on a decision, if any.
 *
 * A round with no `decision` is the one the client is being asked about; there
 * is at most one, because handing in a second while the first waits answers
 * 409.
 */
export function pendingRound(rounds: MissionDelivery[]): MissionDelivery | null {
	return rounds.find((r) => r.decision === null) ?? null;
}
