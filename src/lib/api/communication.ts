/**
 * The communication domain: what somebody publishes, what they translate, and
 * which languages they will review in.
 *
 * ## Declared review languages are not proof of anything
 *
 * Migration 0516 makes the argument and it is worth keeping in front of any
 * surface built on this: nothing here can test somebody's Swahili, and a quiz
 * would produce a number that looks like evidence. What the declaration buys
 * is **accountability** — it is signed, and every review made under it carries
 * it.
 *
 * So a form must not grade, and a profile must not render a declared language
 * as a verified one. The counted languages on the communication record are a
 * different thing entirely: those come from validated translations.
 */

import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface ReviewLanguage {
	/** A BCP 47 tag: `fr`, `pt-BR`, `sw`, `ar`, `wo`. */
	language: string;
	proficiency: string;
	note: string;
	declared_at: string;
}

export const communicationApi = {
	/** The languages the caller has said they can review in. */
	reviewLanguages() {
		return api.get<ApiResponse<ReviewLanguage[]>>('/communication/review-languages');
	},

	/**
	 * Declare one.
	 *
	 * The note is where somebody says what their level actually covers — "I can
	 * review technical prose but not marketing copy" is more useful than a
	 * letter grade, and it is the part a reviewer is held to.
	 */
	declareReviewLanguage(body: { language: string; proficiency: string; note?: string }) {
		return api.post<ApiResponse<unknown>>('/communication/review-languages', body);
	},

	/** Withdraw one. */
	removeReviewLanguage(language: string) {
		return api.delete<void>(
			`/communication/review-languages/${encodeURIComponent(language)}`
		);
	},

	/** The translation reviews on one slice. */
	translationReviews(sliceId: string) {
		return api.get<ApiResponse<{ reviews: unknown[] }>>(
			`/communication/slices/${encodeURIComponent(sliceId)}/translation-reviews`
		);
	},

	/**
	 * Review a translation, in a language you declared.
	 *
	 * The declaration is what makes the review attributable — a review in a
	 * language nobody claimed is a review nobody can be asked about.
	 */
	reviewTranslation(sliceId: string, body: { language: string; notes_md?: string }) {
		return api.post<ApiResponse<unknown>>(
			`/communication/slices/${encodeURIComponent(sliceId)}/translation-reviews`,
			body
		);
	},

	/** Where a piece was published, and what it did there. */
	publications(sliceId: string) {
		return api.get<ApiResponse<{ publications: unknown[] }>>(
			`/communication/slices/${encodeURIComponent(sliceId)}/publications`
		);
	},

	recordPublication(sliceId: string, body: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>(
			`/communication/slices/${encodeURIComponent(sliceId)}/publications`,
			body
		);
	}
};
