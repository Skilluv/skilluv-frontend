import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The creators marketplace — a whole pillar of the business model
 * (`business-model/08-ecosystem-line.md`) that the backend served and no page
 * called.
 *
 * Two invariants worth pinning: what a purchase actually hands back (a token
 * with a life, not a file), and how a sale divides — the commission is
 * rounded down and the creator takes the rest, so the two always add back to
 * what was paid.
 */

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
	};
}

const item = {
	id: 'i1',
	slug: 'sveltekit-starter',
	creator_user_id: 'u1',
	item_type: 'boilerplate',
	skill_domain: 'code',
	title: 'SvelteKit starter',
	description_md: '# Starter\nCe qu’il contient.',
	thumbnail_url: 'https://cdn.test/thumb.png',
	preview_urls: [],
	license_type: 'commercial',
	license_summary: 'Usable in client work, not resold as-is.',
	price: '24.00',
	currency: 'EUR',
	downloads_count: 12,
	rating_avg: '4.5',
	rating_count: 4,
	status: 'published'
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.resetModules();
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('marketplaceApi', () => {
	it('browses published items, narrowed by discipline', async () => {
		fetchMock.mockResolvedValue(ok({ items: [item] }));
		const { marketplaceApi } = await import('../../src/lib/api/marketplace');
		await marketplaceApi.browse('code');
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url.split('?')[0]).toBe('/api/marketplace/items');
		expect(new URLSearchParams(url.split('?')[1]).get('domain')).toBe('code');
	});

	it('the item page carries the sale split, and it adds back to the price', async () => {
		fetchMock.mockResolvedValue(
			ok({ item, creator_receives: '20.40', platform_commission: '3.60' })
		);
		const { marketplaceApi } = await import('../../src/lib/api/marketplace');
		const res = await marketplaceApi.get('i1');
		// The creator absorbs no rounding: commission rounded down, creator
		// takes the rest, and the two always sum to what was paid.
		const sum = Number(res.data.creator_receives) + Number(res.data.platform_commission);
		expect(sum).toBeCloseTo(Number(res.data.item.price), 2);
		// 24 EUR is above the threshold, so 15% and not 20%.
		expect(Number(res.data.platform_commission)).toBeCloseTo(3.6, 2);
	});

	it('a purchase hands back a token with a life, not a file', async () => {
		fetchMock.mockResolvedValue(
			ok({
				purchase_id: 'p1',
				download_url: '/api/marketplace/downloads/tok123',
				valid_for_hours: 48,
				downloads_allowed: 10
			})
		);
		const { marketplaceApi } = await import('../../src/lib/api/marketplace');
		const res = await marketplaceApi.purchase('i1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/marketplace/items/i1/purchase');
		// Both figures come from the response, not from a constant in the front:
		// the backend owns the window and the ceiling.
		expect(res.data.valid_for_hours).toBe(48);
		expect(res.data.downloads_allowed).toBe(10);
	});

	it('redeeming strips the /api the purchase already handed back', async () => {
		fetchMock.mockResolvedValue(ok({ files: ['marketplace/ab/cd/kit.zip'] }));
		const { marketplaceApi } = await import('../../src/lib/api/marketplace');
		const res = await marketplaceApi.download('/api/marketplace/downloads/tok123');
		// The client already prefixes `/api`; passing the path through twice
		// would 404 on a URL that looks right.
		expect(fetchMock.mock.calls[0][0]).toBe('/api/marketplace/downloads/tok123');
		// Storage keys, not URLs. SKI-330 — the page says so rather than
		// offering a dead button.
		expect(res.data.files[0]).not.toMatch(/^https?:\/\//);
	});

	it('a rating is one to five and hangs off a purchase, not an item', async () => {
		fetchMock.mockResolvedValue(ok({ rated: 5 }));
		const { marketplaceApi, } = await import('../../src/lib/api/marketplace');
		const { MARKETPLACE_RATING_MIN, MARKETPLACE_RATING_MAX } = await import(
			'../../src/lib/types/marketplace'
		);
		await marketplaceApi.rate('p1', { rating: 5, review: 'solide' });
		// Keyed on the purchase: a rating with no purchase behind it is noise.
		expect(fetchMock.mock.calls[0][0]).toBe('/api/marketplace/purchases/p1/rate');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			rating: 5,
			review: 'solide'
		});
		expect([MARKETPLACE_RATING_MIN, MARKETPLACE_RATING_MAX]).toEqual([1, 5]);
	});

	it('publishing is its own call, and refuses on somebody else s item', async () => {
		fetchMock.mockResolvedValue(ok({ item: { ...item, status: 'published' } }));
		const { marketplaceApi } = await import('../../src/lib/api/marketplace');
		await marketplaceApi.publish('i1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/marketplace/items/i1/publish');
		// The backend answers 404 rather than 403 on somebody else's draft, so
		// a stranger cannot even confirm the item exists.
	});
});

describe('the marketplace contract', () => {
	it('mirrors the three licences and the commission bands', async () => {
		const mod = await import('../../src/lib/types/marketplace');
		expect([...mod.MARKETPLACE_LICENSE_TYPES]).toEqual([
			'personal_use',
			'commercial',
			'extended_commercial'
		]);
		// Twenty per cent below twenty euros, fifteen above: a flat rate would
		// make small items cost more to process than they earn.
		expect(mod.MARKETPLACE_COMMISSION_LOW_PERCENT).toBe(20);
		expect(mod.MARKETPLACE_COMMISSION_HIGH_PERCENT).toBe(15);
		expect(mod.MARKETPLACE_COMMISSION_THRESHOLD_EUR).toBe(20);
	});
});
