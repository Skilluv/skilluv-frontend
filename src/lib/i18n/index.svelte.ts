import { fr } from './fr';
import { en } from './en';
import type { Translations } from './types';

export type Locale = 'fr' | 'en';

const STORAGE_KEY = 'skilluv-locale';
const translations: Record<Locale, Translations> = { fr, en };

class I18nState {
	// English is the default: it is what SSR renders, so it is what crawlers and
	// first-time visitors see. French remains a first-class locale, reached by
	// browser preference or an explicit choice.
	locale = $state<Locale>('en');

	get direction(): 'ltr' | 'rtl' {
		return 'ltr';
	}

	init() {
		if (typeof window === 'undefined') return;
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'fr' || stored === 'en') {
			this.locale = stored;
		} else {
			// Only a French-speaking browser gets French; everything else, including
			// languages we do not translate, lands on English.
			const browserLang = navigator.language.slice(0, 2).toLowerCase();
			this.locale = browserLang === 'fr' ? 'fr' : 'en';
		}
		this.applyDom();
	}

	setLocale(l: Locale) {
		this.locale = l;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, l);
			this.applyDom();
		}
	}

	private applyDom() {
		if (typeof document === 'undefined') return;
		document.documentElement.lang = this.locale;
		document.documentElement.dir = this.direction;
	}

	/** Traduction avec clé en dot notation. Retourne la clé si non trouvée. */
	t(key: string, params?: Record<string, string | number>): string {
		const msgs = translations[this.locale];
		const parts = key.split('.');
		let val: unknown = msgs;
		for (const p of parts) {
			if (val && typeof val === 'object' && p in val) {
				val = (val as Record<string, unknown>)[p];
			} else {
				return key; // fallback: affiche la clé
			}
		}
		if (typeof val !== 'string') return key;

		// Interpolation simple : {name} → params.name
		if (params) {
			return val.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
		}
		return val;
	}
}

export const i18n = new I18nState();
