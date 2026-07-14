import type { Theme, ThemeBase, ThemeMode } from '$lib/types';

const THEME_KEY = 'skilluv-theme';
const MODE_KEY = 'skilluv-mode';
const VALID_BASES: ThemeBase[] = ['forge', 'vesperal', 'arena', 'scriptorium', 'sakura'];

/** Migration table for legacy theme names. */
const LEGACY_MIGRATIONS: Record<string, ThemeBase> = {
	neon: 'vesperal',
	terminal: 'scriptorium'
};

class ThemeState {
	base = $state<ThemeBase>('forge');
	mode = $state<ThemeMode>('dark');
	current = $derived<Theme>(this.mode === 'dark' ? this.base : `${this.base}-light`);

	/** Initialise le theme depuis localStorage — migre les anciens noms si besoin. */
	init() {
		if (typeof window === 'undefined') return;

		const storedBase = localStorage.getItem(THEME_KEY);
		if (storedBase) {
			if (LEGACY_MIGRATIONS[storedBase]) {
				this.base = LEGACY_MIGRATIONS[storedBase];
				localStorage.setItem(THEME_KEY, this.base);
			} else if (VALID_BASES.includes(storedBase as ThemeBase)) {
				this.base = storedBase as ThemeBase;
			}
		}

		const storedMode = localStorage.getItem(MODE_KEY);
		if (storedMode === 'light' || storedMode === 'dark') {
			this.mode = storedMode;
		}

		this.apply();
	}

	set(themeBase: ThemeBase) {
		this.base = themeBase;
		if (typeof window !== 'undefined') {
			localStorage.setItem(THEME_KEY, themeBase);
			this.apply();
		}
	}

	toggleMode() {
		this.mode = this.mode === 'dark' ? 'light' : 'dark';
		if (typeof window !== 'undefined') {
			localStorage.setItem(MODE_KEY, this.mode);
			this.apply();
		}
	}

	setMode(mode: ThemeMode) {
		this.mode = mode;
		if (typeof window !== 'undefined') {
			localStorage.setItem(MODE_KEY, mode);
			this.apply();
		}
	}

	private apply() {
		document.documentElement.setAttribute('data-theme', this.current);
	}
}

export const theme = new ThemeState();
