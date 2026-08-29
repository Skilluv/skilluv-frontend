import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';
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

	/** Upload multipart : ne passe pas par le client JSON, fetch direct. */
	async uploadDocument(kind: string, file: File): Promise<{ document_id: string }> {
		const fd = new FormData();
		fd.append('kind', kind);
		fd.append('file', file);
		const resp = await fetch(`${apiBase()}/enterprise/kyc/documents`, {
			method: 'POST',
			credentials: 'include',
			body: fd
		});
		if (!resp.ok) {
			// Only the message is read; typing it beats `any` for exactly that.
			let body: { error?: { message?: string } } | null = null;
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
