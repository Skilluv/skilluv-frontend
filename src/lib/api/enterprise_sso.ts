/**
 * Enterprise SSO + SCIM provisioning API wrappers.
 *
 * Backend: `src/routes/enterprise_sso.rs` (SSO owner CRUD + discovery + login
 * flow) and `src/routes/scim.rs` (SCIM 2.0 endpoints + token mgmt + role
 * mapping). The SCIM data-plane endpoints themselves (`/scim/v2/*`) are meant
 * for the IdP, not the browser — so we only expose the owner-side surface
 * here (token gen/revoke, group listing via SCIM as owner, role mapping).
 */

import type { SsoDiscoverResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// ─── SSO config CRUD (owner-authenticated) ───────────────────────

export interface SsoConfig {
	enterprise_id: string;
	issuer: string;
	client_id: string;
	client_secret: string; // '***REDACTED***' when reading
	email_domains: string[];
	enforce_sso: boolean;
	auto_provision: boolean;
	default_role: 'recruiter' | 'enterprise';
	disabled_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface SsoConfigResponse {
	data: {
		config: SsoConfig | null;
		redirect_uri?: string;
	};
}

export interface SsoConfigUpsertRequest {
	issuer: string;
	client_id: string;
	client_secret: string; // cleartext when writing — server encrypts at rest
	email_domains: string[];
	enforce_sso: boolean;
	auto_provision: boolean;
	default_role: 'recruiter' | 'enterprise';
}

// ─── SCIM group listing (via SCIM API as owner) ──────────────────

export interface ScimGroupView {
	id: string;
	external_id: string | null;
	display_name: string;
	mapped_role: 'recruiter' | 'enterprise' | null;
	members: string[];
	created_at: string;
	updated_at: string;
}

/** SCIM Group envelope as returned by GET /scim/v2/Groups/{id}. */
interface ScimGroupResource {
	id: string;
	externalId?: string | null;
	displayName: string;
	members: Array<{ value: string }>;
	'urn:skilluv:params:scim:schemas:extension:group:2.0:RoleMapping'?: {
		mappedRole: 'recruiter' | 'enterprise' | null;
	};
	meta?: { created: string; lastModified: string };
}

interface ScimListResponse<T> {
	totalResults: number;
	Resources: T[];
}

function scimToGroupView(g: ScimGroupResource): ScimGroupView {
	return {
		id: g.id,
		external_id: g.externalId ?? null,
		display_name: g.displayName,
		mapped_role:
			g['urn:skilluv:params:scim:schemas:extension:group:2.0:RoleMapping']?.mappedRole ?? null,
		members: (g.members ?? []).map((m) => m.value),
		created_at: g.meta?.created ?? '',
		updated_at: g.meta?.lastModified ?? ''
	};
}

// ─── Public API ──────────────────────────────────────────────────

export const enterpriseSsoApi = {
	/** Owner-only. Fetch the current SSO config (client_secret is redacted). */
	getConfig() {
		return api.get<SsoConfigResponse>('/enterprise/sso/config');
	},

	/** Owner-only. Create or update the SSO config. `client_secret` is sent in
	 * cleartext (over HTTPS) and encrypted at rest with SSO_ENCRYPTION_KEY. */
	upsertConfig(body: SsoConfigUpsertRequest) {
		return api.post<SsoConfigResponse>('/enterprise/sso/config', body);
	},

	/** Owner-only. Soft-disable SSO for this enterprise (clears the
	 * configuration but retains the row for audit). */
	deleteConfig() {
		return api.delete<{ data: { disabled: boolean } }>('/enterprise/sso/config');
	},

	/** Public. Used on the login page to detect whether SSO is available for
	 * the typed email domain. */
	discover(email: string) {
		return api.get<{ data: SsoDiscoverResponse }>('/enterprise/sso/discover', { email });
	},

	// ─── SCIM token management (owner-authenticated) ───────────────

	/** Generate a fresh SCIM bearer token. The cleartext is returned once —
	 * store it somewhere safe (the backend only keeps the SHA-256 hash).
	 * Previous token stays valid for 24h (rotation grace window). */
	generateScimToken() {
		return api.post<{
			data: { token: string; message: string; scim_base_url: string };
		}>('/enterprise/sso/scim/token');
	},

	revokeScimToken() {
		return api.delete<{ data: { revoked: boolean } }>('/enterprise/sso/scim/token');
	},

	// ─── SCIM groups (owner uses the SCIM API with an admin session) ─

	/** Owner-side listing of SCIM groups for the current enterprise. Note:
	 * this hits the SCIM data-plane, which requires the SCIM bearer token —
	 * so the caller must have generated one first and pass it in. */
	async listScimGroups(scimToken: string): Promise<ScimGroupView[]> {
		const res = await fetch('/api/scim/v2/Groups', {
			headers: { Authorization: `Bearer ${scimToken}` }
		});
		if (!res.ok) {
			throw new Error(`SCIM list groups failed: ${res.status}`);
		}
		const body = (await res.json()) as ScimListResponse<ScimGroupResource>;
		return body.Resources.map(scimToGroupView);
	},

	/** Owner-only. Map a SCIM group to a Skilluv role (or clear the mapping).
	 * Backend recomputes `enterprise_members.role` for every group member. */
	setGroupMappedRole(groupId: string, mappedRole: 'recruiter' | 'enterprise' | null) {
		return api.put<{
			data: { group_id: string; mapped_role: string | null; affected_users: number };
		}>(`/enterprise/sso/scim/groups/${groupId}/mapped-role`, { mapped_role: mappedRole });
	}
};
