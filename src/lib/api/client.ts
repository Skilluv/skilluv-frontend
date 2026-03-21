import type { ApiErrorBody } from '$lib/types';

/**
 * Erreur API Skilluv typée
 */
export class SkilluError extends Error {
	code: string;
	status: number;
	details?: unknown;
	requestId?: string;

	constructor(code: string, message: string, status: number, details?: unknown, requestId?: string) {
		super(message);
		this.name = 'SkilluError';
		this.code = code;
		this.status = status;
		this.details = details;
		this.requestId = requestId;
	}
}

/**
 * Crée un client API typé.
 *
 * - Client-side : createApiClient() → utilise /api (proxy Vite/Caddy)
 * - Server-side (SSR) : createApiClient(fetch, 'http://localhost:3001/api')
 */
export function createApiClient(
	customFetch: typeof fetch = fetch,
	baseUrl: string = '/api'
) {
	async function request<T>(path: string, options?: RequestInit): Promise<T> {
		const url = `${baseUrl}${path}`;

		const res = await customFetch(url, {
			...options,
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...options?.headers
			}
		});

		if (!res.ok) {
			let errorBody: ApiErrorBody | null = null;
			try {
				errorBody = await res.json();
			} catch {
				// Réponse non-JSON
			}

			throw new SkilluError(
				errorBody?.error?.code ?? 'UNKNOWN_ERROR',
				errorBody?.error?.message ?? `Erreur HTTP ${res.status}`,
				res.status,
				errorBody?.error?.details,
				errorBody?.meta?.request_id
			);
		}

		// 204 No Content
		if (res.status === 204) return undefined as T;

		return res.json();
	}

	return {
		get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
			let url = path;
			if (params) {
				const searchParams = new URLSearchParams();
				for (const [key, value] of Object.entries(params)) {
					if (value !== undefined) searchParams.set(key, String(value));
				}
				const qs = searchParams.toString();
				if (qs) url += `?${qs}`;
			}
			return request<T>(url);
		},

		post<T>(path: string, body?: unknown): Promise<T> {
			return request<T>(path, {
				method: 'POST',
				body: body ? JSON.stringify(body) : undefined
			});
		},

		put<T>(path: string, body?: unknown): Promise<T> {
			return request<T>(path, {
				method: 'PUT',
				body: body ? JSON.stringify(body) : undefined
			});
		},

		delete<T>(path: string, body?: unknown): Promise<T> {
			return request<T>(path, {
				method: 'DELETE',
				body: body ? JSON.stringify(body) : undefined
			});
		},

		/** Upload multipart (avatar, etc.) */
		upload<T>(path: string, formData: FormData): Promise<T> {
			return request<T>(path, {
				method: 'POST',
				body: formData,
				headers: {} // pas de Content-Type, le navigateur le gère
			});
		}
	};
}

/** Client API par défaut (client-side, utilise le proxy /api) */
export const api = createApiClient();
