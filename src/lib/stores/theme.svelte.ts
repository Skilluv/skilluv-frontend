import type { Theme } from '$lib/types';

const STORAGE_KEY = 'skilluv-theme';
const VALID_THEMES: Theme[] = ['forge', 'neon', 'arena', 'terminal'];

class ThemeState {
	current = $state<Theme>('forge');

	/** Initialise le thème depuis localStorage */
	init() {
		if (typeof window === 'undefined') return;

		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && VALID_THEMES.includes(stored as Theme)) {
			this.current = stored as Theme;
		}
		this.apply();
	}

	set(theme: Theme) {
		this.current = theme;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, theme);
			this.apply();
		}
	}

	private apply() {
		document.documentElement.setAttribute('data-theme', this.current);
	}
}

export const theme = new ThemeState();
