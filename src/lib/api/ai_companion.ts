import type {
	AiCompanionAnswer,
	AiCompanionQuota,
	AiInteraction,
	AiInteractionType,
	ApiResponse
} from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Cost-control limits, mirrored so the UI can warn before the backend refuses. */
export const AI_DAILY_QUOTA = 10;
export const AI_MAX_PROMPT_CHARS = 4000;
export const AI_MAX_CODE_CHARS = 20_000;

export interface AskRequest {
	interaction_type: AiInteractionType;
	prompt: string;
	/** The code the question is about. Expected for `pre_review` and `debug_help`. */
	code?: string;
	language?: string;
	skill_slug?: string;
	/** Answer language. The backend defaults to `fr`. */
	locale?: string;
}

export interface ListInteractionsParams {
	limit?: number;
	/** Only interactions not yet attached to a deliverable. */
	undisclosed_only?: boolean;
}

/**
 * The companion is disclosed by design: every call is recorded, and any
 * interaction from the last seven days is attached to the next deliverable
 * the user submits. The UI must say so before the user asks, not after.
 */
export const aiCompanionApi = {
	ask(payload: AskRequest) {
		return api.post<ApiResponse<AiCompanionAnswer>>('/assistant/ask', payload);
	},

	interactions(params?: ListInteractionsParams) {
		return api.get<ApiResponse<{ interactions: AiInteraction[] }>>(
			'/users/me/assistant-interactions',
			params as Record<string, string | number | boolean | undefined>
		);
	},

	quota() {
		return api.get<ApiResponse<AiCompanionQuota>>('/users/me/assistant-quota');
	}
};
