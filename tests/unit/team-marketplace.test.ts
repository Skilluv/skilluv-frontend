import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-07-16' } })
	};
}

function paginated(items: unknown[], totalPages = 1) {
	return {
		ok: true,
		status: 200,
		json: () =>
			Promise.resolve({
				data: items,
				pagination: { page: 1, per_page: 20, total: items.length, total_pages: totalPages },
				meta: { request_id: 'r', timestamp: '2026-07-16' }
			})
	};
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.resetModules();
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('teamMarketplaceApi filters serialization', () => {
	it('sends all filters when provided', async () => {
		fetchMock.mockResolvedValue(paginated([]));
		const { teamMarketplaceApi } = await import('../../src/lib/api/team_marketplace');
		await teamMarketplaceApi.marketplace({
			role_slug: 'backend',
			skill_slug: 'rust',
			min_difficulty: 2,
			max_difficulty: 4,
			page: 3,
			per_page: 20
		});
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toContain('role_slug=backend');
		expect(url).toContain('skill_slug=rust');
		expect(url).toContain('min_difficulty=2');
		expect(url).toContain('max_difficulty=4');
		expect(url).toContain('page=3');
	});

	it('omits undefined filters', async () => {
		fetchMock.mockResolvedValue(paginated([]));
		const { teamMarketplaceApi } = await import('../../src/lib/api/team_marketplace');
		await teamMarketplaceApi.marketplace({ page: 1, per_page: 10 });
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).not.toContain('role_slug');
		expect(url).not.toContain('skill_slug');
		expect(url).toContain('page=1');
	});
});

describe('teamMarketplaceApi slot lifecycle', () => {
	it('teamSlots + fillSlot + leaveSlot target the right routes', async () => {
		fetchMock
			.mockResolvedValueOnce(ok([{ slot_id: 's1', role_slug: 'backend', min_proficiency_level: 1, created_at: '2026-01-01' }]))
			.mockResolvedValueOnce(ok({ slot_id: 's1', filled_by: 'u1' }))
			.mockResolvedValueOnce(ok({ slot_id: 's1', filled_by: null }));

		const { teamMarketplaceApi } = await import('../../src/lib/api/team_marketplace');
		await teamMarketplaceApi.teamSlots('t1');
		await teamMarketplaceApi.fillSlot('t1', 's1');
		await teamMarketplaceApi.leaveSlot('t1', 's1');

		expect(fetchMock.mock.calls[0][0]).toBe('/api/teams/t1/slots');
		expect(fetchMock.mock.calls[1][0]).toBe('/api/teams/t1/slots/s1/fill');
		expect(fetchMock.mock.calls[1][1].method).toBe('POST');
		expect(fetchMock.mock.calls[2][0]).toBe('/api/teams/t1/slots/s1/leave');
		expect(fetchMock.mock.calls[2][1].method).toBe('POST');
	});

	it('createSlot POSTs the slot body', async () => {
		fetchMock.mockResolvedValue(ok({ slot_id: 's-new' }));
		const { teamMarketplaceApi } = await import('../../src/lib/api/team_marketplace');
		await teamMarketplaceApi.createSlot('t1', {
			role_slug: 'frontend',
			role_display_name: 'Frontend engineer',
			min_proficiency_level: 3,
			required_skill_slug: 'svelte'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/teams/t1/slots');
		expect(init.method).toBe('POST');
		const body = JSON.parse(init.body);
		expect(body.role_slug).toBe('frontend');
		expect(body.min_proficiency_level).toBe(3);
	});
});
