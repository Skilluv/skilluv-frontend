import { PROFILE_DOMAINS, type ProfileDomain } from '$lib/types';

/**
 * Where each domain's onboarding wizard sends somebody afterwards.
 *
 * One table rather than a `doneHref` typed at each call site. The wizard is
 * reachable from three kinds of place — a domain hub, the onboarding index,
 * and the legacy per-domain URLs — and each of them passing its own
 * destination is how `/design/onboarding` and `/ai/onboarding` ended up
 * behaving differently from one another for no stated reason.
 *
 * Not every domain has a hub. Where one exists the wizard lands on it; where
 * none does, it lands on the nearest surface that actually lists something to
 * do. The fallback is the challenge catalogue rather than the home page:
 * somebody who has just said what they are here for should land on work, not
 * on marketing.
 */
const DONE_HREF: Record<ProfileDomain, string> = {
	code: '/code',
	// No `/design` hub exists; the brief bank is this domain's equivalent.
	design: '/design/briefs',
	game: '/game',
	security: '/security',
	ops: '/ops',
	ai: '/ai',
	// `soft_skills`, `communication` and `education` have no surface of their
	// own yet. The catalogue is the honest answer until they do.
	soft_skills: '/challenges',
	audio: '/audio/castings',
	quality: '/quality',
	leadership: '/leadership',
	communication: '/challenges',
	education: '/challenges'
};

/** Where the wizard lands once this domain is answered or dismissed. */
export function onboardingDoneHref(domain: ProfileDomain): string {
	return DONE_HREF[domain];
}

/** The wizard's own URL for a domain. */
export function onboardingHref(domain: ProfileDomain): string {
	return `/onboarding/domain/${domain}`;
}

/**
 * Whether a path segment names a domain the wizard can be run for.
 *
 * A type guard rather than a boolean, so the dynamic route can narrow its
 * `params.domain` instead of asserting it. The list mirrors
 * `validators::SKILL_DOMAINS`, which is what the backend guards the same
 * segment against — an unknown one answers 400 there, and 404 here is the
 * closer truth for a page that does not exist.
 */
export function isProfileDomain(value: string): value is ProfileDomain {
	return (PROFILE_DOMAINS as readonly string[]).includes(value);
}
