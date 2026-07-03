import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export type SessionStatus =
	| 'pending' | 'paid' | 'confirmed' | 'completed'
	| 'cancelled_by_mentee' | 'cancelled_by_mentor'
	| 'no_show' | 'refunded';

export interface MentorSummary {
	user_id: string;
	username: string;
	display_name: string;
	country_iso2: string | null;
	headline: string;
	expertise_areas: string[];
	languages_spoken: string[];
	hourly_rate_eur_cents: number;
	avg_rating: string | null;
	total_sessions: number;
}

export interface MentorProfile extends MentorSummary {
	bio: string;
	skill_domain: string;
	min_session_minutes: number;
}

export interface MyMentorProfile {
	headline: string;
	bio: string;
	expertise_areas: string[];
	languages_spoken: string[];
	hourly_rate_eur_cents: number;
	min_session_minutes: number;
	active: boolean;
}

export interface MentorshipSession {
	id: string;
	role: 'mentor' | 'mentee';
	scheduled_at: string;
	duration_minutes: number;
	status: SessionStatus;
	price_total_cents: number;
	currency: string;
	meeting_url: string | null;
	counterparty_name: string;
}

export interface BookResponse {
	session_id: string;
	checkout_url: string;
	price_total_cents: number;
	mentor_share_cents: number;
	platform_share_cents: number;
}

export interface ConnectStatus {
	onboarded: boolean;
	account_id?: string;
	charges_enabled?: boolean;
	payouts_enabled?: boolean;
	message?: string;
}

// --- API ---

export const mentorshipApi = {
	listMentors(params?: {
		expertise?: string;
		language?: string;
		max_rate_cents?: number;
		page?: number;
		per_page?: number;
	}) {
		return api.get<ApiResponse<{ mentors: MentorSummary[] }>>(
			'/mentors',
			params as Record<string, string | number>
		);
	},

	getMentor(userId: string) {
		return api.get<ApiResponse<MentorProfile>>(`/mentors/${userId}`);
	},

	// -- Being a mentor --
	getMyProfile() {
		return api.get<ApiResponse<{ profile: MyMentorProfile | null }>>('/mentors/me');
	},

	upsertMyProfile(data: {
		headline: string;
		bio: string;
		expertise_areas: string[];
		languages_spoken: string[];
		hourly_rate_eur_cents: number;
		min_session_minutes?: number;
		active?: boolean;
	}) {
		return api.put<ApiResponse<{ updated: boolean }>>('/mentors/me', data);
	},

	addAvailability(data: {
		weekday: number;
		start_time: string;
		end_time: string;
		timezone?: string;
	}) {
		return api.post<ApiResponse<{ availability_id: string }>>('/mentors/me/availability', data);
	},

	startConnectOnboarding() {
		return api.post<ApiResponse<{ onboarding_url: string; expires_at: number; account_id: string }>>(
			'/mentors/me/connect/onboard'
		);
	},

	connectStatus() {
		return api.get<ApiResponse<ConnectStatus>>('/mentors/me/connect/status');
	},

	// -- Book / manage sessions --
	book(data: {
		mentor_user_id: string;
		scheduled_at: string;
		duration_minutes: number;
		mentee_notes?: string;
	}) {
		return api.post<ApiResponse<BookResponse>>('/mentorship/sessions', data);
	},

	mySessions() {
		return api.get<ApiResponse<{ sessions: MentorshipSession[] }>>('/mentorship/sessions');
	},

	cancelSession(id: string) {
		return api.post<
			ApiResponse<{ status: SessionStatus; refund_amount_cents: number; refund_ratio: number; stripe_refund_id: string | null }>
		>(`/mentorship/sessions/${id}/cancel`);
	},

	completeSession(id: string) {
		return api.post<ApiResponse<{ completed: boolean; stripe_transfer_id: string | null }>>(
			`/mentorship/sessions/${id}/complete`
		);
	},

	submitReview(id: string, rating: number, comment?: string) {
		return api.post<ApiResponse<{ review_saved: boolean }>>(
			`/mentorship/sessions/${id}/review`,
			{ rating, comment }
		);
	}
};
