import type {
	Enterprise,
	TalentCard,
	ApiResponse,
	ApiPaginatedResponse,
	CompanySize,
	SkillDomain,
	Title
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

interface EnterpriseRegisterRequest {
	email: string;
	username: string;
	password: string;
	first_name: string;
	last_name: string;
	company_name: string;
	website?: string;
	industry?: string;
	company_size: CompanySize;
	country?: string;
}

interface EnterpriseRegisterResponse {
	data: {
		user: import('$lib/types').UserPrivate;
		enterprise: Enterprise;
		refresh_token: string;
		message: string;
	};
}

interface EnterpriseMember {
	id: string;
	user_id: string;
	username: string;
	display_name: string;
	email: string;
	role: string;
	status: string;
	invited_at: string;
	accepted_at: string | null;
}

interface BookmarkEntry {
	id: string;
	username: string;
	display_name: string;
	skill_domain: SkillDomain;
	title: Title;
	golden_stars: number;
	total_fragments: number;
	country: string | null;
	bookmarked_at: string;
}

interface TalentList {
	id: string;
	name: string;
	description: string | null;
	talent_count: number;
	created_at: string;
}

interface PlatformStats {
	total_talents: number;
	by_domain: Record<SkillDomain, number>;
	by_title: Record<Title, number>;
	avg_fragments: number;
	active_last_30d: number;
}

interface MyStats {
	bookmarks: number;
	talent_lists: number;
	interest_requests: { total: number; pending: number; accepted: number; declined: number };
	active_conversations: number;
	team_size: number;
}

// --- API ---

export const enterpriseApi = {
	// --- Auth & Profile ---

	register(data: EnterpriseRegisterRequest) {
		return api.post<EnterpriseRegisterResponse>('/enterprise/register', data);
	},

	getProfile() {
		return api.get<ApiResponse<{ enterprise: Enterprise; member_count: number }>>('/enterprise/profile');
	},

	updateProfile(data: Partial<Pick<Enterprise, 'company_name' | 'description' | 'website' | 'logo_url' | 'industry' | 'company_size'>>) {
		return api.put<ApiResponse<{ enterprise: Enterprise }>>('/enterprise/profile', data);
	},

	// --- Team ---

	invite(email: string) {
		return api.post<ApiResponse<{ message: string; invite_token: string }>>('/enterprise/invite', { email });
	},

	acceptInvite(token: string) {
		return api.post<ApiResponse<{ message: string }>>('/enterprise/invite/accept', { token });
	},

	members() {
		return api.get<ApiResponse<{ members: EnterpriseMember[] }>>('/enterprise/members');
	},

	removeMember(userId: string) {
		return api.delete<ApiResponse<{ message: string }>>(`/enterprise/members/${userId}`);
	},

	// --- Talent Search ---

	searchTalents(params?: {
		q?: string;
		skill_domain?: SkillDomain;
		title?: Title;
		country?: string;
		min_fragments?: number;
		sort_by?: 'fragments' | 'recent' | 'relevance';
		page?: number;
		per_page?: number;
	}) {
		return api.get<ApiPaginatedResponse<TalentCard>>('/talents/search', params as Record<string, string | number>);
	},

	getTalentCard(username: string) {
		return api.get<ApiResponse<TalentCard>>(`/talents/${username}/card`);
	},

	// --- Bookmarks ---

	addBookmark(talentId: string) {
		return api.post<ApiResponse<{ message: string }>>(`/enterprise/bookmarks/${talentId}`);
	},

	removeBookmark(talentId: string) {
		return api.delete<ApiResponse<{ message: string }>>(`/enterprise/bookmarks/${talentId}`);
	},

	listBookmarks(page?: number, perPage?: number) {
		return api.get<ApiPaginatedResponse<BookmarkEntry>>('/enterprise/bookmarks', { page, per_page: perPage });
	},

	// --- Talent Lists ---

	createList(name: string, description?: string) {
		return api.post<ApiResponse<{ list: TalentList }>>('/enterprise/lists', { name, description });
	},

	getLists() {
		return api.get<ApiResponse<{ lists: TalentList[] }>>('/enterprise/lists');
	},

	getList(listId: string) {
		return api.get<ApiResponse<{ list: TalentList; talents: TalentCard[] }>>(`/enterprise/lists/${listId}`);
	},

	updateList(listId: string, data: { name?: string; description?: string }) {
		return api.put<ApiResponse<{ list: TalentList }>>(`/enterprise/lists/${listId}`, data);
	},

	deleteList(listId: string) {
		return api.delete<ApiResponse<{ message: string }>>(`/enterprise/lists/${listId}`);
	},

	addTalentToList(listId: string, talentId: string) {
		return api.post<ApiResponse<{ message: string }>>(`/enterprise/lists/${listId}/talents/${talentId}`);
	},

	removeTalentFromList(listId: string, talentId: string) {
		return api.delete<ApiResponse<{ message: string }>>(`/enterprise/lists/${listId}/talents/${talentId}`);
	},

	// --- Dashboard ---

	platformStats() {
		return api.get<ApiResponse<PlatformStats>>('/enterprise/dashboard/platform-stats');
	},

	myStats() {
		return api.get<ApiResponse<MyStats>>('/enterprise/dashboard/my-stats');
	}
};
