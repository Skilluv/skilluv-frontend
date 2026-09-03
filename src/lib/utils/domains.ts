import type { SkillDomain, Title, Rank } from '$lib/types';

/**
 * Classes Tailwind par domaine.
 * Centralise les couleurs pour éviter les redéfinitions dans chaque composant.
 */
/**
 * The classes that carry a discipline's identity.
 *
 * Every value names a `domain-*` theme token rather than a Tailwind palette
 * shade. The shades these replaced (`text-blue-400` and the rest) were fixed
 * literals chosen against dark backgrounds, so on a light ground they read at
 * about 2:1 where WCAG AA asks 4.5 — and no type or test noticed, because a
 * label with too little contrast renders perfectly. The tokens flip with the
 * theme; see the `--sk-domain-*` block in `app.css`.
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
		text: 'text-domain-code',
		dot: 'bg-domain-code',
		bgSoft: 'bg-domain-code/10',
		hoverBorder: 'hover:border-domain-code/40'
	},
	design: {
		text: 'text-domain-design',
		dot: 'bg-domain-design',
		bgSoft: 'bg-domain-design/10',
		hoverBorder: 'hover:border-domain-design/40'
	},
	game: {
		text: 'text-domain-game',
		dot: 'bg-domain-game',
		bgSoft: 'bg-domain-game/10',
		hoverBorder: 'hover:border-domain-game/40'
	},
	security: {
		text: 'text-domain-security',
		dot: 'bg-domain-security',
		bgSoft: 'bg-domain-security/10',
		hoverBorder: 'hover:border-domain-security/40'
	},
	ai: {
		text: 'text-domain-ai',
		dot: 'bg-domain-ai',
		bgSoft: 'bg-domain-ai/10',
		hoverBorder: 'hover:border-domain-ai/40'
	},
	ops: {
		text: 'text-domain-ops',
		dot: 'bg-domain-ops',
		bgSoft: 'bg-domain-ops/10',
		hoverBorder: 'hover:border-domain-ops/40'
	},
	quality: {
		text: 'text-domain-quality',
		dot: 'bg-domain-quality',
		bgSoft: 'bg-domain-quality/10',
		hoverBorder: 'hover:border-domain-quality/40'
	},
	leadership: {
		text: 'text-domain-leadership',
		dot: 'bg-domain-leadership',
		bgSoft: 'bg-domain-leadership/10',
		hoverBorder: 'hover:border-domain-leadership/40'
	},
	audio: {
		text: 'text-domain-audio',
		dot: 'bg-domain-audio',
		bgSoft: 'bg-domain-audio/10',
		hoverBorder: 'hover:border-domain-audio/40'
	},
	communication: {
		text: 'text-domain-communication',
		dot: 'bg-domain-communication',
		bgSoft: 'bg-domain-communication/10',
		hoverBorder: 'hover:border-domain-communication/40'
	},
	education: {
		text: 'text-domain-education',
		dot: 'bg-domain-education',
		bgSoft: 'bg-domain-education/10',
		hoverBorder: 'hover:border-domain-education/40'
	},
	// Legacy: split into `communication` + `education`, kept for old profiles.
	soft_skills: {
		text: 'text-domain-communication',
		dot: 'bg-domain-communication',
		bgSoft: 'bg-domain-communication/10',
		hoverBorder: 'hover:border-domain-communication/40'
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
	artisan: 'text-rank-artisan',
	maitre: 'text-rank-maitre',
	legende: 'text-rank-doyen'
};

export function titleColor(t: Title): string {
	return TITLE_COLORS[t];
}

/**
 * Classes Tailwind par rang canonique (Rank, 5 paliers Apprenti -> Doyen).
 *
 * TITLE_COLORS ne couvre que l'ancien type Title deprecie, qui ignore `ranger`
 * et `doyen` et porte un `legende` qui n'existe plus.
 */
export const RANK_COLORS: Record<Rank, string> = {
	apprenti: 'text-text-muted',
	ranger: 'text-rank-ranger',
	artisan: 'text-rank-artisan',
	maitre: 'text-rank-maitre',
	doyen: 'text-rank-doyen'
};

/**
 * Total, comme domainStyle : le backend renvoie encore `legende` sur les
 * profils historiques, et un rang inconnu ne doit pas casser une ligne de
 * classement pour une question de couleur.
 */
export function rankColor(r: Rank | Title | string | null | undefined): string {
	if (!r) return 'text-text-muted';
	if (r === 'legende') return 'text-rank-doyen';
	return RANK_COLORS[r as Rank] ?? 'text-text-muted';
}
