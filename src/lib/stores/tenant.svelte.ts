import { tenantsApi, type TenantPublic, ROOT_TENANT_ID, ROOT_TENANT_SLUG } from '$lib/api/tenants';

/**
 * Store global du tenant courant — Phase 5.9.
 *
 * Résolu automatiquement par le backend depuis le sous-domaine (X-Skilluv-Tenant
 * header pour le dev). Injecte primary_color en CSS var `--sk-primary` sur
 * `<html data-tenant-theme>`.
 */
class TenantState {
	current = $state<TenantPublic | null>(null);
	loading = $state(false);
	loaded = $state(false);

	get isRoot(): boolean {
		return !this.current || this.current.id === ROOT_TENANT_ID || this.current.slug === ROOT_TENANT_SLUG;
	}

	get isWhiteLabel(): boolean {
		return !this.isRoot;
	}

	get name(): string {
		return this.current?.name ?? 'Skilluv';
	}

	get logoUrl(): string | null {
		return this.current?.logo_url ?? null;
	}

	async load() {
		if (this.loading || this.loaded) return;

		// Skip en dev sur localhost ou IP directe : le backend résoudrait sur le
		// tenant racine de toute façon (pas de sous-domaine tenant possible), et
		// ça évite le spam du proxy Vite si le backend est down.
		if (typeof window !== 'undefined' && this.isLocalhostOrIp(window.location.hostname)) {
			this.loaded = true;
			return;
		}

		this.loading = true;
		try {
			const res = await tenantsApi.current();
			this.current = res.data;
			this.applyTheming();
		} catch {
			// silent — fallback root (backend down, offline, etc.)
			// On garde `current = null` et l'appli tourne en mode racine.
		} finally {
			this.loaded = true;
			this.loading = false;
		}
	}

	private isLocalhostOrIp(hostname: string): boolean {
		if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
		// IPv4 littérale
		if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return true;
		// IPv6 littérale (bracketted ou raw contient un ':')
		if (hostname.startsWith('[') || hostname.includes(':')) return true;
		return false;
	}

	private applyTheming() {
		if (typeof document === 'undefined' || !this.current) return;
		const doc = document.documentElement;

		if (this.current.primary_color && this.isWhiteLabel) {
			doc.style.setProperty('--sk-primary', this.current.primary_color);
			// Version "hover" : légèrement plus sombre (assombrissement 12%)
			doc.style.setProperty('--sk-primary-hover', darken(this.current.primary_color, 12));
			doc.setAttribute('data-tenant-theme', this.current.slug);
		} else {
			doc.style.removeProperty('--sk-primary');
			doc.style.removeProperty('--sk-primary-hover');
			doc.removeAttribute('data-tenant-theme');
		}

		if (this.current.secondary_color && this.isWhiteLabel) {
			doc.style.setProperty('--sk-accent', this.current.secondary_color);
			doc.style.setProperty('--sk-accent-hover', darken(this.current.secondary_color, 12));
		}

		// Meta theme-color pour la statut bar mobile
		const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
		if (meta && this.current.primary_color && this.isWhiteLabel) {
			meta.content = this.current.primary_color;
		}
	}
}

/** Assombrit une couleur hex de N %. Retourne la couleur inchangée en cas d'erreur. */
function darken(hex: string, pct: number): string {
	const m = hex.trim().replace('#', '');
	if (!/^[0-9a-f]{6,8}$/i.test(m)) return hex;
	const num = parseInt(m.slice(0, 6), 16);
	const factor = 1 - pct / 100;
	const r = Math.max(0, Math.round(((num >> 16) & 0xff) * factor));
	const g = Math.max(0, Math.round(((num >> 8) & 0xff) * factor));
	const b = Math.max(0, Math.round((num & 0xff) * factor));
	const alpha = m.length === 8 ? m.slice(6, 8) : '';
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alpha}`;
}

export const tenant = new TenantState();
