import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rankFromTitle, type Title } from '../../src/lib/types';
import { hasCapability } from '../../src/lib/api/capabilities';

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-07-15' } })
	};
}

function paginated(items: unknown[]) {
	return {
		ok: true,
		status: 200,
		json: () =>
			Promise.resolve({
				data: items,
				pagination: { page: 1, per_page: 20, total: items.length, total_pages: 1 },
				meta: { request_id: 'r', timestamp: '2026-07-15' }
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

// --- P16 orientations ---

describe('orientationsApi', () => {
	it('list() calls GET /api/orientations', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { orientationsApi } = await import('../../src/lib/api/orientations');
		await orientationsApi.list();
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/orientations',
			expect.objectContaining({ credentials: 'include' })
		);
	});

	it('register() POSTs with proper payload', async () => {
		fetchMock.mockResolvedValue(ok({ orientation_slug: 'dev-frontend' }));
		const { orientationsApi } = await import('../../src/lib/api/orientations');
		await orientationsApi.register({
			orientation_slug: 'dev-frontend',
			mode: 'learning',
			is_primary: true,
			working_languages: ['fr']
		});
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/users/me/orientations',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('dev-frontend')
			})
		);
	});

	it('patch() PATCHs the right path', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { orientationsApi } = await import('../../src/lib/api/orientations');
		await orientationsApi.patch('dev-frontend', { mode: 'active' });
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/users/me/orientations/dev-frontend',
			expect.objectContaining({ method: 'PATCH' })
		);
	});

	it('playlist() targets the correct nested route', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { orientationsApi } = await import('../../src/lib/api/orientations');
		await orientationsApi.playlist('dev-frontend');
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/users/me/orientations/dev-frontend/playlist',
			expect.anything()
		);
	});

	it('forUser() reads a public projection', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { orientationsApi } = await import('../../src/lib/api/orientations');
		await orientationsApi.forUser('user-42');
		expect(fetchMock).toHaveBeenCalledWith('/api/users/user-42/orientations', expect.anything());
	});
});

// --- P18.4 capabilities ---

describe('capabilitiesApi', () => {
	it('myCapabilities() calls the me endpoint', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { capabilitiesApi } = await import('../../src/lib/api/capabilities');
		await capabilitiesApi.myCapabilities();
		expect(fetchMock).toHaveBeenCalledWith('/api/users/me/capabilities', expect.anything());
	});

	it('forUser() targets public user capabilities', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { capabilitiesApi } = await import('../../src/lib/api/capabilities');
		await capabilitiesApi.forUser('user-9');
		expect(fetchMock).toHaveBeenCalledWith('/api/users/user-9/capabilities', expect.anything());
	});
});

describe('hasCapability', () => {
	it('returns false on undefined / empty', () => {
		expect(hasCapability(undefined, 'mentor')).toBe(false);
		expect(hasCapability([], 'mentor')).toBe(false);
	});

	it('accepts a string array', () => {
		expect(hasCapability(['mentor', 'admin'], 'mentor')).toBe(true);
		expect(hasCapability(['challenger'], 'mentor')).toBe(false);
	});

	it('ignores expired records', () => {
		const past = new Date(Date.now() - 1000).toISOString();
		expect(
			hasCapability(
				[{ capability: 'mentor', granted_at: '2026-01-01', granted_reason: 'x', expires_at: past }],
				'mentor'
			)
		).toBe(false);
	});

	it('accepts non-expired records', () => {
		const future = new Date(Date.now() + 60_000).toISOString();
		expect(
			hasCapability(
				[
					{
						capability: 'mentor',
						granted_at: '2026-01-01',
						granted_reason: 'x',
						expires_at: future
					}
				],
				'mentor'
			)
		).toBe(true);
	});

	it('accepts perpetual (no expiry) records', () => {
		expect(
			hasCapability(
				[{ capability: 'forum_moderator', granted_at: '2026-01-01', granted_reason: 'x' }],
				'forum_moderator'
			)
		).toBe(true);
	});
});

// --- P17 badges ---

describe('badgesApi', () => {
	it('forUser() targets /users/{id}/badges', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { badgesApi } = await import('../../src/lib/api/badges');
		await badgesApi.forUser('user-7');
		expect(fetchMock).toHaveBeenCalledWith('/api/users/user-7/badges', expect.anything());
	});

	it('catalog() targets /badge-rules', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { badgesApi } = await import('../../src/lib/api/badges');
		await badgesApi.catalog();
		expect(fetchMock).toHaveBeenCalledWith('/api/badge-rules', expect.anything());
	});
});

// --- P13 wallet ---

describe('walletApi', () => {
	it('history() serializes pagination params', async () => {
		fetchMock.mockResolvedValue(paginated([]));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.history({ page: 2, per_page: 50 });
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/talent/wallet/history?page=2&per_page=50',
			expect.anything()
		);
	});

	it('requestPayout() POSTs stripe method', async () => {
		fetchMock.mockResolvedValue(ok({ id: 'p1', status: 'pending' }));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.requestPayout({ method: 'stripe', amount_fragments: 1000 });
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/talent/wallet/payouts',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('"method":"stripe"')
			})
		);
	});

	it('requestPayout() POSTs mobile_money method with provider', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { walletApi } = await import('../../src/lib/api/wallet');
		await walletApi.requestPayout({
			method: 'mobile_money',
			amount_fragments: 500,
			momo_provider: 'mtn',
			momo_number: '+22990000000'
		});
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/talent/wallet/payouts',
			expect.objectContaining({
				body: expect.stringContaining('"momo_provider":"mtn"')
			})
		);
	});
});

// --- P10 + P15.3 team marketplace ---

describe('teamMarketplaceApi', () => {
	it('marketplace() serializes filters', async () => {
		fetchMock.mockResolvedValue(paginated([]));
		const { teamMarketplaceApi } = await import('../../src/lib/api/team_marketplace');
		await teamMarketplaceApi.marketplace({ role_slug: 'backend', min_difficulty: 3 });
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/teams/marketplace?role_slug=backend&min_difficulty=3',
			expect.anything()
		);
	});

	it('fillSlot() posts to nested slot fill route', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { teamMarketplaceApi } = await import('../../src/lib/api/team_marketplace');
		await teamMarketplaceApi.fillSlot('team-1', 'slot-a');
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/teams/team-1/slots/slot-a/fill',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('leaveSlot() posts to nested slot leave route', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { teamMarketplaceApi } = await import('../../src/lib/api/team_marketplace');
		await teamMarketplaceApi.leaveSlot('team-1', 'slot-a');
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/teams/team-1/slots/slot-a/leave',
			expect.objectContaining({ method: 'POST' })
		);
	});
});

// --- P24 agency clients + enterprise types ---

describe('agencyClientsApi', () => {
	it('list() reads under /enterprises/me', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { agencyClientsApi } = await import('../../src/lib/api/agency_clients');
		await agencyClientsApi.list();
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/enterprises/me/agency-clients',
			expect.anything()
		);
	});

	it('create() sends the payload', async () => {
		fetchMock.mockResolvedValue(ok({ id: 'c1' }));
		const { agencyClientsApi } = await import('../../src/lib/api/agency_clients');
		await agencyClientsApi.create({ client_name: 'Acme' });
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/enterprises/me/agency-clients',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('Acme')
			})
		);
	});
});

describe('enterpriseTypesApi', () => {
	it('get() reads the type-config endpoint', async () => {
		fetchMock.mockResolvedValue(ok({ enterprise_type: 'direct_hire', type_config: {} }));
		const { enterpriseTypesApi } = await import('../../src/lib/api/enterprise_types');
		await enterpriseTypesApi.get();
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/enterprises/me/type-config',
			expect.anything()
		);
	});

	it('patch() sends staffing agency config', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { enterpriseTypesApi } = await import('../../src/lib/api/enterprise_types');
		await enterpriseTypesApi.patch({
			enterprise_type: 'staffing_agency',
			type_config: { commission_rate: 0.15 }
		});
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/enterprises/me/type-config',
			expect.objectContaining({
				method: 'PATCH',
				body: expect.stringContaining('commission_rate')
			})
		);
	});
});

// --- P17.6 badge events ---

describe('badgeEventsApi', () => {
	it('list() reads /badge-events', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { badgeEventsApi } = await import('../../src/lib/api/badge_events');
		await badgeEventsApi.list();
		expect(fetchMock).toHaveBeenCalledWith('/api/badge-events', expect.anything());
	});

	it('join() posts to the slug join route', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { badgeEventsApi } = await import('../../src/lib/api/badge_events');
		await badgeEventsApi.join('skilluv-fest-2026');
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/badge-events/skilluv-fest-2026/join',
			expect.objectContaining({ method: 'POST' })
		);
	});
});

// --- P25 moderation ---

describe('moderationApi', () => {
	it('forum.moderatePost() posts a delete action', async () => {
		fetchMock.mockResolvedValue(ok({ moderated: true }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.forum.moderatePost('post-1', { action: 'delete', reason: 'spam' });
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/forum/posts/post-1/moderate',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('"action":"delete"')
			})
		);
	});

	it('community.approveChallenge() posts empty body by default', async () => {
		fetchMock.mockResolvedValue(ok({ approved: true }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.community.approveChallenge('ch-1');
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/community/challenges/ch-1/approve',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('community.rejectChallenge() requires a reason', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.community.rejectChallenge('ch-1', { reason: 'off-topic' });
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/community/challenges/ch-1/reject',
			expect.objectContaining({ body: expect.stringContaining('off-topic') })
		);
	});

	it('plagiarism.queue() reads the flagged deliverables queue', async () => {
		fetchMock.mockResolvedValue(paginated([]));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.plagiarism.queue({ page: 1 });
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/fraud/deliverables/flagged?page=1',
			expect.anything()
		);
	});

	it('plagiarism.markValid() posts with reason', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.plagiarism.markValid('d-1', { reason: 'false positive' });
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/fraud/deliverables/d-1/mark-valid',
			expect.objectContaining({ body: expect.stringContaining('false positive') })
		);
	});

	it('plagiarism.revoke() posts with reason', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.plagiarism.revoke('d-1', { reason: 'confirmed copy' });
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/fraud/deliverables/d-1/revoke',
			expect.objectContaining({ body: expect.stringContaining('confirmed copy') })
		);
	});
});

// --- Migration Title -> Rank ---

describe('rankFromTitle', () => {
	const cases: Array<[Title, string]> = [
		['apprenti', 'apprenti'],
		['artisan', 'artisan'],
		['maitre', 'maitre'],
		['legende', 'doyen']
	];
	for (const [input, expected] of cases) {
		it(`maps ${input} -> ${expected}`, () => {
			expect(rankFromTitle(input)).toBe(expected);
		});
	}
});
