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
}

/**
 * Ordered as `PUBLIC_DOMAINS` orders them, which is the order the public pages
 * already use. A newcomer who read the landing page meets the classes in the
 * same sequence here.
 */
export const DOMAIN_PLATES: readonly DomainPlate[] = [
	{ domain: 'code', surface: 'craft', art: '' },
	{ domain: 'design', surface: 'create', art: '' },
	{ domain: 'security', surface: 'understand', art: '' },
	{ domain: 'game', surface: 'create', art: '' },
	{ domain: 'ai', surface: 'understand', art: '' },
	{ domain: 'ops', surface: 'operate', art: '' },
	{ domain: 'quality', surface: 'operate', art: '' },
	{ domain: 'leadership', surface: 'meta', art: '' },
	{ domain: 'audio', surface: 'create', art: '' },
	{ domain: 'communication', surface: 'share', art: '' },
	{ domain: 'education', surface: 'share', art: '' }
] as const;

/**
 * Total by design, like `domainStyle`.
 *
 * The catalogue of disciplines grows on the backend first. A domain it serves
 * and this build has never heard of must still be pickable — staged plainly on
 * the neutral surface — rather than crash the enlistment or, worse, be
 * silently missing from it.
 */
export function domainPlate(domain: SkillDomain | string): DomainPlate {
	return (
		DOMAIN_PLATES.find((c) => c.domain === domain) ?? {
			domain: domain as SkillDomain,
			surface: 'meta',
			art: ''
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
