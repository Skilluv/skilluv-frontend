import { THEME_KEYS } from '$lib/config/themes';
import type { Theme, ThemeBase, ThemeMode } from '$lib/types';

const THEME_KEY = 'skilluv-theme';
const MODE_KEY = 'skilluv-mode';
// Derived from the catalogue rather than repeated: a theme added there and
// forgotten here would be selectable in the switcher and rejected on reload.
const VALID_BASES: readonly ThemeBase[] = THEME_KEYS;

/** Migration table for legacy theme names. */
const LEGACY_MIGRATIONS: Record<string, ThemeBase> = {
	neon: 'vesperal',
	terminal: 'scriptorium'
};

class ThemeState {
	base = $state<ThemeBase>('forge');
	// Light is the default. It has to match the inline script in `app.html`,
	// which paints `data-theme` before hydration: if the two disagree the page
	// renders in one mode and flips to the other the moment Svelte takes over.
	mode = $state<ThemeMode>('light');
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
