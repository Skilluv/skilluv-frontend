import type {
	UserPublic,
	SkillNode,
	HeatmapEntry,
	PrivacySettings,
	ApiResponse
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

interface PublicProfileResponse {
	data: {
		user: UserPublic;
		stats: {
			challenges_completed: number;
			total_fragments: number;
			streak_current: number;
			trust_score: number;
		};
		skill_tree?: SkillNode[];
		heatmap_summary?: HeatmapEntry[];
		badges?: { slug: string; name: string; icon: string; category: string; earned_at: string }[];
	};
}

interface SkillTreeResponse {
	data: {
		user: { id: string; display_name: string; title: string; golden_stars: number; total_fragments: number };
		tree: SkillNode[];
	};
}

interface HeatmapResponse {
	data: {
		heatmap: HeatmapEntry[];
		summary: { days_active: number; total_challenges: number; period_start: string; period_end: string };
	};
}

export const profileApi = {
	/** Profil public (SSR-ready) */
	getPublic(username: string) {
		return api.get<PublicProfileResponse>(`/profile/${username}`);
	},

	/** Modifier son profil */
	update(data: { bio?: string; github?: string; linkedin?: string; website?: string; twitter?: string; country?: string }) {
		return api.put<ApiResponse<{ user: UserPublic }>>('/profile/me', data);
	},

	/** Upload avatar */
	uploadAvatar(file: File) {
		const formData = new FormData();
		formData.append('avatar', file);
		return api.upload<ApiResponse<{ avatar_url: string; message: string }>>('/profile/me/avatar', formData);
	},

	/** Supprimer avatar */
	deleteAvatar() {
		return api.delete<ApiResponse<{ message: string }>>('/profile/me/avatar');
	},

	/** Privacy settings */
	getPrivacy() {
		return api.get<ApiResponse<{ privacy: PrivacySettings }>>('/profile/me/privacy');
	},

	updatePrivacy(data: Partial<PrivacySettings>) {
		return api.put<ApiResponse<{ privacy: PrivacySettings }>>('/profile/me/privacy', data);
	},

	/** Arbre de compétences */
	skillTree(userId?: string) {
		const path = userId ? `/skills/tree/${userId}` : '/skills/tree';
		return api.get<SkillTreeResponse>(path);
	},

	/** Heatmap d'activité */
	heatmap(userId?: string) {
		const path = userId ? `/activity/heatmap/${userId}` : '/activity/heatmap';
		return api.get<HeatmapResponse>(path);
	}
};
