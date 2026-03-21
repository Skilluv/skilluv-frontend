import type { SandboxExecution, SandboxLanguage, ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

interface ExecuteRequest {
	source_code: string;
	language: string;
	stdin?: string;
	expected_output?: string;
}

interface ExecuteAsyncResponse {
	data: {
		token: string;
		message: string;
	};
}

interface ResultResponse {
	data: SandboxExecution & {
		processing: boolean;
	};
}

interface LanguagesResponse {
	data: {
		tier1: SandboxLanguage[];
		tier2: SandboxLanguage[];
		total: number;
	};
}

export const sandboxApi = {
	/** Exécuter du code (synchrone, rate: 20/min) */
	execute(data: ExecuteRequest) {
		return api.post<ApiResponse<SandboxExecution>>('/sandbox/execute', data);
	},

	/** Exécuter du code (asynchrone) */
	executeAsync(data: ExecuteRequest) {
		return api.post<ExecuteAsyncResponse>('/sandbox/execute-async', data);
	},

	/** Récupérer le résultat d'une exécution async */
	result(token: string) {
		return api.get<ResultResponse>(`/sandbox/result/${token}`);
	},

	/** Liste des langages supportés */
	languages() {
		return api.get<LanguagesResponse>('/sandbox/languages');
	}
};
