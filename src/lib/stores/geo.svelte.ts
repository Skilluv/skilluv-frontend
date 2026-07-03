import { geoApi, type Country } from '$lib/api/geo';

class GeoState {
	countries = $state<Country[]>([]);
	loading = $state(false);
	loaded = $state(false);
	error = $state<string | null>(null);

	private pending: Promise<void> | null = null;

	async ensureCountries(): Promise<void> {
		if (this.loaded || this.loading) {
			return this.pending ?? Promise.resolve();
		}
		this.loading = true;
		this.error = null;
		this.pending = (async () => {
			try {
				const res = await geoApi.getCountries();
				this.countries = res.data;
				this.loaded = true;
			} catch (err) {
				this.error = err instanceof Error ? err.message : 'Failed to load countries';
			} finally {
				this.loading = false;
				this.pending = null;
			}
		})();
		return this.pending;
	}

	/** Lookup by ISO3 or ISO2 — returns the country or undefined. */
	find(code: string | null | undefined): Country | undefined {
		if (!code) return undefined;
		const c = code.toUpperCase();
		return this.countries.find((co) => co.iso3 === c || co.iso2 === c);
	}

	/** Human-readable label from an ISO3/ISO2 code. */
	label(code: string | null | undefined): string {
		const c = this.find(code);
		return c?.name ?? code ?? '';
	}
}

export const geo = new GeoState();
