import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * What the header must reach.
 *
 * These pages were finished, tested and linked from nowhere: the whole Skilluv
 * Cyber vertical, four discipline landings, the wallet. They were reachable
 * only by typing a URL, and nothing in the type system or the test suite
 * noticed, because an unlinked page renders perfectly.
 *
 * The assertion is deliberately made against the source of the navigation
 * rather than a rendered page: mounting the navbar would require a session, a
 * locale and a router, and would still only prove one of the two states. What
 * has to hold is that the destination appears in the data both states are
 * built from.
 */
const NAVBAR = readFileSync('src/lib/components/layout/Navbar.svelte', 'utf-8');

/** Destinations that must stay one click away, and why they were missing. */
const MUST_BE_LINKED = [
	// The cyber vertical: Design and AI each had a section here, this had none.
	'/security',
	'/security/missions',
	'/security/competitions',
	'/security/hall-of-fame',
	'/ctf',
	'/blue-lab',
	'/trust',
	// Discipline landings with no entry and no inbound link anywhere.
	'/code',
	'/game',
	'/ops',
	'/quality',
	'/leadership',
	'/audio/castings',
	'/tracks',
	// Money, and where money is contested.
	'/wallet',
	'/disputes'
];

describe('the header reaches every finished surface', () => {
	for (const href of MUST_BE_LINKED) {
		it(`links ${href}`, () => {
			expect(NAVBAR).toContain(`'${href}'`);
		});
	}
});

describe('the burger is derived, not retyped', () => {
	/**
	 * The mobile menu used to be a second catalogue maintained by hand, and it
	 * had already drifted from the dropdowns. Deriving it is what makes the
	 * list above true at every width; a hand-written array here would pass the
	 * assertions above while a phone still reached none of it.
	 */
	it('builds its links from the same groups the dropdowns render', () => {
		expect(NAVBAR).toContain('let mobileLinks = $derived(');
		expect(NAVBAR).toContain('...talentGrowGroups');
		expect(NAVBAR).toContain('...discoverGroups');
		expect(NAVBAR).toContain('{#each mobileLinks as link');
	});

	it('has no second hand-written link list left behind', () => {
		// One `{#each [` of literal hrefs inside the mobile panel is exactly how
		// the drift started. There should be none.
		const mobilePanel = NAVBAR.slice(NAVBAR.indexOf('<!-- Mobile menu -->'));
		expect(mobilePanel).not.toContain("{#each [");
	});
});

describe('no destination is offered twice in one panel', () => {
	/**
	 * `/enterprise/register` sat in both the Sourcing and the Business group of
	 * the same dropdown, under two different labels and with a badge on one of
	 * them — while the page itself reads no query parameter, so both were the
	 * identical page with identical behaviour. Two names for one action, ten
	 * lines apart and visible at once, read as two different things.
	 *
	 * Repeating an href across two *different* menus is fine and deliberate:
	 * `/bounties` is in both the signed-out and the signed-in menu, and nobody
	 * ever sees those together. The rule is one panel, one entry.
	 */
	it('lists the enterprise sign-up exactly once', () => {
		const anon = NAVBAR.slice(
			NAVBAR.indexOf('let enterpriseGroupsAnon'),
			NAVBAR.indexOf('let enterpriseGroupsAuth')
		);
		const hrefs = [...anon.matchAll(/href: '(\/[^']*)'/g)].map((m) => m[1]);
		const registers = hrefs.filter((h) => h === '/enterprise/register');
		expect(registers).toHaveLength(1);
	});

	it('repeats no other href inside that panel either', () => {
		const anon = NAVBAR.slice(
			NAVBAR.indexOf('let enterpriseGroupsAnon'),
			NAVBAR.indexOf('let enterpriseGroupsAuth')
		);
		const hrefs = [...anon.matchAll(/href: '(\/[^']*)'/g)].map((m) => m[1]);
		expect(hrefs).toHaveLength(new Set(hrefs).size);
	});
});
