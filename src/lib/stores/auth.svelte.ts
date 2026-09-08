import type { UserPrivate, LoginMethod, Capability, UserCapability, UserOrientation } from '$lib/types';
import { api } from '$lib/api/client';
import { capabilitiesApi, hasCapability } from '$lib/api/capabilities';
import { orientationsApi } from '$lib/api/orientations';
import { bookmarks } from './bookmarks.svelte';

class AuthState {
	user = $state<UserPrivate | null>(null);
	/**
	 * How the current session was authenticated. Surfaced by every login /
	 * refresh / /auth/me response so the enterprise layout guard can decide
	 * whether to skip the mandatory-TOTP redirect: `sso` and `webauthn` are
	 * strong-factor methods that already satisfy the 2FA bar, everything else
	 * still needs a TOTP setup for enterprise/recruiter accounts.
	 */
	loginMethod = $state<LoginMethod | null>(null);
	/** True when the user has at least one WebAuthn credential. Combined with
	 * `user.totp_enabled` to decide whether the enterprise 2FA gate is
	 * satisfied — either strong factor is enough. */
	hasPasskey = $state(false);
	/** P18.4 — capabilities de contribution actives. Chargées après /auth/me.
	 * Un fetch séparé permet un rafraîchissement à la demande (ex: après
	 * qu'un event WS ait signalé une nouvelle capability accordée). */
	capabilities = $state<UserCapability[]>([]);
	/**
	 * True once the capabilities response landed (or failed).
	 *
	 * Capability-gated pages must wait for this before deciding: evaluating
	 * `auth.can(...)` while the fetch is still in flight yields "no permission"
	 * and they never re-check. Until it flips, show a loading state, not a
	 * refusal.
	 */
	capabilitiesLoaded = $state(false);
	/**
	 * Whether the trades have been asked for yet.
	 *
	 * `user.orientations` is `undefined` until the fetch lands, and "not asked
	 * yet" was being read as "has none": on every reload the prompt banner
	 * appeared for a moment and then vanished as the answer arrived. Telling
	 * somebody to choose the trades they have already chosen, once per page
	 * load, for as long as the request takes.
	 *
	 * Anything that acts on the absence of trades has to wait for this rather
	 * than assume zero.
	 */
	orientationsLoaded = $state(false);
	loading = $state(true);
	/** Identity whose capabilities + orientations were already loaded. */
	private extrasLoadedFor: string | null = null;

	get isAuthenticated(): boolean {
		return this.user !== null;
	}

	get isProfileActive(): boolean {
		return this.user?.profile_active ?? false;
	}

	get displayName(): string {
		return this.user?.display_name ?? '';
	}

	get title(): string {
		return this.user?.title ?? 'apprenti';
	}

	/** True when the current session was minted with a factor that already
	 * satisfies the mandatory-TOTP bar (SSO's external IdP or a WebAuthn
	 * passkey). */
	get isStrongFactorSession(): boolean {
		return this.loginMethod === 'sso' || this.loginMethod === 'webauthn';
	}

	/** True when the enterprise 2FA requirement is satisfied by either an
	 * armed TOTP secret or at least one enrolled passkey. */
	get hasStrongFactorEnrolled(): boolean {
		return (this.user?.totp_enabled ?? false) || this.hasPasskey;
	}

	/** Capability check honoring expiry. Wrapper autour de hasCapability(). */
	can(capability: Capability): boolean {
		return hasCapability(this.capabilities, capability);
	}

	setUser(user: UserPrivate | null, loginMethod: LoginMethod | null = null) {
		this.user = user;
		if (loginMethod !== null) this.loginMethod = loginMethod;
		this.loading = false;
	}

	/** Initialise l'état auth côté client via /auth/me + charge capabilities + orientations. */
	async init() {
		this.loading = true;
		try {
			const res = await api.get<{
				data: { user: UserPrivate; login_method?: LoginMethod; has_passkey?: boolean };
			}>('/auth/me');
			this.user = res.data.user;
			this.loginMethod = res.data.login_method ?? null;
			this.hasPasskey = res.data.has_passkey ?? false;
			// Load capabilities and orientations in parallel — both are enrichments
			// that don't gate the primary /auth/me success signal. Failures are
			// swallowed silently: missing endpoints or transient errors leave the
			// arrays empty which UI treats as "not yet loaded / none".
			await Promise.allSettled([this.refreshCapabilities(), this.refreshOrientations()]);
		} catch {
			this.user = null;
			this.loginMethod = null;
			this.hasPasskey = false;
			this.capabilities = [];
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Loads session extras (capabilities + orientations) when the user comes
	 * from SSR rather than from `init()`.
	 *
	 * The layout hydrates auth via `setUser(data.user)` and never calls
	 * `init()`, which only runs on two pages. Without this, `capabilities`
	 * stayed empty on a normal login or any reload, so every `auth.can(...)`
	 * gate returned false and all capability-gated UI stayed hidden from the
	 * users entitled to it.
	 *
	 * Idempotent: one load per identity, never during SSR.
	 */
	async hydrateSessionExtras(): Promise<void> {
		if (typeof window === 'undefined') return;
		const id = this.user?.id ?? null;
		if (!id) {
			// Anonymous visitor: nothing to load, but the state must still be
			// "known" or capability-gated pages hang on their loading skeleton.
			this.capabilities = [];
			this.capabilitiesLoaded = true;
			this.orientationsLoaded = true;
			return;
		}
		if (this.extrasLoadedFor === id) return;
		this.extrasLoadedFor = id;
		await Promise.allSettled([this.refreshCapabilities(), this.refreshOrientations()]);
	}

	/** Rafraîchit uniquement les capabilities. Appelable après un event WS
	 * `capabilities_recomputed` sans re-fetch le /auth/me complet. */
	async refreshCapabilities() {
		if (!this.user) {
			this.capabilities = [];
			this.capabilitiesLoaded = true;
			return;
		}
		try {
			const res = await capabilitiesApi.myCapabilities();
			this.capabilities = Array.isArray(res.data) ? res.data : [];
		} catch {
			this.capabilities = [];
		} finally {
			this.capabilitiesLoaded = true;
		}
	}

	/** Rafraîchit les orientations et les propage dans user.orientations —
	 * consommé par OrientationPromptBanner + OrientationSoftBlock pour décider
	 * du soft-block. Appelable après un save orientation sans re-init complet. */
	async refreshOrientations() {
		if (!this.user) return;
		try {
			const res = await orientationsApi.myOrientations();
			// An envelope. Assigning `res.data` straight in put `{ orientations:
			// [...] }` where an array belonged, so every `.length` was `undefined`
			// and every "has a trade" check read zero.
			const orientations: UserOrientation[] = res.data?.orientations ?? [];
			this.user = { ...this.user, orientations };
		} catch {
			// Endpoint may not exist yet — treat as empty rather than crashing.
			this.user = { ...this.user, orientations: [] };
		} finally {
			// Answered either way. A failure is a known empty list, not an
			// unknown one: the banner is right to appear when we asked and got
			// nothing back.
			this.orientationsLoaded = true;
		}
	}

	async logout() {
		try {
			await api.post('/auth/logout');
		} finally {
			this.user = null;
			this.loginMethod = null;
			this.hasPasskey = false;
			this.capabilities = [];
			// The saved-items index is per-user; leaving it behind would show
			// the next person on this browser someone else's bookmarks.
			bookmarks.reset();
		}
	}

	clear() {
		this.user = null;
		this.loginMethod = null;
		this.hasPasskey = false;
		this.capabilities = [];
		// Nothing to load for nobody, so the answer is known rather than
		// pending: leaving it false would hold every "has no trades" surface in
		// limbo for a signed-out visitor.
		this.orientationsLoaded = true;
		this.loading = false;
		bookmarks.reset();
	}
}

export const auth = new AuthState();
