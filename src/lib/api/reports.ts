import type { Report, ReportTargetType, ReportReason, ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export const reportsApi = {
	create(targetType: ReportTargetType, targetId: string, reason: ReportReason, details?: string) {
		return api.post<ApiResponse<{ report: Report; message: string }>>('/reports', {
			target_type: targetType,
			target_id: targetId,
			reason,
			details
		});
	},

	mine() {
		return api.get<ApiResponse<{ reports: Report[] }>>('/reports/mine');
	},

	cancel(id: string) {
		return api.delete<ApiResponse<{ message: string }>>(`/reports/${id}`);
	}
};
