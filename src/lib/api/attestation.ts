import { env } from '$env/dynamic/public';
import { createApiClient } from './client';

// --- Types (P26 v2 attestation publique) ---

export interface AttestationValid {
	valid: true;
	challenger: {
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	validator: {
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	pr_url: string;
	repo: string;
	domain: string;
	difficulty: number;
	validated_at: string;
	merged_upstream: boolean;
}

export interface AttestationInvalid {
	valid: false;
	reason: 'malformed attestation hash' | 'unknown attestation hash' | string;
}

export type AttestationResponse = AttestationValid | AttestationInvalid;

const api = createApiClient();

/**
 * Origin of the backend, without the `/api` prefix.
 *
 * The PDF and the badge SVGs are served from the backend ROOT, not under
 * `/api`. Referencing them with a relative path resolved them against the
 * frontend origin instead, where `/badge/*` does not exist and `/verify/*` is
 * taken by the verification page itself — so every badge and every PDF link was
 * broken. They are consumed as `href` / `src`, never fetched, so an absolute
 * cross-origin URL needs no CORS.
 */
function backendOrigin(): string {
	return (env.PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');
}

export const attestationApi = {
	/**
	 * Verification payload.
	 *
	 * Goes through `/api` so it stays same-origin behind the existing proxy.
	 * See SKI-288: the backend also serves this at its root, but that path
	 * collides with this app's own `/verify/[hash]` page.
	 */
	verify(hash: string) {
		// Bare payload, not the `{ data, meta }` envelope: this route mirrors the
		// public root endpoint, which returns the object directly.
		return api.get<AttestationResponse>(`/verify/${encodeURIComponent(hash)}`);
	},

	/**
	 * OpenGraph card, rendered per attestation (SKI-292). 1200x630 PNG, served
	 * under `/api` so it stays same-origin behind the existing proxy.
	 */
	ogImageUrl(hash: string): string {
		return `${backendOrigin()}/api/verify/${encodeURIComponent(hash)}/og.png`;
	},

	/** Direct PDF link (SKI-118). */
	pdfUrl(hash: string): string {
		return `${backendOrigin()}/verify/${encodeURIComponent(hash)}.pdf`;
	},

	/** User badge SVG (SKI-116). */
	badgeUserUrl(username: string): string {
		return `${backendOrigin()}/badge/user/${encodeURIComponent(username)}/validated.svg`;
	},

	/** Repo badge SVG (SKI-117). */
	badgeRepoUrl(owner: string, name: string): string {
		return `${backendOrigin()}/badge/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/validated.svg`;
	}
};
