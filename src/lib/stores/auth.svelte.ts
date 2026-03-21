import type { UserPrivate } from '$lib/types';
import { api } from '$lib/api/client';

class AuthState {
	user = $state<UserPrivate | null>(null);
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

	setUser(user: UserPrivate | null) {
		this.user = user;
		this.loading = false;
	}

	/** Initialise l'état auth côté client via /auth/me */
	async init() {
		this.loading = true;
		try {
			const res = await api.get<{ data: { user: UserPrivate } }>('/auth/me');
			this.user = res.data.user;
		} catch {
			this.user = null;
		} finally {
			this.loading = false;
		}
	}

	async logout() {
		try {
			await api.post('/auth/logout');
		} finally {
			this.user = null;
		}
	}

	clear() {
		this.user = null;
		this.loading = false;
	}
}

export const auth = new AuthState();
