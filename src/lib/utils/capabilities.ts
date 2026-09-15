import type { Capability, SkillDomain } from '$lib/types';
import { isPublicDomain } from '$lib/data/domains';

/**
 * Reading a capability that carries a discipline.
 *
 * Most capabilities are one flat name. `rite_reviewer:{domain}` is not: it is
 * granted per discipline, automatically, to whoever passed that discipline's
 * own rite, and there are as many of them as there are disciplines.
 *
 * Rendering it needs the two halves apart — the family decides the icon, the
 * colour and the sentence; the discipline is what the sentence is about — while
 * the type stays a closed union so a typo still fails to compile. These two
 * functions are that split, in one place, so no screen has to know the shape of
 * the string.
 */

/** Every capability name with the discipline taken off. */
export type CapabilityFamily =
	| Exclude<Capability, `rite_reviewer:${SkillDomain}`>
	| 'rite_reviewer';

const RITE_REVIEWER = 'rite_reviewer:';

/**
 * The discipline a `rite_reviewer` capability is for, `null` for every other
 * capability.
 *
 * The domain is checked against the catalogue rather than trusted: it arrives
 * from the server inside a string, and a discipline this build has never heard
 * of must not be rendered as if it had.
 */
export function capabilityDomain(capability: Capability): SkillDomain | null {
	if (!capability.startsWith(RITE_REVIEWER)) return null;
	const domain = capability.slice(RITE_REVIEWER.length);
	return isPublicDomain(domain) ? domain : null;
}

/** The family, which is what decides how a capability is drawn and named. */
export function capabilityFamily(capability: Capability): CapabilityFamily {
	return capability.startsWith(RITE_REVIEWER)
		? 'rite_reviewer'
		: (capability as CapabilityFamily);
}
