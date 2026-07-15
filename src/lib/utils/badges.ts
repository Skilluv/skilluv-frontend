import type { Rank, RankLevel, SkillCategory, KeyType } from '$lib/types';

/** Ordre canonique des catégories skill patch, aligné sur la spec BMAD. */
export const PATCH_CATEGORIES: readonly SkillCategory[] = [
	'craft',
	'create',
	'understand',
	'operate',
	'share',
	'meta'
] as const;

/** Ordre canonique des types de clés (rendus dans SkillPatch). */
export const PATCH_KEY_TYPES: readonly KeyType[] = [
	'circle',
	'trefle',
	'rosace',
	'star',
	'heart'
] as const;

/** Mapping bijection Rank (nom canonique) → RankLevel (1..5) pour les chevrons. */
export const RANK_TO_LEVEL: Record<Rank, RankLevel> = {
	apprenti: 1,
	ranger: 2,
	artisan: 3,
	maitre: 4,
	doyen: 5
};

/** Hash stable et déterministe d'un slug — utilisé pour dériver une catégorie
 * visuelle par patch quand le backend n'a pas encore enrichi le BadgeItem
 * avec un `category` explicite. */
export function hashSlug(slug: string): number {
	let h = 0;
	for (let i = 0; i < slug.length; i++) {
		h = (h * 31 + slug.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

/** Dérive une paire {category, keyType} déterministe pour un skill patch. */
export function derivePatchVisual(index: number, slug: string | undefined) {
	const key = slug ? hashSlug(slug) : index;
	return {
		category: PATCH_CATEGORIES[key % PATCH_CATEGORIES.length],
		keyType: PATCH_KEY_TYPES[key % PATCH_KEY_TYPES.length]
	};
}
