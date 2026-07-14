/**
 * Types partagés du système badges Skilluv.
 * Voir spec complète dans planning-artifacts/ux-designs/*\/.\/working/components-api-spec.md
 */

export type KeyType = 'circle' | 'trefle' | 'rosace' | 'star' | 'heart';

export type SkillCategory =
	| 'craft' // ocre — bâtir
	| 'create' // rouge — inventer
	| 'understand' // bleu — analyser
	| 'operate' // sarcelle — maintenir
	| 'share' // rose ancien — transmettre
	| 'meta'; // safran — transversal

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type RankLevel = 1 | 2 | 3 | 4 | 5;

/** Mapping rang → nom canonique */
export const RANK_NAMES: Record<RankLevel, string> = {
	1: 'Apprenti',
	2: 'Ranger',
	3: 'Artisan',
	4: 'Maître',
	5: 'Doyen'
};

/** Signification symbolique des 5 clés — voir keys-semantics.md */
export const KEY_MEANINGS: Record<KeyType, { fr: string; en: string; label_fr: string; label_en: string }> = {
	circle: { label_fr: 'Preuve', label_en: 'Proof', fr: 'Cycle bouclé, terminé, prouvé', en: 'Cycle closed, finished, proven' },
	trefle: { label_fr: 'Craft', label_en: 'Craft', fr: 'Maîtrise artisanale, constance', en: 'Artisan mastery, consistency' },
	rosace: { label_fr: 'Création', label_en: 'Creation', fr: 'Inventer, proposer, forker', en: 'Invent, propose, fork' },
	star: { label_fr: 'Impact', label_en: 'Impact', fr: 'Ton travail utilisé dans le réel', en: 'Your work used in the real world' },
	heart: { label_fr: 'Entraide', label_en: 'Care', fr: 'Aider un autre — la signature LUV', en: 'Helping others — the LUV signature' }
};

export type BadgeSize = 'sm' | 'md' | 'lg' | 'hero';

export type BadgeFamily = 'patch' | 'chevron' | 'crest' | 'seal' | 'stamp' | 'medal';

/**
 * Objet reçu de l'API — abstract badge.
 * Voir HANDOFF-backend-proof-engine.md pour la source des données.
 */
export interface BadgeData {
	family: BadgeFamily;
	size?: BadgeSize;

	// Champs spécifiques par famille
	skill?: string;
	category?: SkillCategory;
	keyType?: KeyType;
	rarity?: Rarity;
	count?: number;
	subLabel?: string;
	rank?: RankLevel;
	guildName?: string;
	guildKeys?: KeyType[];
	guildColor?: string;
	memberCount?: number;
	challengeId?: string;
	label?: string;
	impact?: boolean;
	eventName?: string;
	eventYear?: number;
	eventColor?: string;
	medalVariant?: string;
	awardedAt?: Date | string;
}
