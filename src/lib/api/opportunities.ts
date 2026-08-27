import type {
	ApiResponse,
	Interview,
	InterviewSlot,
	LogHoursRequest,
	PitchResponse,
	RecruitmentInvitation,
	ReverseRecruitmentPitch,
	ReverseRecruitmentPosting,
	Trial,
	TrialHours
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * The talent side of recruitment.
 *
 * Five reads and four gestures the backend served and nothing called. The
 * worst of it was reverse recruitment: somebody publishes a "job wanted",
 * companies spend credits pitching to them, and the pitches were reachable
 * from no page at all.
 *
 * The company side — `/ats/**`, `/enterprise/**` — is a different workspace
 * and is not here.
 */
export const opportunitiesApi = {
	/**
	 * Pitches sent to your posting.
	 *
	 * Reading them marks the unread ones read server-side: a company that
	 * spent credits is owed the knowledge that their argument was opened.
	 * That is not an answer, and the page does not show it as one.
	 */
	pitches() {
		return api.get<ApiResponse<{ pitches: ReverseRecruitmentPitch[] }>>('/users/me/pitches');
	},

	/** Your "job wanted", or null if you never published one. */
	posting() {
		return api.get<ApiResponse<{ posting: ReverseRecruitmentPosting | null }>>(
			'/users/me/reverse-recruitment'
		);
	},

	/** Yes or no, with a reason only if you feel like giving one. */
	respondToPitch(pitchId: string, payload: PitchResponse) {
		return api.post<ApiResponse<unknown>>(`/pitches/${pitchId}/respond`, payload);
	},

	/** Campaigns you were shortlisted for. */
	recruitmentInvitations() {
		return api.get<ApiResponse<{ invitations: RecruitmentInvitation[] }>>(
			'/users/me/recruitment-invitations'
		);
	},

	/** Your own answer. There is deliberately no admin equivalent. */
	respondToCampaign(campaignId: string, interested: boolean) {
		return api.post<ApiResponse<unknown>>(`/recruitment/campaigns/${campaignId}/respond`, {
			interested
		});
	},

	interviews() {
		return api.get<ApiResponse<{ interviews: Interview[] }>>('/users/me/interviews');
	},

	/** Pick a time. The slot has to be one of the proposed ones. */
	confirmInterview(interviewId: string, slot: InterviewSlot) {
		return api.post<ApiResponse<{ interview: Interview }>>(
			`/interviews/${interviewId}/confirm`,
			{ slot }
		);
	},

	declineInterview(interviewId: string) {
		return api.post<ApiResponse<unknown>>(`/interviews/${interviewId}/decline`);
	},

	trials() {
		return api.get<ApiResponse<{ trials: Trial[] }>>('/users/me/trials');
	},

	/**
	 * The days claimed on one trial, with the two totals apart.
	 *
	 * Readable by both sides. Approved and pending are separate because
	 * claimed-but-unapproved is not money owed.
	 */
	trialHours(trialId: string) {
		return api.get<ApiResponse<TrialHours>>(`/trials/${trialId}/hours`);
	},

	/** Claim a day. The summary is what the client approves against. */
	logHours(trialId: string, payload: LogHoursRequest) {
		return api.post<ApiResponse<{ entry_id: string }>>(`/trials/${trialId}/hours`, payload);
	}
};
