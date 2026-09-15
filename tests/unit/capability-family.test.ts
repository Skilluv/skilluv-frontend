import { describe, it, expect } from 'vitest';
import { capabilityFamily, capabilityDomain } from '../../src/lib/utils/capabilities';
import type { Capability } from '../../src/lib/types';

/**
 * Reading a capability that carries a discipline.
 *
 * `rite_reviewer:{domain}` is granted automatically to whoever passes their own
 * trade's rite, one per discipline. It exists to break a circle: settling a
 * rite needed `admin`, `mentor` or `domain_curator`, and the only automatic one
 * of those needed validated work, which needed one of the same three. The queue
 * had a single hand-promoted account at the end of it, for every discipline.
 *
 * The frontend's `Capability` union is a hand-maintained mirror with no
 * catalogue endpoint to check against, so the parsing is worth pinning: a name
 * this build cannot read must degrade to something honest rather than render a
 * slug at somebody.
 */

describe('reading a capability', () => {
	it('splits the discipline off a rite reviewer', () => {
		expect(capabilityFamily('rite_reviewer:design')).toBe('rite_reviewer');
		expect(capabilityDomain('rite_reviewer:design')).toBe('design');
	});

	it('leaves a flat capability alone', () => {
		expect(capabilityFamily('admin')).toBe('admin');
		// Null, not an empty string: "this one names no discipline" and "this
		// one names an unreadable discipline" are different, and only the first
		// should render as an ordinary badge.
		expect(capabilityDomain('admin')).toBeNull();
	});

	it('refuses a discipline this build has never heard of', () => {
		// The domain arrives inside a string from a server that ships its own
		// disciplines. Trusting it would put a raw slug in front of a reader,
		// where every other domain shows a translated name.
		const unknown = 'rite_reviewer:quantum' as Capability;
		expect(capabilityFamily(unknown)).toBe('rite_reviewer');
		expect(capabilityDomain(unknown)).toBeNull();
	});

	it('is not fooled by a name that merely starts the same way', () => {
		const lookalike = 'rite_reviewership' as Capability;
		expect(capabilityDomain(lookalike)).toBeNull();
	});

	it('covers every discipline, without a row per discipline', () => {
		// The whole reason the type is a template rather than twelve members:
		// a new discipline must not need a code change here.
		for (const domain of ['code', 'design', 'game', 'security', 'ai', 'ops'] as const) {
			expect(capabilityDomain(`rite_reviewer:${domain}`)).toBe(domain);
		}
	});
});
