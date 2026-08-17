import type {
	ApiResponse,
	PeerEnrollment,
	PeerEnrollmentListing,
	PeerMatch,
	PeerMatchListing,
	PeerProposal,
	PeerSession
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface EnrollRequest {
	orientation_id: string;
	/** Sessions per week, 1..5. Defaults to 1. */
	weekly_cadence?: number;
}

export interface CheckInRequest {
	notes?: string;
	/** 1..5. */
	rating?: number;
}

export const peerMatchingApi = {
	enroll(payload: EnrollRequest) {
		return api.post<ApiResponse<{ enrollment: PeerEnrollment }>>(
			'/users/me/peer-matching/enroll',
			payload
		);
	},

	unenroll(orientationId: string) {
		return api.delete<void>(`/users/me/peer-matching/enroll/${orientationId}`);
	},

	enrollments() {
		return api.get<ApiResponse<{ enrollments: PeerEnrollmentListing[] }>>(
			'/users/me/peer-matching/enrollments'
		);
	},

	/** Three candidates scored on rank distance, timezone and shared languages. */
	proposals(orientationId: string) {
		return api.get<ApiResponse<{ proposals: PeerProposal[]; orientation_id: string }>>(
			'/peer-matching/proposals',
			{ orientation_id: orientationId }
		);
	},

	createMatch(peerId: string, orientationId: string) {
		return api.post<ApiResponse<{ match: PeerMatch }>>('/peer-matching/matches', {
			peer_id: peerId,
			orientation_id: orientationId
		});
	},

	matches(includeEnded = false) {
		return api.get<ApiResponse<{ matches: PeerMatchListing[] }>>('/users/me/peer-matches', {
			include_ended: includeEnded
		});
	},

	endMatch(matchId: string) {
		return api.delete<void>(`/peer-matches/${matchId}`);
	},

	scheduleSession(matchId: string, sessionAt: string) {
		return api.post<ApiResponse<{ session: PeerSession }>>(`/peer-matches/${matchId}/sessions`, {
			session_at: sessionAt
		});
	},

	sessions(matchId: string) {
		return api.get<ApiResponse<{ sessions: PeerSession[] }>>(`/peer-matches/${matchId}/sessions`);
	},

	/** Each side writes its own notes and rating on the shared session row. */
	checkIn(sessionId: string, payload: CheckInRequest) {
		return api.patch<ApiResponse<{ session: PeerSession }>>(
			`/peer-sessions/${sessionId}`,
			payload
		);
	},

	cancelSession(sessionId: string) {
		return api.delete<ApiResponse<{ session: PeerSession }>>(`/peer-sessions/${sessionId}`);
	}
};
