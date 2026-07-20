import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/** Version courante du texte de consentement + URLs des pages légales. */
export interface ConsentVersion {
	version: number;
	pages: {
		terms: string;
		privacy: string;
		cookies: string;
	};
}

/** Payload de POST /legal/consent — enregistre la décision du user (banner). */
export interface RecordConsentBody {
	analytics: boolean;
	marketing: boolean;
}

export interface RecordConsentResponse {
	version: number;
	analytics: boolean;
	marketing: boolean;
	essential: true;
	stored: boolean;
}

/** Réponse de POST /auth/me/data-export (RGPD + produit dans un même bundle). */
export interface DataExportResponse {
	job_id: string;
	status: 'pending' | 'ready' | 'failed';
	download_url?: string;
	requested_at: string;
	expires_at?: string;
}

export const privacyApi = {
	/** GET /legal/consent-version — version courante + URLs pages légales. */
	consentVersion() {
		return api.get<ApiResponse<ConsentVersion>>('/legal/consent-version');
	},

	/** POST /legal/consent — enregistre les choix analytics + marketing.
	 * Utilisé par le cookie banner ET par la page /settings/privacy. */
	recordConsent(body: RecordConsentBody) {
		return api.post<ApiResponse<RecordConsentResponse>>('/legal/consent', body);
	},

	/** POST /auth/me/data-export — dump machine-readable RGPD + produit
	 * (rate-limited 1/24h côté serveur). */
	requestDataExport() {
		return api.post<ApiResponse<DataExportResponse>>('/auth/me/data-export');
	},

	/** DELETE /auth/account — suppression compte (soft-delete 30 jours). */
	deleteAccount(reason?: string) {
		return api.delete<ApiResponse<{ scheduled_for: string }>>('/auth/account', { reason });
	}
};
