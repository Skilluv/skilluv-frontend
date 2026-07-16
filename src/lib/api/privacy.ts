import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface UserConsents {
	marketing: boolean;
	analytics: boolean;
	updated_at: string;
}

export interface PatchConsentsBody {
	marketing?: boolean;
	analytics?: boolean;
}

export interface ExportJobStatus {
	job_id: string;
	status: 'pending' | 'ready' | 'failed';
	download_url?: string;
	requested_at: string;
	expires_at?: string;
}

export const privacyApi = {
	getConsents() {
		return api.get<ApiResponse<UserConsents>>('/users/me/consents');
	},

	patchConsents(body: PatchConsentsBody) {
		return api.patch<ApiResponse<UserConsents>>('/users/me/consents', body);
	},

	/** GDPR right-to-portability — machine-readable dump of all personal data. */
	requestGdprExport() {
		return api.post<ApiResponse<ExportJobStatus>>('/users/me/gdpr-export');
	},

	/** Non-legal data export (portfolio, submissions, badges) — user-friendly bundle. */
	requestDataExport() {
		return api.post<ApiResponse<ExportJobStatus>>('/users/me/data-export');
	},

	/** Poll a previously requested export job. */
	getExportStatus(jobId: string) {
		return api.get<ApiResponse<ExportJobStatus>>(`/users/me/exports/${jobId}`);
	},

	/** Hard delete request (starts the 30-day soft-delete window on the backend). */
	requestAccountDeletion(reason?: string) {
		return api.post<ApiResponse<{ scheduled_for: string }>>('/users/me/delete', { reason });
	}
};
