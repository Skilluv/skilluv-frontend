import type { OrientationMode, SkillDomain } from '$lib/types';
import { orientationsApi, type RegisterOrientationRequest } from '$lib/api/orientations';
import { isPublicDomain } from '$lib/data/domains';

/**
 * What the enlistment carries between its four screens.
 *
 * The domain and the trades are chosen before the account exists, because being
 * asked to fill a form before you have seen anything is the fastest way to
 * lose somebody. The backend cannot be told about a trade without a session
 * (`POST /users/me/orientations` is authenticated), so the picks wait here and
 * are replayed the moment the account is created.
 *
 * ## Why sessionStorage rather than a plain store
 *
 * A signup survives a page refresh and dies with the tab, and that is exactly
 * sessionStorage's lifetime. A plain store loses a hand-picked domain to a
 * mistyped URL or a reload; localStorage would greet somebody next week with a
 * half-finished enlistment they had forgotten choosing.
 *
 * Nothing personal is stored: a domain slug and up to three public trade
 * slugs. The account form is never persisted — an email and a password left in
 * a browser store on a shared machine is the kind of convenience nobody asked
 * for.
 */

const STORAGE_KEY = 'skilluv-enlist';

/** The cap the backend enforces (`MAX_ACTIVE_ORIENTATIONS`, 409 beyond). */
export const MAX_PATHS = 3;

export interface PathPick {
	slug: string;
	name: string;
	mode: OrientationMode;
}

interface Persisted {
	domain: SkillDomain | null;
	picks: PathPick[];
	primary: number;
}

function readStorage(): Persisted | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<Persisted>;
		// Anything in a browser store is user-writable. A domain that is not a
		// discipline, or a fourth pick, must not reach the API as-is.
		const domain = isPublicDomain(parsed.domain) ? parsed.domain : null;
		const picks = Array.isArray(parsed.picks)
			? parsed.picks
					.filter(
						(p): p is PathPick =>
							!!p && typeof p.slug === 'string' && typeof p.name === 'string'
					)
					.slice(0, MAX_PATHS)
			: [];
		const primary =
			typeof parsed.primary === 'number' && parsed.primary >= 0 && parsed.primary < picks.length
				? parsed.primary
				: 0;
		return { domain, picks, primary };
	} catch {
		// A malformed entry is a fresh start, not an error to show anybody.
		return null;
	}
}

class EnlistState {
	domain = $state<SkillDomain | null>(null);
	picks = $state<PathPick[]>([]);
	/** Index into `picks`. The backend allows exactly one primary orientation. */
	primary = $state(0);
	/** True once `restore()` has run, so a guard does not redirect on first paint. */
	ready = $state(false);

	/** Read the tab's stored enlistment. Safe to call on every mount. */
	restore() {
		if (this.ready) return;
		const stored = readStorage();
		if (stored) {
			this.domain = stored.domain;
			this.picks = stored.picks;
			this.primary = stored.primary;
		}
		this.ready = true;
	}

	private persist() {
		if (typeof window === 'undefined') return;
		try {
			const payload: Persisted = {
				domain: this.domain,
				picks: this.picks,
				primary: this.primary
			};
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		} catch {
			// Private browsing, a full quota, a browser set to block site data.
			// The enlistment still works for as long as the page lives; losing
			// the ability to survive a refresh is not worth an error banner.
		}
	}

	/**
	 * Choosing a domain clears the trades that belonged to the previous one.
	 *
	 * Going back and switching from design to audio used to be the fastest way
	 * to register for a trade you never saw: the picks are scoped to a domain,
	 * so they die with it.
	 */
	chooseDomain(domain: SkillDomain) {
		if (this.domain !== domain) {
			this.picks = [];
			this.primary = 0;
		}
		this.domain = domain;
		this.persist();
	}

	get hasDomain(): boolean {
		return this.domain !== null;
	}

	isPicked(slug: string): boolean {
		return this.picks.some((p) => p.slug === slug);
	}

	/** Position in the selection, 1-based, or `null` when unpicked. */
	pickOrder(slug: string): number | null {
		const idx = this.picks.findIndex((p) => p.slug === slug);
		return idx === -1 ? null : idx + 1;
	}

	get isFull(): boolean {
		return this.picks.length >= MAX_PATHS;
	}

	/** Adds, or removes when already there. Returns false when the cap refused it. */
	togglePath(slug: string, name: string): boolean {
		const idx = this.picks.findIndex((p) => p.slug === slug);
		if (idx !== -1) {
			this.picks = this.picks.filter((_, i) => i !== idx);
			if (this.primary >= this.picks.length) this.primary = Math.max(0, this.picks.length - 1);
			this.persist();
			return true;
		}
		if (this.isFull) return false;
		this.picks = [...this.picks, { slug, name, mode: 'learning' }];
		this.persist();
		return true;
	}

	setMode(slug: string, mode: OrientationMode) {
		this.picks = this.picks.map((p) => (p.slug === slug ? { ...p, mode } : p));
		this.persist();
	}

	setPrimary(index: number) {
		if (index < 0 || index >= this.picks.length) return;
		this.primary = index;
		this.persist();
	}

	/**
	 * Register the picks now that a session exists.
	 *
	 * Sequential, not concurrent: the cap is counted server-side per request,
	 * and three parallel posts against a cap of three is how you discover a
	 * race you did not need. Three round-trips on the one screen where the
	 * person is already watching a confirmation is a cost worth paying.
	 *
	 * Failures are collected, not thrown. An account exists at this point, and
	 * losing it because the second of three trades was refused would be far
	 * worse than landing with two trades and a line saying so.
	 */
	async replay(): Promise<{ registered: string[]; failed: string[] }> {
		const registered: string[] = [];
		const failed: string[] = [];
		for (const [i, pick] of this.picks.entries()) {
			const payload: RegisterOrientationRequest = {
				orientation_slug: pick.slug,
				mode: pick.mode,
				is_primary: i === this.primary
			};
			try {
				await orientationsApi.register(payload);
				registered.push(pick.slug);
			} catch {
				failed.push(pick.slug);
			}
		}
		return { registered, failed };
	}

	/** Called once the enlistment is over — the account exists and carries it. */
	clear() {
		this.domain = null;
		this.picks = [];
		this.primary = 0;
		if (typeof window === 'undefined') return;
		try {
			sessionStorage.removeItem(STORAGE_KEY);
		} catch {
			// Same reasoning as `persist`.
		}
	}
}

export const enlist = new EnlistState();
