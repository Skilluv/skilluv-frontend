import { env } from '$env/dynamic/public';
import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

/** An issued attestation, as the `attestations` table stores it. */
export interface IssuedAttestation {
	id: string;
	user_id: string;
	attestation_type: string;
	title: string;
	description: string;
	icon: string | null;
	linked_deliverable_ids: string[];
	linked_skill_node_ids: string[];
	linked_project_ids: string[];
	linked_reviewer_ids: string[];
	/** `skilluv` or an organisation. */
	issued_by_type: string;
	issued_by_org_id: string | null;
	verification_code: string;
	public: boolean;
	revoked_at: string | null;
	revoked_by_user_id: string | null;
	revoke_reason: string | null;
	issued_at: string;
	expires_at: string | null;
}

/**
 * The three outcomes of a code lookup, discriminated on `valid`.
 *
 * A revoked attestation still comes back with its body: the reader asked
 * whether a document stands, and "it was issued and then withdrawn" is a more
 * useful answer than "no".
 */
export interface IssuedAttestationVerifyResponse {
	valid: boolean;
	/** Present only when invalid: `revoked` or `not_found`. */
	reason?: string;
	attestation?: IssuedAttestation;
	verification_url?: string;
}

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
	/** Every attestation somebody holds. Public, by user id. */
	forUser(userId: string) {
		return api.get<ApiResponse<{ attestations: unknown[] }>>(
			`/users/${encodeURIComponent(userId)}/attestations`
		);
	},

	/**
	 * Issue a compagnonnage attestation.
	 *
	 * The one kind a person issues about another person rather than the
	 * platform issuing about work. It is somebody putting their name behind
	 * somebody else, which is why it is a deliberate act with its own endpoint.
	 */
	issueCompagnonnage(body: Record<string, unknown>) {
		return api.post<ApiResponse<unknown>>('/attestations/compagnonnage', body);
	},

	/**
	 * Revoke one.
	 *
	 * Revoked rather than deleted: a verification link that has been shared
	 * must keep answering, and answering "revoked" is the whole point. Deleting
	 * would turn a withdrawn claim into a broken link, which reads as a
	 * platform fault rather than as a withdrawal.
	 */
	revoke(id: string, reason?: string) {
		return api.post<ApiResponse<unknown>>(
			`/attestations/${encodeURIComponent(id)}/revoke`,
			reason ? { reason } : {}
		);
	},

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
	},

	/**
	 * Verify an issued attestation by its 12-character code.
	 *
	 * A different object from `verify()` above, despite the shared word. That
	 * one resolves a 64-hex `attestation_hash` on a validated slice; this one
	 * resolves a `verification_code` on the `attestations` table — the
	 * documents the design programme, compagnonnage and certifications issue.
	 *
	 * All three outcomes come back as 200 with a discriminated body, so a
	 * third-party verifier renders each state without decoding error codes.
	 */
	verifyIssued(code: string) {
		return api.get<ApiResponse<IssuedAttestationVerifyResponse>>(
			`/attestations/verify/${encodeURIComponent(code)}`
		);
	},

	/**
	 * Share card for an issued attestation — 1200x630 PNG, the size every
	 * social preview crops to.
	 *
	 * Served under `/api`, so it stays same-origin behind the existing proxy
	 * and needs no CORS: it is consumed as an `og:image` and as an `<img>`,
	 * never fetched.
	 *
	 * The backend caches it for an hour rather than for ever, on purpose — an
	 * attestation can be revoked, and a card cached for a year would keep
	 * saying it holds long after it stopped. Nothing here may extend that.
	 */
	issuedCardUrl(code: string): string {
		return `${backendOrigin()}/api/attestations/verify/${encodeURIComponent(code)}/card.png`;
	},

	/**
	 * The certificate itself, as SVG.
	 *
	 * The visual half of the design attestations (A-03): a document somebody
	 * can print or attach, as opposed to the card, which exists to be
	 * unfurled by a chat client. Vector rather than PDF, so it renders inline
	 * in the page that already knows the code exists.
	 */
	issuedCertificateUrl(code: string): string {
		return `${backendOrigin()}/api/attestations/verify/${encodeURIComponent(code)}/certificate.svg`;
	}
};

/**
 * The share card and the certificate for a verification code.
 *
 * Addresses rather than calls: both are images the browser renders from an
 * `<img>` or Open Graph tag. Fetching them into a blob would work and would
 * also mean the card never appears in a link preview, which is the only place
 * it earns its existence.
 */
export function verifyCardUrl(code: string, baseUrl = '/api'): string {
	return `${baseUrl}/attestations/verify/${encodeURIComponent(code)}/card.png`;
}

export function verifyCertificateUrl(code: string, baseUrl = '/api'): string {
	return `${baseUrl}/attestations/verify/${encodeURIComponent(code)}/certificate.svg`;
}
