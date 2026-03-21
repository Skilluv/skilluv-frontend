import type {
	Challenge,
	Submission,
	SkillDomain,
	ApiResponse,
	ApiPaginatedResponse,
	Team
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types réponses spécifiques ---

interface ChallengeListItem {
	challenge: Challenge;
	locked: boolean;
}

interface StartResponse {
	data: {
		submission: Submission;
		challenge: Challenge;
	};
}

interface SubmitResponse {
	data: {
		submission: Submission;
		fragments_earned: number;
		perseverance_bonus: number;
		user: {
			total_fragments: number;
			title: string;
			golden_stars: number;
			streak_current: number;
			profile_active: boolean;
		};
		profile_activated?: boolean;
		message?: string;
	};
}

interface TimerResponse {
	data: {
		submission_id: string;
		started_at: string;
		expires_at: string | null;
		remaining_seconds: number | null;
		expired: boolean;
		has_timer: boolean;
	};
}

interface TagsResponse {
	data: {
		tags: { id: string; name: string; category: string; challenge_count: number }[];
	};
}

interface FeaturedResponse {
	data: {
		challenges: Challenge[];
	};
}

// --- API ---

export const challengesApi = {
	/** Challenge d'onboarding adapté au domaine */
	getOnboarding(domain: SkillDomain) {
		return api.get<ApiResponse<{ challenge: Challenge }>>(`/challenges/onboarding`, { domain });
	},

	/** Catalogue paginé avec filtres */
	list(params?: {
		domain?: SkillDomain;
		difficulty?: number;
		page?: number;
		per_page?: number;
	}) {
		return api.get<ApiPaginatedResponse<ChallengeListItem>>('/challenges', params);
	},

	/** Détail d'un challenge */
	get(id: string) {
		return api.get<ApiResponse<{ challenge: Challenge }>>(`/challenges/${id}`);
	},

	/** Démarrer un challenge */
	start(id: string) {
		return api.post<StartResponse>(`/challenges/${id}/start`);
	},

	/** Soumettre une solution */
	submit(id: string, code: string, language?: string) {
		return api.post<SubmitResponse>(`/challenges/${id}/submit`, { code, language });
	},

	/** Historique des soumissions */
	submissions(id: string) {
		return api.get<ApiResponse<{ submissions: Submission[] }>>(`/challenges/${id}/submissions`);
	},

	/** Timer du challenge en cours */
	timer(id: string) {
		return api.get<TimerResponse>(`/challenges/${id}/timer`);
	},

	// --- Tags & Featured ---

	tags() {
		return api.get<TagsResponse>('/challenges/tags');
	},

	categories() {
		return api.get<ApiResponse<{ categories: { category: string; tag_count: number }[] }>>('/challenges/categories');
	},

	featured() {
		return api.get<FeaturedResponse>('/challenges/featured');
	},

	// --- Teams ---

	createTeam(challengeId: string, name: string, maxMembers?: number) {
		return api.post<ApiResponse<{ team: Team }>>(`/challenges/${challengeId}/team/create`, {
			name,
			max_members: maxMembers
		});
	},

	joinTeam(challengeId: string, teamId: string) {
		return api.post<ApiResponse<{ message: string }>>(`/challenges/${challengeId}/team/${teamId}/join`);
	},

	listTeams(challengeId: string) {
		return api.get<ApiResponse<{ teams: Team[] }>>(`/challenges/${challengeId}/teams`);
	},

	submitTeam(challengeId: string, teamId: string, code: string, language?: string) {
		return api.post<ApiResponse<{ submission: Submission; fragments_per_member: number }>>(`/challenges/${challengeId}/team/${teamId}/submit`, { code, language });
	}
};
