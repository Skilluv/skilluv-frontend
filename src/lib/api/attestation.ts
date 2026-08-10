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

// SKI-115 endpoint hors /api (public verify)
const publicApi = createApiClient(fetch, '');

export const attestationApi = {
	// GET /verify/{hash} — retourne le JSON attestation
	verify(hash: string) {
		return publicApi.get<AttestationResponse>(`/verify/${encodeURIComponent(hash)}`);
	},

	// URL directe du PDF (deep link, pas de fetch cote front)
	pdfUrl(hash: string): string {
		return `/verify/${encodeURIComponent(hash)}.pdf`;
	},

	// SKI-116 badge user SVG (URL directe)
	badgeUserUrl(username: string): string {
		return `/badge/user/${encodeURIComponent(username)}/validated.svg`;
	},

	// SKI-117 badge repo SVG (URL directe)
	badgeRepoUrl(owner: string, name: string): string {
		return `/badge/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/validated.svg`;
	}
};
