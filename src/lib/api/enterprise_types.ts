import type { ApiResponse, EnterpriseType, EnterpriseTypeConfig } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface EnterpriseTypeState {
	enterprise_type: EnterpriseType;
	type_config: EnterpriseTypeConfig;
}

export interface PatchTypeConfigBody {
	enterprise_type?: EnterpriseType;
	type_config?: EnterpriseTypeConfig;
}

export const enterpriseTypesApi = {
	get() {
		return api.get<ApiResponse<EnterpriseTypeState>>('/enterprises/me/type-config');
	},

	patch(body: PatchTypeConfigBody) {
		return api.patch<ApiResponse<EnterpriseTypeState>>('/enterprises/me/type-config', body);
	}
};
