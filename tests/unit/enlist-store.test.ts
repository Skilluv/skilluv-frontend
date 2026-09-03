import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { enlist, MAX_PATHS } from '../../src/lib/stores/enlist.svelte';
import { DOMAIN_PLATES, domainIndex, domainPlate, isPublicDomain } from '../../src/lib/data/domains';
import { PUBLIC_DOMAINS } from '../../src/lib/utils/domains';

describe('the domain catalogue', () => {
	it('stages every discipline the platform serves, and only those', () => {
		expect(DOMAIN_PLATES.map((c) => c.domain).sort()).toEqual([...PUBLIC_DOMAINS].sort());
	});

	it('never stages the deprecated soft_skills domain', () => {
		// It is kept in the type for historical profiles; enlisting into it would
		// put somebody on a domain that is being split in two.
		expect(DOMAIN_PLATES.some((c) => c.domain === 'soft_skills')).toBe(false);
	});

	it('gives every domain an entry rite', () => {
		for (const plate of DOMAIN_PLATES) {
			expect(plate.rite).toBeTruthy();
		}
	});

	it('falls back rather than throwing on a domain this build has never heard of', () => {
		const plate = domainPlate('quantum-basket-weaving');
		expect(plate.surface).toBe('meta');
		expect(plate.rite).toBeTruthy();
	});

	it('answers -1 for an unknown domain index and null domains', () => {
		expect(domainIndex('nope')).toBe(-1);
		expect(domainIndex(null)).toBe(-1);
		expect(domainIndex('code')).toBe(0);
	});

	it('only recognises real disciplines as public domains', () => {
		expect(isPublicDomain('code')).toBe(true);
		expect(isPublicDomain('soft_skills')).toBe(false);
		expect(isPublicDomain('')).toBe(false);
		expect(isPublicDomain(null)).toBe(false);
		expect(isPublicDomain(undefined)).toBe(false);
	});
});

describe('the enlistment held between screens', () => {
	beforeEach(() => {
		sessionStorage.clear();
		enlist.clear();
		// `restore` is a once-per-tab read; each test starts from a clean one.
		enlist.ready = false;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('starts empty', () => {
		enlist.restore();
		expect(enlist.domain).toBeNull();
		expect(enlist.picks).toEqual([]);
		expect(enlist.hasDomain).toBe(false);
	});

	it('remembers the domain and the trades across a reload of the same tab', () => {
		enlist.restore();
		enlist.chooseDomain('design');
		enlist.togglePath('ui-designer', 'Designer UI');

		// A second instance would read the same storage; simulate it by forcing
		// another restore.
		enlist.ready = false;
		enlist.domain = null;
		enlist.picks = [];
		enlist.restore();

		expect(enlist.domain).toBe('design');
		expect(enlist.picks.map((p) => p.slug)).toEqual(['ui-designer']);
	});

	it('drops the trades when the domain changes', () => {
		enlist.restore();
		enlist.chooseDomain('code');
		enlist.togglePath('dev-frontend', 'Développeur frontend');
		expect(enlist.picks).toHaveLength(1);

		enlist.chooseDomain('audio');
		// A trade belongs to a domain; carrying it over would register somebody
		// for a trade they never saw.
		expect(enlist.picks).toEqual([]);
		expect(enlist.primary).toBe(0);
	});

	it('keeps the trades when the same domain is chosen again', () => {
		enlist.restore();
		enlist.chooseDomain('code');
		enlist.togglePath('dev-frontend', 'Développeur frontend');
		enlist.chooseDomain('code');
		expect(enlist.picks).toHaveLength(1);
	});

	it('refuses a fourth trade, which is the cap the backend enforces', () => {
		enlist.restore();
		enlist.chooseDomain('code');
		expect(enlist.togglePath('a', 'A')).toBe(true);
		expect(enlist.togglePath('b', 'B')).toBe(true);
		expect(enlist.togglePath('c', 'C')).toBe(true);
		expect(enlist.isFull).toBe(true);
		expect(enlist.togglePath('d', 'D')).toBe(false);
		expect(enlist.picks).toHaveLength(MAX_PATHS);
	});

	it('lets a taken trade be given back even when the cap is reached', () => {
		enlist.restore();
		enlist.chooseDomain('code');
		enlist.togglePath('a', 'A');
		enlist.togglePath('b', 'B');
		enlist.togglePath('c', 'C');
		expect(enlist.togglePath('b', 'B')).toBe(true);
		expect(enlist.picks.map((p) => p.slug)).toEqual(['a', 'c']);
	});

	it('reports the position of a trade in the selection', () => {
		enlist.restore();
		enlist.chooseDomain('code');
		enlist.togglePath('a', 'A');
		enlist.togglePath('b', 'B');
		expect(enlist.pickOrder('a')).toBe(1);
		expect(enlist.pickOrder('b')).toBe(2);
		expect(enlist.pickOrder('c')).toBeNull();
	});

	it('pulls the primary back in range when the primary trade is removed', () => {
		enlist.restore();
		enlist.chooseDomain('code');
		enlist.togglePath('a', 'A');
		enlist.togglePath('b', 'B');
		enlist.setPrimary(1);
		expect(enlist.primary).toBe(1);

		enlist.togglePath('b', 'B');
		// One trade left; an index of 1 would send `is_primary` to nobody.
		expect(enlist.primary).toBe(0);
	});

	it('ignores a primary index that names no trade', () => {
		enlist.restore();
		enlist.chooseDomain('code');
		enlist.togglePath('a', 'A');
		enlist.setPrimary(7);
		expect(enlist.primary).toBe(0);
		enlist.setPrimary(-1);
		expect(enlist.primary).toBe(0);
	});

	it('switches a trade between learning and practising', () => {
		enlist.restore();
		enlist.chooseDomain('code');
		enlist.togglePath('a', 'A');
		expect(enlist.picks[0].mode).toBe('learning');
		enlist.setMode('a', 'active');
		expect(enlist.picks[0].mode).toBe('active');
	});

	it('refuses a domain written into storage by hand', () => {
		// Anything in a browser store is user-writable, and this one feeds
		// `skill_domain` on the register call.
		sessionStorage.setItem(
			'skilluv-enlist',
			JSON.stringify({ domain: 'admin', picks: [], primary: 0 })
		);
		enlist.restore();
		expect(enlist.domain).toBeNull();
	});

	it('truncates a selection written into storage beyond the cap', () => {
		sessionStorage.setItem(
			'skilluv-enlist',
			JSON.stringify({
				domain: 'code',
				picks: [
					{ slug: 'a', name: 'A', mode: 'learning' },
					{ slug: 'b', name: 'B', mode: 'learning' },
					{ slug: 'c', name: 'C', mode: 'learning' },
					{ slug: 'd', name: 'D', mode: 'learning' },
					{ slug: 'e', name: 'E', mode: 'learning' }
				],
				primary: 4
			})
		);
		enlist.restore();
		expect(enlist.picks).toHaveLength(MAX_PATHS);
		// The stored primary pointed past what survived truncation.
		expect(enlist.primary).toBe(0);
	});

	it('drops malformed entries rather than passing them to the API', () => {
		sessionStorage.setItem(
			'skilluv-enlist',
			JSON.stringify({ domain: 'code', picks: [{ slug: 42 }, null, { name: 'no slug' }] })
		);
		enlist.restore();
		expect(enlist.picks).toEqual([]);
	});

	it('treats unparseable storage as a fresh start', () => {
		sessionStorage.setItem('skilluv-enlist', 'not json at all');
		enlist.restore();
		expect(enlist.domain).toBeNull();
		expect(enlist.ready).toBe(true);
	});

	it('survives storage being unavailable', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('quota');
		});
		enlist.restore();
		// The enlistment still works for as long as the page lives.
		expect(() => enlist.chooseDomain('code')).not.toThrow();
		expect(enlist.domain).toBe('code');
	});

	it('forgets everything once the account carries it', () => {
		enlist.restore();
		enlist.chooseDomain('code');
		enlist.togglePath('a', 'A');
		enlist.clear();
		expect(enlist.domain).toBeNull();
		expect(enlist.picks).toEqual([]);
		expect(sessionStorage.getItem('skilluv-enlist')).toBeNull();
	});
});
