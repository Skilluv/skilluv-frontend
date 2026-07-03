import type { SkillDomain, Title } from '$lib/types';

/**
 * Classes Tailwind par domaine.
 * Centralise les couleurs pour éviter les redéfinitions dans chaque composant.
 */
export interface DomainStyle {
	/** Couleur du texte (pour pseudos, labels, étoiles…) */
	text: string;
	/** Couleur de fond pleine (pour points/dots, badges pleins) */
	dot: string;
	/** Couleur de fond légère (10 %) pour badges colorés sur fond neutre */
	bgSoft: string;
	/** Bordure au hover pour les cartes */
	hoverBorder: string;
}

export const DOMAIN_STYLES: Record<SkillDomain, DomainStyle> = {
	code: {
		text: 'text-blue-400',
		dot: 'bg-blue-500',
		bgSoft: 'bg-blue-500/10',
		hoverBorder: 'hover:border-blue-500/40'
	},
	design: {
		text: 'text-pink-400',
		dot: 'bg-pink-500',
		bgSoft: 'bg-pink-500/10',
		hoverBorder: 'hover:border-pink-500/40'
	},
	game: {
		text: 'text-green-400',
		dot: 'bg-green-500',
		bgSoft: 'bg-green-500/10',
		hoverBorder: 'hover:border-green-500/40'
	},
	security: {
		text: 'text-red-400',
		dot: 'bg-red-500',
		bgSoft: 'bg-red-500/10',
		hoverBorder: 'hover:border-red-500/40'
	}
};

export function domainStyle(d: SkillDomain): DomainStyle {
	return DOMAIN_STYLES[d];
}

/**
 * Classes Tailwind par titre/rang.
 */
export const TITLE_COLORS: Record<Title, string> = {
	apprenti: 'text-text-muted',
	artisan: 'text-blue-400',
	maitre: 'text-purple-400',
	legende: 'text-amber-400'
};

export function titleColor(t: Title): string {
	return TITLE_COLORS[t];
}
