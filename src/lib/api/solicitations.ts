/**
 * Everything the platform asks of somebody, and the gesture each one wants.
 *
 * Five families that the backend built separately and that do the same thing:
 * an onboarding to accept, a placement to accept, an assessment written about
 * you to answer, a beta programme to join, a consultation to take or decline.
 * Each was served and none had a screen, so none of them ever received a
 * reply — the loop was open at the last step, on five surfaces at once.
 *
 * ## Why one module and not five
 *
 * They differ in payload and agree in shape: something arrives, it names a
 * counterpart and a deadline, and the person either answers it or does not.
 * Five API modules would have made five pages that look alike and drift apart.
 *
 * What is deliberately *not* unified is the gesture. Accepting a placement
 * commits months of somebody's working life; joining a beta programme commits
 * an evening. Answering an assessment is a right of reply to something written
 * about you, which is not a yes/no at all. They share an inbox, not a form.
 *
 * ## The one that has no listing
 *
 * `POST /consultations/{id}/respond` and `/opinion` exist; nothing lists the
 * consultations somebody has been invited to. Same for
 * `POST /engagements/{id}/respond`. An invited expert can only answer if they
 * already hold the id, which today means it reached them by notification.
 *
 * So this module does not pretend to list them. Inventing a listing would mean
 * guessing ids, and a page that shows an empty "consultations" shelf reads as
 * "nobody asked you" when the truth is "we cannot tell". Filed rather than
 * faked — the respond calls are here and ready for the day a listing exists.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** A mentored onboarding an employer bought, which its subject may refuse. */
export interface Onboarding {
	id: string;
	enterprise_id: string;
	junior_user_id: string;
	mentor_user_id: string;
	/** Null until the junior has said yes. */
	junior_accepted_at: string | null;
	duration_months: number;
	fee: string;
	currency: string;
	mentor_share_percent: string;
	started_on: string | null;
	retention_3m: boolean | null;
	retention_6m: boolean | null;
	status: string;
	created_at: string;
}

/** A junior placed with an employer, with a guarantee period attached. */
export interface Placement {
	id: string;
	enterprise_id: string;
	junior_user_id: string;
	mentor_user_id: string | null;
	duration_months: number;
	annual_salary_declared: string;
	currency: string;
	upfront_fee: string;
	monthly_monitoring_fee: string;
	guarantee_months: number;
	started_on: string | null;
	status: string;
	junior_accepted_at: string | null;
	created_at: string;
}

/**
 * Something an assessor wrote about somebody, shared with them.
 *
 * Served as a JSON object rather than a typed row, so the fields are the ones
 * `assessments_for_user` builds and nothing more.
 */
export interface Assessment {
	assessment_id: string;
	scope: string | null;
	stated_purpose: string | null;
	orientation: string | null;
	assessed_level: string | null;
	strengths: string | null;
	gaps: string | null;
	notes: string | null;
	assessed_at: string;
}

export interface BetaProgram {
	id: string;
	enterprise_id: string;
	product_name: string;
	brief_md: string;
	test_type: string;
	target_domains: string[];
	target_orientations: string[];
	testers_wanted: number;
	duration_weeks: number;
	tester_reward: string;
	program_fee: string;
	currency: string;
	status: string;
	started_at: string | null;
	ends_at: string | null;
	created_at: string;
}

export const solicitationsApi = {
	/**
	 * Onboardings the caller is part of, as junior **or** as mentor.
	 *
	 * The endpoint returns both roles from one query, so a caller has to work
	 * out which they are — `junior_user_id === me` decides whether the gesture
	 * is "accept this" or "write this month's check-in". Getting that wrong
	 * would offer a mentor a decision that is not theirs to make.
	 */
	onboardings() {
		return api.get<ApiResponse<{ onboardings: Onboarding[] }>>('/users/me/onboardings');
	},

	/** Accept or decline an onboarding. The employer bought it; that is not consent. */
	respondToOnboarding(id: string, accept: boolean) {
		return api.post<ApiResponse<unknown>>(`/onboardings/${encodeURIComponent(id)}/respond`, {
			accept
		});
	},

	/** A monthly check-in. Either side may write; both should. */
	checkIn(id: string, body: { month_number: number; notes_md: string; going_well?: boolean }) {
		return api.post<ApiResponse<unknown>>(`/onboardings/${encodeURIComponent(id)}/check-in`, body);
	},

	placements() {
		return api.get<ApiResponse<{ placements: Placement[] }>>('/users/me/placements');
	},

	respondToPlacement(id: string, accept: boolean) {
		return api.post<ApiResponse<unknown>>(`/placements/${encodeURIComponent(id)}/respond`, {
			accept
		});
	},

	/** What was written about you, through your own session. */
	assessments() {
		return api.get<ApiResponse<{ assessments: Assessment[] }>>('/users/me/assessments');
	},

	/** The right of reply. A conclusion with none is a verdict. */
	respondToAssessment(id: string, responseMd: string) {
		return api.post<ApiResponse<unknown>>(`/assessments/${encodeURIComponent(id)}/response`, {
			response_md: responseMd
		});
	},

	/** Beta programmes currently recruiting. Public listing, not a personal invite. */
	openBetaPrograms(testType?: string) {
		return api.get<ApiResponse<{ programs: BetaProgram[] }>>(
			'/beta-programs/open',
			testType ? { test_type: testType } : undefined
		);
	},

	joinBetaProgram(id: string) {
		return api.post<ApiResponse<unknown>>(`/beta-programs/${encodeURIComponent(id)}/join`, {});
	},

	submitBetaFeedback(id: string, feedbackMd: string) {
		return api.post<ApiResponse<unknown>>(`/beta-programs/${encodeURIComponent(id)}/feedback`, {
			feedback_md: feedbackMd
		});
	},

	/**
	 * Take or decline a consultation you were invited to.
	 *
	 * No listing exists, so a caller reaches this holding an id from a
	 * notification. See the module note.
	 */
	respondToConsultation(id: string, accept: boolean, reason?: string) {
		return api.post<ApiResponse<unknown>>(`/consultations/${encodeURIComponent(id)}/respond`, {
			accept,
			...(reason ? { reason } : {})
		});
	},

	/** The opinion itself, once the consultation was accepted. */
	submitOpinion(id: string, commentMd: string, verdict?: string) {
		return api.post<ApiResponse<unknown>>(`/consultations/${encodeURIComponent(id)}/opinion`, {
			comment_md: commentMd,
			...(verdict ? { verdict } : {})
		});
	},

	/**
	 * Answer an engagement invitation. Also unlisted — same note.
	 *
	 * Takes `accept` alone, unlike the consultation next door which also
	 * carries a reason. Sending one anyway would be refused rather than
	 * ignored, so the difference is kept rather than smoothed over.
	 */
	respondToEngagement(id: string, accept: boolean) {
		return api.post<ApiResponse<unknown>>(`/engagements/${encodeURIComponent(id)}/respond`, {
			accept
		});
	}
};

/**
 * Whether an onboarding is still waiting on its subject.
 *
 * `status === 'proposed'` is what the backend checks on accept, so it is what
 * decides here too rather than the timestamp — a row can carry a decline
 * timestamp and a status that moved on.
 */
export function awaitsJunior(o: Onboarding, myUserId: string | undefined): boolean {
	return o.status === 'proposed' && o.junior_user_id === myUserId;
}

/** Same rule for a placement. */
export function placementAwaitsJunior(p: Placement, myUserId: string | undefined): boolean {
	return p.status === 'proposed' && p.junior_user_id === myUserId;
}
