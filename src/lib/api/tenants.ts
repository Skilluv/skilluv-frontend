import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// Public tenant surface consumed by the multi-tenant store — the white-label
// resolver reads the current tenant from subdomain / X-Skilluv-Tenant header
// to theme the public shell. Every admin-only method (create / update / list
// members / cohorts) lives in the standalone admin app now — see
// `skilluv-admin/src/lib/api/tenants.ts` for the full surface.

export type TenantPlan = 'starter' | 'pro' | 'enterprise';

export const ROOT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const ROOT_TENANT_SLUG = 'skilluv';

export interface TenantPublic {
	id: string;
	slug: string;
	name: string;
	subdomain: string | null;
	custom_domain: string | null;
	logo_url: string | null;
	primary_color: string | null;
	secondary_color: string | null;
	plan: TenantPlan;
}

export const tenantsApi = {
	/** Resolved server-side from subdomain / X-Skilluv-Tenant header. */
	current() {
		return api.get<ApiResponse<TenantPublic>>('/tenants/current');
	}
};
