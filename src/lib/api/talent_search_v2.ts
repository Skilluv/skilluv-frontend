import type { ApiPaginatedResponse, SkillDomain, Title } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export type LookingFor = 'cdi' | 'cdd' | 'freelance' | 'internship' | 'contract';
export type SortByV2 = 'fragments' | 'recent' | 'most_active_recently' | 'top_in_domain';

export interface TalentSearchParamsV2 {
	q?: string;
	skill_domain?: SkillDomain;
	title?: Title;
	country?: string;
	country_iso2?: string;
	min_fragments?: number;
	min_streak?: number;
	tag?: string;
	badge?: string;
	looking_for?: LookingFor;
	available_only?: boolean;
	language_spoken?: string;
	has_projects?: boolean;
	min_github_repos?: number;
	sort_by?: SortByV2;
	page?: number;
	per_page?: number;
}

export interface TalentSkill {
	domain: string;
	sub_skill: string;
	fragments: number;
}

export interface TalentV2 {
	id: string;
	username: string;
	display_name: string;
	skill_domain: SkillDomain;
	title: Title;
	golden_stars: number;
	total_fragments: number;
	streak_current: number;
	country: string | null;
	country_iso2: string | null;
	available_for_hire: boolean;
	looking_for: LookingFor | null;
	badge_count: number;
	project_count: number;
	last_activity_at: string | null;
	top_skills: TalentSkill[];
	is_bookmarked?: boolean;
}

export const talentSearchV2Api = {
	search(params?: TalentSearchParamsV2) {
		return api.get<ApiPaginatedResponse<TalentV2>>(
			'/talents/search/v2',
			params as Record<string, string | number | boolean | undefined>
		);
	}
};
