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
	},
	ai: {
		text: 'text-violet-400',
		dot: 'bg-violet-500',
		bgSoft: 'bg-violet-500/10',
		hoverBorder: 'hover:border-violet-500/40'
	},
	ops: {
		text: 'text-teal-400',
		dot: 'bg-teal-500',
		bgSoft: 'bg-teal-500/10',
		hoverBorder: 'hover:border-teal-500/40'
	},
	quality: {
		text: 'text-cyan-400',
		dot: 'bg-cyan-500',
		bgSoft: 'bg-cyan-500/10',
		hoverBorder: 'hover:border-cyan-500/40'
	},
	leadership: {
		text: 'text-orange-400',
		dot: 'bg-orange-500',
		bgSoft: 'bg-orange-500/10',
		hoverBorder: 'hover:border-orange-500/40'
	},
	audio: {
		text: 'text-fuchsia-400',
		dot: 'bg-fuchsia-500',
		bgSoft: 'bg-fuchsia-500/10',
		hoverBorder: 'hover:border-fuchsia-500/40'
	},
	communication: {
		text: 'text-amber-400',
		dot: 'bg-amber-500',
		bgSoft: 'bg-amber-500/10',
		hoverBorder: 'hover:border-amber-500/40'
	},
	education: {
		text: 'text-lime-400',
		dot: 'bg-lime-500',
		bgSoft: 'bg-lime-500/10',
		hoverBorder: 'hover:border-lime-500/40'
	},
	// Legacy: split into `communication` + `education`, kept for old profiles.
	soft_skills: {
		text: 'text-amber-400',
		dot: 'bg-amber-500',
		bgSoft: 'bg-amber-500/10',
		hoverBorder: 'hover:border-amber-500/40'
	}
};

/**
 * The eleven disciplines, in the order the public pages present them. Excludes
 * the deprecated `soft_skills`, which no page should advertise.
 */
export const PUBLIC_DOMAINS = [
	'code',
	'design',
	'security',
	'game',
	'ai',
	'ops',
	'quality',
	'leadership',
	'audio',
	'communication',
	'education'
] as const satisfies readonly SkillDomain[];

/** Neutral styling for a domain the backend knows and this build does not. */
const UNKNOWN_DOMAIN_STYLE: DomainStyle = {
	text: 'text-text-muted',
	dot: 'bg-text-muted',
	bgSoft: 'bg-surface-overlay',
	hoverBorder: 'hover:border-text-muted'
};

/**
 * Total by design. The catalogue of disciplines lives on the backend and grows
 * there first: `ai`, `ops` and `soft_skills` were already served while this
 * build only knew four domains, and the direct lookup returned `undefined`,
 * so reading `.dot` off it threw and took the whole card down. A discipline we
 * have no colour for must render plainly, not break the page.
 */
export function domainStyle(d: SkillDomain | string | null | undefined): DomainStyle {
	if (!d) return UNKNOWN_DOMAIN_STYLE;
	return DOMAIN_STYLES[d as SkillDomain] ?? UNKNOWN_DOMAIN_STYLE;
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
