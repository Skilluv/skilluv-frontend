import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export interface CodeReviewFinding {
	category: 'bug' | 'style' | 'perf' | 'security' | 'pedagogy' | 'best_practice';
	severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
	line: number | null;
	title: string;
	description: string;
	suggestion: string | null;
}

export interface CodeReviewResult {
	submission_id: string;
	challenge_id: string;
	overall_score: number;
	summary: string;
	strengths: string[];
	findings: CodeReviewFinding[];
	learning_resources: string[];
	fragments_bonus: number;
}

export interface ChallengeRecommendation {
	challenge_id: string;
	score: number;
	reason: string;
	growth_category: 'consolidation' | 'growth' | 'stretch';
}

export interface JobPending {
	status: 'pending';
	job_id: string;
}

export interface JobReady<T> {
	status: 'ready';
	result: {
		status: 'completed' | 'failed';
		result?: T;
		error?: string;
	};
}

export type JobResponse<T> = JobPending | JobReady<T>;

// --- API ---

export const aiApi = {
	/** Enqueue une demande de code review. Renvoie un job_id à polling. */
	requestCodeReview(data: { submission_id: string; challenge_id: string; language: string; user_level?: string }) {
		return api.post<ApiResponse<{ job_id: string }>>('/ai/code-review', data);
	},

	/** Enqueue une demande de recommandations. */
	requestRecommendations(data: {
		user: {
			skill_domain: string;
			title: string;
			total_fragments?: number;
			streak_current?: number;
			top_sub_skills?: string[];
			top_languages?: string[];
			recently_completed_challenge_ids?: string[];
			weak_areas?: string[];
		};
		candidates: Array<{
			challenge_id: string;
			title: string;
			skill_domain: string;
			sub_skills: string[];
			difficulty: number;
			duration_minutes: number;
			tags?: string[];
			completion_count?: number;
		}>;
		top_n?: number;
	}) {
		return api.post<ApiResponse<{ job_id: string }>>('/ai/recommendations', data);
	},

	getJob<T>(jobId: string) {
		return api.get<ApiResponse<JobResponse<T>>>(`/ai/jobs/${jobId}`);
	},

	/** Convenience : poll un job jusqu'à `ready` ou timeout. */
	async pollJob<T>(jobId: string, maxAttempts = 30, intervalMs = 2000): Promise<T | null> {
		for (let i = 0; i < maxAttempts; i++) {
			const res = await this.getJob<T>(jobId);
			if (res.data.status === 'ready') {
				const inner = res.data.result;
				if (inner.status === 'completed' && inner.result) return inner.result;
				throw new Error(inner.error ?? 'Job failed');
			}
			await new Promise((r) => setTimeout(r, intervalMs));
		}
		return null;
	}
};
