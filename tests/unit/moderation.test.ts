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
	it('moderatePost() POSTs the hide action with reason', async () => {
		fetchMock.mockResolvedValue(ok({ moderated: true, id: 'post-9', action: 'hide' }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.forum.moderatePost('post-9', {
			action: 'hide',
			reason: 'spam content'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/forum/posts/post-9/moderate');
		expect(init.method).toBe('POST');
		const body = JSON.parse(init.body);
		expect(body.action).toBe('hide');
		expect(body.reason).toBe('spam content');
	});

	it('moderatePost() supports lock / unlock / unhide actions', async () => {
		fetchMock.mockResolvedValue(ok({ moderated: true }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.forum.moderatePost('post-1', { action: 'lock', reason: 'flame war' });
		await moderationApi.forum.moderatePost('post-1', { action: 'unlock', reason: 'settled' });
		await moderationApi.forum.moderatePost('post-1', { action: 'unhide', reason: 'ok now' });
		const actions = fetchMock.mock.calls.map(
			(c) => JSON.parse(c[1].body).action as string
		);
		expect(actions).toEqual(['lock', 'unlock', 'unhide']);
	});

	it('muteUser() sends scope + duration + reason', async () => {
		fetchMock.mockResolvedValue(
			ok({ mute_id: 'm1', expires_at: '2026-07-17', scope: 'forum' })
		);
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.forum.muteUser('u-9', {
			reason: 'repeat offender',
			duration_hours: 72,
			scope: 'forum'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/forum/users/u-9/mute');
		const body = JSON.parse(init.body);
		expect(body.duration_hours).toBe(72);
		expect(body.reason).toBe('repeat offender');
		expect(body.scope).toBe('forum');
	});
});

describe('moderationApi.community', () => {
	it('reviewQueue() reads /community/challenges/review', async () => {
		fetchMock.mockResolvedValue(paginated([]));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.community.reviewQueue({ page: 2, per_page: 25 });
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toContain('/api/community/challenges/review');
		expect(url).toContain('page=2');
		expect(url).toContain('per_page=25');
	});

	it('approveChallenge() posts with no body', async () => {
		fetchMock.mockResolvedValue(ok({ approved: true, id: 'c-1', title: 'x' }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.community.approveChallenge('c-1');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/community/challenges/c-1/approve');
		expect(init.method).toBe('POST');
	});

	it('rejectChallenge() carries the `feedback` key (backend contract)', async () => {
		fetchMock.mockResolvedValue(ok({ rejected: true, id: 'c-1', title: 'x' }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.community.rejectChallenge('c-1', {
			feedback: 'off-topic — please align with the code domain'
		});
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.feedback).toBeDefined();
		expect(body.feedback.length).toBeGreaterThanOrEqual(8);
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
		fetchMock.mockResolvedValue(ok({ marked_valid: true, id: 'd-1' }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.plagiarism.markValid('d-1', {
			reason: 'false positive: shared boilerplate'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/fraud/deliverables/d-1/mark-valid');
		expect(JSON.parse(init.body).reason).toContain('shared boilerplate');
	});

	it('revoke() sends reason (>= 8 chars enforced by backend)', async () => {
		fetchMock.mockResolvedValue(ok({ revoked: true, id: 'd-1' }));
		const { moderationApi } = await import('../../src/lib/api/moderation');
		await moderationApi.plagiarism.revoke('d-1', {
			reason: 'confirmed copy of d-2'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/fraud/deliverables/d-1/revoke');
		expect(JSON.parse(init.body).reason).toContain('confirmed copy');
	});
});
