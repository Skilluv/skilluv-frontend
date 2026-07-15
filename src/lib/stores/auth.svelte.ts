import type { UserPrivate, LoginMethod, Capability, UserCapability } from '$lib/types';
import { api } from '$lib/api/client';
import { capabilitiesApi, hasCapability } from '$lib/api/capabilities';

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
	loading = $state(true);

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

	/** Initialise l'état auth côté client via /auth/me + charge capabilities. */
	async init() {
		this.loading = true;
		try {
			const res = await api.get<{
				data: { user: UserPrivate; login_method?: LoginMethod; has_passkey?: boolean };
			}>('/auth/me');
			this.user = res.data.user;
			this.loginMethod = res.data.login_method ?? null;
			this.hasPasskey = res.data.has_passkey ?? false;
			await this.refreshCapabilities();
		} catch {
			this.user = null;
			this.loginMethod = null;
			this.hasPasskey = false;
			this.capabilities = [];
		} finally {
			this.loading = false;
		}
	}

	/** Rafraîchit uniquement les capabilities. Appelable après un event WS
	 * `capabilities_recomputed` sans re-fetch le /auth/me complet. */
	async refreshCapabilities() {
		if (!this.user) {
			this.capabilities = [];
			return;
		}
		try {
			const res = await capabilitiesApi.myCapabilities();
			this.capabilities = res.data;
		} catch {
			this.capabilities = [];
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
		}
	}

	clear() {
		this.user = null;
		this.loginMethod = null;
		this.hasPasskey = false;
		this.capabilities = [];
		this.loading = false;
	}
}

export const auth = new AuthState();
