import type { SkillDomain } from '$lib/types';
import { PUBLIC_DOMAINS } from '$lib/utils/domains';

/**
 * The eleven domains, as the enlistment presents them.
 *
 * This is the fresco's data, not the domain catalogue: `PUBLIC_DOMAINS` stays
 * the single list of disciplines and this file only says how each one is
 * *staged* — which categorical surface carries it, where its artwork lives,
 * and which first act it asks for.
 *
 * Nothing here duplicates a label or a description. Those are already in
 * `disciplines.{domain}.label` / `.desc`, shared with the public pages, so a
 * discipline reads the same on the landing page and on the day somebody picks
 * it.
 *
 * The number of tracks is deliberately absent. It lives in the database, it
 * grows there, and a number written here would be wrong the week the next
 * orientation ships — so the fresco asks the API for it and shows nothing
 * rather than a stale count. See SKI-364.
 */

/**
 * The shape of a domain's first act.
 *
 * Front-side contract, and knowingly so: the backend models the entry rite as
 * a GitHub fork and nothing else (`onboarding_bonjour_skilluv`), which is why
 * ten of the eleven domains have no first act to reach today. SKI-362 gives
 * the endpoint a shape per domain; until it lands, this enum is what the
 * screens read, and swapping the source afterwards touches this file alone.
 */
export type RiteKind =
	/** Fork the starter, edit HELLO.md, open the pull request. */
	| 'fork'
	/** Hand in a screen against a short brief. */
	| 'upload'
	/** Play a slice and return a playtest verdict. */
	| 'playtest'
	/** Read the public scope, report one finding. */
	| 'disclosure'
	/** Read a service objective, propose one improvement. */
	| 'proposal'
	/** File one defect report. */
	| 'defect'
	/** Run one step of a mission workspace. */
	| 'workspace'
	/** Twenty seconds of signature sound, sources declared. */
	| 'render'
	/** Translate one paragraph of a guide. */
	| 'translation'
	/** Explain one skill node in three beats. */
	| 'explainer'
	/** Write a retrospective on a public incident. */
	| 'retro';

export interface DomainPlate {
	domain: SkillDomain;
	/**
	 * Which categorical surface stages this domain — one of the six the design
	 * system defines (`--sk-surface-craft` and friends). Eleven domains share
	 * six surfaces on purpose: the surfaces group crafts by what they *do*
	 * (make, understand, operate, share), and two domains on the same ground
	 * should feel related.
	 */
	surface: 'craft' | 'create' | 'understand' | 'operate' | 'share' | 'meta';
	/**
	 * Artwork for the fresco.
	 *
	 * Empty for every domain today, and the plates are built to hold without
	 * it: light, type and grain carry the composition on their own and the
	 * image deepens it. Empty rather than a path that 404s — eleven broken
	 * requests per visit is a worse placeholder than none.
	 *
	 * When the artwork lands, drop the files in `static/classes/` and fill
	 * these in: `/classes/{domain}.webp`, 3:2 landscape, dark-ground, with the
	 * left third kept quiet for the name to sit on.
	 */
	art: string;
	rite: RiteKind;
}

/**
 * Ordered as `PUBLIC_DOMAINS` orders them, which is the order the public pages
 * already use. A newcomer who read the landing page meets the classes in the
 * same sequence here.
 */
export const DOMAIN_PLATES: readonly DomainPlate[] = [
	{ domain: 'code', surface: 'craft', art: '', rite: 'fork' },
	{ domain: 'design', surface: 'create', art: '', rite: 'upload' },
	{ domain: 'security', surface: 'understand', art: '', rite: 'disclosure' },
	{ domain: 'game', surface: 'create', art: '', rite: 'playtest' },
	{ domain: 'ai', surface: 'understand', art: '', rite: 'workspace' },
	{ domain: 'ops', surface: 'operate', art: '', rite: 'proposal' },
	{ domain: 'quality', surface: 'operate', art: '', rite: 'defect' },
	{ domain: 'leadership', surface: 'meta', art: '', rite: 'retro' },
	{ domain: 'audio', surface: 'create', art: '', rite: 'render' },
	{
		domain: 'communication',
		surface: 'share',
		art: '',
		rite: 'translation'
	},
	{ domain: 'education', surface: 'share', art: '', rite: 'explainer' }
] as const;

/**
 * Total by design, like `domainStyle`.
 *
 * The catalogue of disciplines grows on the backend first. A domain it serves
 * and this build has never heard of must still be pickable — staged plainly on
 * the neutral surface, asking for the one first act every domain can perform —
 * rather than crash the enlistment or, worse, be silently missing from it.
 */
export function domainPlate(domain: SkillDomain | string): DomainPlate {
	return (
		DOMAIN_PLATES.find((c) => c.domain === domain) ?? {
			domain: domain as SkillDomain,
			surface: 'meta',
			art: '',
			rite: 'upload'
		}
	);
}

/** Index of a domain in the fresco, or `-1`. Used to seed and clamp navigation. */
export function domainIndex(domain: SkillDomain | string | null): number {
	if (!domain) return -1;
	return DOMAIN_PLATES.findIndex((c) => c.domain === domain);
}

/**
 * A guard the fresco needs and `PUBLIC_DOMAINS` cannot give on its own: a slug
 * read off the URL is a string until something proves otherwise.
 */
export function isPublicDomain(value: string | null | undefined): value is SkillDomain {
	if (!value) return false;
	return (PUBLIC_DOMAINS as readonly string[]).includes(value);
}
