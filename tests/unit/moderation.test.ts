import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-07-16' } })
	};
}

function paginated(items: unknown[]) {
	return {
		ok: true,
		status: 200,
		json: () =>
			Promise.resolve({
				data: items,
				pagination: { page: 1, per_page: 50, total: items.length, total_pages: 1 },
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

describe('moderationApi.forum', () => {
	it('moderatePost() POSTs the action + reason', async () => {
		fetchMock.mockResolvedValue(ok({ moderated: true }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.forum.moderatePost('post-9', { action: 'mark_spam', reason: 'clear spam' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/forum/posts/post-9/moderate');
		expect(init.method).toBe('POST');
		const body = JSON.parse(init.body);
		expect(body.action).toBe('mark_spam');
		expect(body.reason).toBe('clear spam');
	});

	it('muteAuthor() sends duration + reason', async () => {
		fetchMock.mockResolvedValue(ok({ user_id: 'u-9', muted_until: '2026-07-17', reason: 'x' }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.forum.muteAuthor('u-9', 72, 'repeat offender');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/forum/users/u-9/mute');
		const body = JSON.parse(init.body);
		expect(body.duration_hours).toBe(72);
		expect(body.reason).toBe('repeat offender');
	});
});

describe('moderationApi.community', () => {
	it('approveChallenge() posts with optional reason', async () => {
		fetchMock.mockResolvedValue(ok({ approved: true }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.community.approveChallenge('c-1', { reason: 'looks good' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/community/challenges/c-1/approve');
		expect(init.method).toBe('POST');
	});

	it('rejectChallenge() requires reason', async () => {
		fetchMock.mockResolvedValue(ok({ rejected: true }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.community.rejectChallenge('c-1', { reason: 'off-topic' });
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.reason).toBe('off-topic');
	});
});

describe('moderationApi.plagiarism', () => {
	it('queue() reads flagged deliverables', async () => {
		fetchMock.mockResolvedValue(paginated([]));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.plagiarism.queue({ page: 1, per_page: 20 });
		expect(fetchMock.mock.calls[0][0]).toBe('/api/fraud/deliverables/flagged?page=1&per_page=20');
	});

	it('markValid() sends reason', async () => {
		fetchMock.mockResolvedValue(ok({ valid: true }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.plagiarism.markValid('d-1', { reason: 'false positive: shared boilerplate' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/fraud/deliverables/d-1/mark-valid');
		const body = JSON.parse(init.body);
		expect(body.reason).toContain('shared boilerplate');
	});

	it('revoke() sends reason', async () => {
		fetchMock.mockResolvedValue(ok({ revoked: true }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.plagiarism.revoke('d-1', { reason: 'confirmed copy of d-2' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/fraud/deliverables/d-1/revoke');
		const body = JSON.parse(init.body);
		expect(body.reason).toContain('confirmed copy');
	});
});

describe('communityApi.pendingReview', () => {
	it('reads /community/challenges/review with pagination', async () => {
		fetchMock.mockResolvedValue(paginated([]));
		const { communityApi } = await import('../../src/lib/api/community');
		await communityApi.pendingReview(2, 25);
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toContain('/api/community/challenges/review');
		expect(url).toContain('page=2');
		expect(url).toContain('per_page=25');
	});
});
