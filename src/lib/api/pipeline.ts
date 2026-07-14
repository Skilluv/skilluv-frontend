import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

// Ordre canonique — reflète le funnel de recrutement. Utilisé côté UI pour
// afficher les colonnes du Kanban dans le bon sens.
export const PIPELINE_STAGES = [
	'to_contact',
	'contacted',
	'interviewing',
	'offer',
	'hired',
	'declined'
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface PipelineEntry {
	id: string;
	talent_id: string;
	username: string;
	display_name: string;
	skill_domain: string;
	title: string;
	total_fragments: number;
	stage: PipelineStage;
	position: number;
	notes: string | null;
	salary_proposed_eur: number | null;
	last_action_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreatePipelinePayload {
	talent_id: string;
	stage?: PipelineStage;
	notes?: string;
	salary_proposed_eur?: number;
}

export interface UpdatePipelinePayload {
	stage?: PipelineStage;
	notes?: string | null;
	salary_proposed_eur?: number | null;
	position?: number;
}

// --- API ---

export const pipelineApi = {
	/** Liste toutes les entrées du pipeline, éventuellement filtrée par stage. */
	list(params?: { stage?: PipelineStage }) {
		return api.get<ApiResponse<{ entries: PipelineEntry[] }>>(
			'/enterprise/pipeline',
			params as Record<string, string>
		);
	},

	/** Ajoute (ou upsert) un talent au pipeline. Idempotent côté backend :
	 *  ON CONFLICT (enterprise_id, talent_id) DO UPDATE. */
	add(payload: CreatePipelinePayload) {
		return api.post<ApiResponse<PipelineEntry>>('/enterprise/pipeline', payload);
	},

	/** Change stage / notes / salaire / position d'une entrée existante. */
	update(id: string, payload: UpdatePipelinePayload) {
		return api.put<ApiResponse<PipelineEntry>>(`/enterprise/pipeline/${id}`, payload);
	},

	/** Retire un talent du pipeline (historique conservé côté backend). */
	remove(id: string) {
		return api.delete<ApiResponse<{ ok: true }>>(`/enterprise/pipeline/${id}`);
	},

	/** URL directe pour download CSV — le browser gère nativement le
	 *  Content-Disposition: attachment. Passer par un <a href> côté UI. */
	exportUrl(): string {
		return '/api/enterprise/pipeline/export.csv';
	}
};
