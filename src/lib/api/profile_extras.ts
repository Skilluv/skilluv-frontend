/**
 * The parts of a profile that are somebody's own account of themselves: where
 * they worked, where they studied, what they speak.
 *
 * ## Declared, and that is the whole design
 *
 * None of this is verified. Nobody checked the employer, the degree or the
 * level, and nothing here feeds a rank, a craft score or a search ranking —
 * that is what attestations are for. A surface rendering a job title beside a
 * validated attestation without saying which is which would let a typed line
 * borrow the weight of a proven one.
 *
 * The platform's entire proposition is that its record is earned rather than
 * claimed, so the one place it accepts claims has to be labelled as such.
 *
 * ## `ended_on` null means current
 *
 * On both experiences and educations. Rendering it as a missing date rather
 * than as "still there" would turn every current job into an incomplete row.
 *
 * ## Languages are a set, not a list
 *
 * Keyed by ISO 639-1 code with a CEFR level, one row per language, and `PUT`
 * upserts. So a client never "adds" a language it may already have — it sets
 * one, and setting the same code twice changes the level rather than
 * duplicating the row.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** CEFR, plus the one level CEFR does not cover. */
export const PROFICIENCIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native'] as const;

export type Proficiency = (typeof PROFICIENCIES)[number];

export interface Experience {
	id: string;
	company: string;
	title: string;
	description: string | null;
	started_on: string;
	/** Null means current, not missing. */
	ended_on: string | null;
	position: number;
}

export interface ExperienceInput {
	company: string;
	title: string;
	description?: string;
	started_on: string;
	ended_on?: string;
	position?: number;
}

export interface Education {
	id: string;
	school: string;
	degree: string | null;
	field: string | null;
	started_on: string;
	ended_on: string | null;
	position: number;
}

export interface EducationInput {
	school: string;
	degree?: string;
	field?: string;
	started_on: string;
	ended_on?: string;
	position?: number;
}

export interface UserLanguage {
	/** ISO 639-1. */
	language: string;
	proficiency: string;
}

export const profileExtrasApi = {
	experiences() {
		return api.get<ApiResponse<{ experiences: Experience[] }>>('/profile/me/experiences');
	},

	addExperience(input: ExperienceInput) {
		return api.post<ApiResponse<{ id: string }>>('/profile/me/experiences', input);
	},

	updateExperience(id: string, input: ExperienceInput) {
		return api.put<ApiResponse<{ updated: boolean }>>(
			`/profile/me/experiences/${encodeURIComponent(id)}`,
			input
		);
	},

	deleteExperience(id: string) {
		return api.delete<void>(`/profile/me/experiences/${encodeURIComponent(id)}`);
	},

	educations() {
		return api.get<ApiResponse<{ educations: Education[] }>>('/profile/me/educations');
	},

	addEducation(input: EducationInput) {
		return api.post<ApiResponse<{ id: string }>>('/profile/me/educations', input);
	},

	updateEducation(id: string, input: EducationInput) {
		return api.put<ApiResponse<{ updated: boolean }>>(
			`/profile/me/educations/${encodeURIComponent(id)}`,
			input
		);
	},

	deleteEducation(id: string) {
		return api.delete<void>(`/profile/me/educations/${encodeURIComponent(id)}`);
	},

	languages() {
		return api.get<ApiResponse<{ languages: UserLanguage[] }>>('/profile/me/languages');
	},

	/**
	 * Set one language's level. Upserts, so calling it twice on the same code
	 * changes the level rather than duplicating the row.
	 */
	setLanguage(language: string, proficiency: string) {
		return api.put<ApiResponse<{ updated: boolean }>>('/profile/me/languages', {
			language,
			proficiency
		});
	},

	removeLanguage(code: string) {
		return api.delete<void>(`/profile/me/languages/${encodeURIComponent(code)}`);
	},

	/** Drop them all at once. */
	clearLanguages() {
		return api.delete<void>('/profile/me/languages');
	}
};

/** Whether a row is still current. Null `ended_on` means it is. */
export function isCurrent(row: { ended_on: string | null }): boolean {
	return row.ended_on === null;
}
