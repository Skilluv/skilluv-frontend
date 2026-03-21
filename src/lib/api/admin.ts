import type {
	UserPrivate,
	Challenge,
	Report,
	ReportStatus,
	ReportTargetType,
	SkillDomain,
	ApiResponse,
	ApiPaginatedResponse
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

interface UserSummary {
	id: string;
	username: string;
	display_name: string;
	email: string;
	role: string;
	skill_domain: SkillDomain;
	title: string;
	total_fragments: number;
	profile_active: boolean;
	banned: boolean;
	created_at: string;
}

interface UserDetail {
	user: UserPrivate;
	reports_against: number;
	total_submissions: number;
}

interface ReportEntry {
	id: string;
	target_type: ReportTargetType;
	target_id: string;
	reason: string;
	details: string | null;
	status: ReportStatus;
	reporter_id: string;
	reporter_username: string;
	created_at: string;
}

interface AuditEntry {
	id: string;
	admin_id: string;
	admin_username: string;
	action: string;
	target_type: string;
	target_id: string;
	details: string | null;
	created_at: string;
}

interface AdminStats {
	users: { total: number; active_30d: number; banned: number };
	challenges: { total: number; published: number; draft: number; archived: number };
	submissions: { total: number; today: number };
	websocket: { connections: number };
}

interface ModerationDashboard {
	banned_users: number;
	reports: { pending: number; resolved: number; dismissed: number; total: number };
	recent_bans_30d: number;
	admin_actions_today: number;
}

interface CommunityChallenge {
	challenge: Challenge;
	creator: { id: string; username: string; display_name: string };
}

// --- API ---

export const adminApi = {
	// --- Users ---

	listUsers(params?: { role?: string; banned?: boolean; q?: string; page?: number; per_page?: number }) {
		return api.get<ApiPaginatedResponse<UserSummary>>('/admin/users', params as Record<string, string | number>);
	},

	getUser(id: string) {
		return api.get<ApiResponse<UserDetail>>(`/admin/users/${id}`);
	},

	banUser(id: string, reason: string) {
		return api.post<ApiResponse<{ message: string; reason: string }>>(`/admin/users/${id}/ban`, { reason });
	},

	unbanUser(id: string) {
		return api.post<ApiResponse<{ message: string }>>(`/admin/users/${id}/unban`);
	},

	// --- Reports ---

	listReports(params?: { status?: ReportStatus; target_type?: ReportTargetType; page?: number; per_page?: number }) {
		return api.get<ApiPaginatedResponse<ReportEntry>>('/admin/reports', params as Record<string, string | number>);
	},

	resolveReport(id: string, status: 'resolved' | 'dismissed', adminNote?: string) {
		return api.put<ApiResponse<{ report: ReportEntry; message: string }>>(`/admin/reports/${id}`, {
			status,
			admin_note: adminNote
		});
	},

	// --- Audit Log ---

	auditLog(params?: { action?: string; page?: number; per_page?: number }) {
		return api.get<ApiPaginatedResponse<AuditEntry>>('/admin/audit-log', params as Record<string, string | number>);
	},

	// --- Dashboard ---

	stats() {
		return api.get<ApiResponse<AdminStats>>('/admin/stats');
	},

	moderationDashboard() {
		return api.get<ApiResponse<ModerationDashboard>>('/admin/dashboard/moderation');
	},

	// --- Challenges ---

	createChallenge(data: Record<string, unknown>) {
		return api.post<ApiResponse<{ challenge: Challenge }>>('/admin/challenges', data);
	},

	listChallenges() {
		return api.get<ApiResponse<{ challenges: Challenge[]; total: number }>>('/admin/challenges');
	},

	updateChallenge(id: string, data: Record<string, unknown>) {
		return api.put<ApiResponse<{ challenge: Challenge }>>(`/admin/challenges/${id}`, data);
	},

	publishChallenge(id: string) {
		return api.post<ApiResponse<{ challenge: Challenge }>>(`/admin/challenges/${id}/publish`);
	},

	archiveChallenge(id: string) {
		return api.post<ApiResponse<{ challenge: Challenge }>>(`/admin/challenges/${id}/archive`);
	},

	rebuildLeaderboards() {
		return api.post<ApiResponse<{ message: string }>>('/admin/leaderboards/rebuild');
	},

	// --- Community ---

	communityReview() {
		return api.get<ApiResponse<{ challenges: CommunityChallenge[]; total: number }>>('/admin/community/review');
	},

	approveCommunity(id: string) {
		return api.post<ApiResponse<{ challenge: Challenge; message: string }>>(`/admin/community/${id}/approve`);
	},

	rejectCommunity(id: string, feedback: string) {
		return api.post<ApiResponse<{ challenge: Challenge; message: string }>>(`/admin/community/${id}/reject`, { feedback });
	}
};
