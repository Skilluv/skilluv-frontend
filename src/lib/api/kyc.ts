import type { ApiResponse } from '$lib/types';
import { createApiClient, csrfHeaders } from './client';
import { apiBase } from './origin';

const api = createApiClient();

export type KycLevel = 'none' | 'basic' | 'full';
export type KycStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

export interface KycDocument {
	id: string;
	kind: string;
	content_type: string;
	size_bytes: number;
	uploaded_at: string;
}

export interface KycStatusResponse {
	level: KycLevel;
	status: KycStatus;
	monthly_spend_eur_cents: number;
	reviewed_at: string | null;
	rejection_reason: string | null;
	documents: KycDocument[];
	thresholds: {
		basic_up_to_eur_cents: number;
		full_required_above_eur_cents: number;
	};
}

export const kycApi = {
	getStatus() {
		return api.get<ApiResponse<KycStatusResponse>>('/enterprise/kyc');
	},

	/**
	 * Upload multipart : ne passe pas par le client JSON, fetch direct.
	 *
	 * Two things the client would otherwise have handled and that have to be
	 * repeated by hand here: the base comes from `apiBase()` so the call still
	 * lands on a backend served from its own origin, and the CSRF header is
	 * echoed so the double-submit layer does not refuse the write.
	 */
	async uploadDocument(kind: string, file: File): Promise<{ document_id: string }> {
		const fd = new FormData();
		fd.append('kind', kind);
		fd.append('file', file);
		const resp = await fetch(`${apiBase()}/enterprise/kyc/documents`, {
			method: 'POST',
			credentials: 'include',
			headers: csrfHeaders('POST'),
			body: fd
		});
		if (!resp.ok) {
			let body: any = null;
			try {
				body = await resp.json();
			} catch {
				// noop
			}
			throw new Error(body?.error?.message ?? `HTTP ${resp.status}`);
		}
		const j = await resp.json();
		return j.data;
	}
};
