import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The AI and audio craft records (ai A-03, audio A-03).
 *
 * `services::craft_score` is per domain but not per formula: every domain
 * reads its own weights and returns the same six fields, deliberately, so a
 * person can compare their own two profiles. These tests pin that the client
 * treats it as one shape and addresses it the one way the backend serves it —
 * by username, not by uuid.
 */

function ok(data: unknown, status = 200) {
	return {
		ok: true,
		status,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
	};
}

function notFound() {
	return {
		ok: false,
		status: 404,
		json: () =>
			Promise.resolve({
				error: { code: 'RESOURCE_NOT_FOUND', message: 'user not found' },
				meta: { request_id: 'r', timestamp: '2026-08-27' }
			})
	};
}

const aiProfile = {
	username: 'ada',
	craft_score: 1200,
	tier: 'engineer',
	tier_name: 'Engineer',
	tier_description: 'Ships models other people rely on.',
	next_tier_at: 2000,
	breakdown: [
		{ term: 'verified_artifacts', measured: 6, points: 600, explanation: 'Verified artefacts' },
		{ term: 'benchmarks', measured: 2.5, points: 600, explanation: 'Benchmark placements' },
		{ term: 'unused', measured: 0, points: 0, explanation: 'Nothing here' }
	],
	capped: false,
	orientations: ['ml-engineer', 'llm-engineer']
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

describe('craftApi', () => {
	it('addresses the record by username and domain, never by uuid', async () => {
		fetchMock.mockResolvedValue(ok(aiProfile));
		const { craftApi } = await import('../../src/lib/api/craft');
		const res = await craftApi.profile('ai', 'ada');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/ada/ai-profile');
		expect(res.data.tier).toBe('engineer');
	});

	it('the audio record carries the highlights the shared shape does not', async () => {
		fetchMock.mockResolvedValue(
			ok({
				...aiProfile,
				orientations: ['audio-composer'],
				highlights: [
					{
						slice_id: 's1',
						title: 'Main theme',
						subtype: 'score',
						destination: 'a game',
						external_url: 'https://example.test/theme',
						duration_seconds: 185,
						has_preview: true
					}
				]
			})
		);
		const { craftApi } = await import('../../src/lib/api/craft');
		const res = await craftApi.audioProfile('ada');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/ada/audio-profile');
		expect(res.data.highlights[0].duration_seconds).toBe(185);
		// Nothing here is a playable link: every listen costs a signed,
		// short-lived URL scoped to the slice.
		expect(res.data.highlights[0]).not.toHaveProperty('stream_url');
	});

	it('a person with no record in the domain gets a 404, which the section swallows', async () => {
		fetchMock.mockResolvedValue(notFound());
		const { craftApi } = await import('../../src/lib/api/craft');
		await expect(craftApi.profile('audio', 'nobody')).rejects.toThrow();
	});
});

describe('the craft shape', () => {
	it('lists exactly the domains served by a flat {domain}-profile endpoint', async () => {
		const { CRAFT_DOMAINS } = await import('../../src/lib/types/craft');
		// Design is deliberately absent: it shipped first with a nested
		// craft_score plus artefacts, contests and attestations, and has its
		// own type and section.
		expect([...CRAFT_DOMAINS]).toEqual(['ai', 'audio']);
	});

	it('only contributing terms are worth rendering', async () => {
		fetchMock.mockResolvedValue(ok(aiProfile));
		const { craftApi } = await import('../../src/lib/api/craft');
		const res = await craftApi.profile('ai', 'ada');
		const contributing = res.data.breakdown.filter((t) => t.points > 0);
		expect(contributing).toHaveLength(2);
		// A scaled term arrives as a raw figure, a counting term as a whole
		// number — the section formats them apart.
		expect(Number.isInteger(contributing[0].measured)).toBe(true);
		expect(Number.isInteger(contributing[1].measured)).toBe(false);
	});

	it('the wizard addresses every domain the backend guards, not the first seven', async () => {
		const { PROFILE_DOMAINS } = await import('../../src/lib/types/design');
		// `validators::SKILL_DOMAINS` is the list `routes::domain_profile`
		// checks the path segment against. The five newest domains were
		// missing here, so their wizard was unreachable from the front while
		// the backend answered for them.
		expect([...PROFILE_DOMAINS].sort()).toEqual(
			[
				'ai',
				'audio',
				'code',
				'communication',
				'design',
				'education',
				'game',
				'leadership',
				'ops',
				'quality',
				'security',
				'soft_skills'
			].sort()
		);
	});
});
