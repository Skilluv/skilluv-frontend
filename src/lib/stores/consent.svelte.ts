/**
 * Skilluv consent store — RGPD-compliant.
 *
 * Backend contract (see src/lib/api/privacy.ts):
 *   - GET  /legal/consent-version → { version, pages }
 *   - POST /legal/consent        → { analytics, marketing }
 *
 * Categories:
 *   - essential : always ON, non-negotiable (session, CSRF, auth). Documented
 *     to the user but not toggleable.
 *   - analytics : PostHog opt-in (strict, default OFF).
 *   - marketing : any marketing traceur, opt-in strict, default OFF.
 *
 * Persistence strategy:
 *   - localStorage key `skilluv-consent-v<version>` holds a JSON snapshot of
 *     the user's choices + timestamp + version. Presence of the key means the
 *     banner is dismissed. If the backend's `version` changes, the old key is
 *     ignored (still present but stale) → banner re-appears.
 *   - Best-effort POST to /legal/consent so anonymous choices are stored
 *     server-side too when possible (backend accepts anon or authenticated).
 *
 * Revocation is a first-class operation: `revoke()` clears local snapshot AND
 * calls recordConsent({ analytics: false, marketing: false }).
 */

import { privacyApi } from '$lib/api/privacy';

export interface ConsentChoices {
	analytics: boolean;
	marketing: boolean;
}

export interface ConsentSnapshot extends ConsentChoices {
	essential: true;
	version: number;
	decidedAt: string;
}

const STORAGE_PREFIX = 'skilluv-consent-v';
const VERSION_PROBE_KEY = 'skilluv-consent-version';

function storageKey(version: number): string {
	return `${STORAGE_PREFIX}${version}`;
}

class ConsentState {
	/** Current consent version (from backend). 0 = not yet loaded. */
	version = $state<number>(0);
	/** True while we resolve version + local snapshot. */
	loading = $state<boolean>(true);
	/** Present snapshot for the *current* version, or null if no decision yet. */
	snapshot = $state<ConsentSnapshot | null>(null);
	/** Should we render the banner right now? */
	bannerVisible = $state<boolean>(false);
	/** Should we render the preferences modal right now? */
	modalOpen = $state<boolean>(false);

	get analyticsAllowed(): boolean {
		return this.snapshot?.analytics === true;
	}

	get marketingAllowed(): boolean {
		return this.snapshot?.marketing === true;
	}

	get hasDecided(): boolean {
		return this.snapshot !== null;
	}

	/**
	 * Decide what to show, then reconcile with the backend.
	 *
	 * The order matters. Awaiting the version first meant the banner waited on
	 * a network round trip that the API client retries with a 1s/3s/9s backoff
	 * — so against a slow or absent backend nothing was asked for thirteen
	 * seconds, and a visitor could read half the site before being offered a
	 * choice. Worse, it failed open: no banner looks exactly like no
	 * obligation.
	 *
	 * So the local answer is computed immediately from the cached version, and
	 * the fetch runs after. If the backend reports a newer text, the snapshot
	 * is re-read against it and the banner returns — which is the behaviour a
	 * changed consent text requires anyway.
	 */
	async init(): Promise<void> {
		if (typeof window === 'undefined') return;

		const cachedVersion = Number(localStorage.getItem(VERSION_PROBE_KEY) ?? '1');
		this.version = Number.isFinite(cachedVersion) && cachedVersion > 0 ? cachedVersion : 1;
		this.readSnapshotForCurrentVersion();
		this.bannerVisible = !this.hasDecided;
		this.loading = false;

		try {
			const res = await privacyApi.consentVersion();
			const fetched = res?.data?.version;
			if (fetched && Number.isFinite(fetched) && fetched !== this.version) {
				this.version = fetched;
				localStorage.setItem(VERSION_PROBE_KEY, String(fetched));
				// A new text invalidates the old agreement: re-read against the
				// new key, which will be absent, and ask again.
				this.readSnapshotForCurrentVersion();
				this.bannerVisible = !this.hasDecided;
			}
		} catch {
			// Silent — the cached version is a safe basis, and failing to reach
			// the backend must never mean skipping the question.
		}
	}

	/** Re-open the banner/modal (used by "manage my preferences"). */
	openPreferences(): void {
		this.modalOpen = true;
	}

	closeModal(): void {
		this.modalOpen = false;
	}

	async acceptAll(): Promise<void> {
		await this.commit({ analytics: true, marketing: true });
	}

	async rejectAll(): Promise<void> {
		await this.commit({ analytics: false, marketing: false });
	}

	async updatePreferences(prefs: ConsentChoices): Promise<void> {
		await this.commit(prefs);
	}

	async revoke(): Promise<void> {
		if (typeof window !== 'undefined' && this.version > 0) {
			localStorage.removeItem(storageKey(this.version));
		}
		this.snapshot = null;
		this.bannerVisible = true;
		this.modalOpen = false;
		try {
			await privacyApi.recordConsent({ analytics: false, marketing: false });
		} catch {
			// Silent — user has revoked locally, backend sync is best-effort.
		}
	}

	private async commit(prefs: ConsentChoices): Promise<void> {
		const snap: ConsentSnapshot = {
			essential: true,
			analytics: !!prefs.analytics,
			marketing: !!prefs.marketing,
			version: this.version || 1,
			decidedAt: new Date().toISOString()
		};
		this.snapshot = snap;
		this.bannerVisible = false;
		this.modalOpen = false;

		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(storageKey(snap.version), JSON.stringify(snap));
			} catch {
				// Quota / private mode — swallow, snapshot still in memory for session.
			}
		}

		try {
			await privacyApi.recordConsent({
				analytics: snap.analytics,
				marketing: snap.marketing
			});
		} catch {
			// Best-effort — user's local choice is what matters for the RGPD gate.
		}
	}

	private readSnapshotForCurrentVersion(): void {
		if (typeof window === 'undefined' || this.version <= 0) {
			this.snapshot = null;
			return;
		}
		const raw = localStorage.getItem(storageKey(this.version));
		if (!raw) {
			this.snapshot = null;
			return;
		}
		try {
			const parsed = JSON.parse(raw) as Partial<ConsentSnapshot>;
			if (
				typeof parsed.analytics === 'boolean' &&
				typeof parsed.marketing === 'boolean' &&
				typeof parsed.decidedAt === 'string' &&
				parsed.version === this.version
			) {
				this.snapshot = {
					essential: true,
					analytics: parsed.analytics,
					marketing: parsed.marketing,
					version: parsed.version,
					decidedAt: parsed.decidedAt
				};
				return;
			}
			this.snapshot = null;
		} catch {
			this.snapshot = null;
		}
	}
}

export const consent = new ConsentState();

/** Test-only: reset the singleton to pristine. NOT exported through index. */
export function __resetConsentForTests(): void {
	consent.version = 0;
	consent.loading = true;
	consent.snapshot = null;
	consent.bannerVisible = false;
	consent.modalOpen = false;
}
