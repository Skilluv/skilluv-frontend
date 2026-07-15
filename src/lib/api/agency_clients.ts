import type { AgencyClient, ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

export interface CreateAgencyClientBody {
	client_name: string;
	client_contact_email?: string;
	notes?: string;
}

export interface PatchAgencyClientBody {
	client_name?: string;
	client_contact_email?: string;
	notes?: string;
	active?: boolean;
}

export const agencyClientsApi = {
	list() {
		return api.get<ApiResponse<AgencyClient[]>>('/enterprises/me/agency-clients');
	},

	create(body: CreateAgencyClientBody) {
		return api.post<ApiResponse<AgencyClient>>('/enterprises/me/agency-clients', body);
	},

	patch(id: string, body: PatchAgencyClientBody) {
		return api.patch<ApiResponse<AgencyClient>>(`/enterprises/me/agency-clients/${id}`, body);
	},

	remove(id: string) {
		return api.delete<ApiResponse<{ removed: boolean }>>(`/enterprises/me/agency-clients/${id}`);
	}
};
