import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** SKI-44 … SKI-47 — assistant, talent offers, vouchings, skill tree. */

function ok(data: unknown, status = 200) {
	return {
		ok: true,
		status,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-17' } })
	};
}

function noContent() {
	return { ok: true, status: 204, json: () => Promise.reject(new Error('no body')) };
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

describe('aiCompanionApi', () => {
	it('ask() posts the interaction type, prompt and locale', async () => {
		fetchMock.mockResolvedValue(
			ok({
				interaction_id: 'i1',
				answer_markdown: 'because',
				items: [],
				disclosure_label: 'ai_assisted',
				model_version: null,
				cached: false,
				quota_remaining: 9
			})
		);
		const { aiCompanionApi } = await import('../../src/lib/api/ai_companion');
		const res = await aiCompanionApi.ask({
			interaction_type: 'explain',
			prompt: 'why?',
			locale: 'en'
		});
		expect(fetchMock.mock.calls[0][0]).toBe('/api/assistant/ask');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			interaction_type: 'explain',
			prompt: 'why?',
			locale: 'en'
		});
		expect(res.data.quota_remaining).toBe(9);
	});

	it('a cached answer is reported so the UI can say no quota was spent', async () => {
		fetchMock.mockResolvedValue(
			ok({
				interaction_id: 'i1',
				answer_markdown: 'x',
				items: [],
				disclosure_label: 'ai_assisted',
				model_version: 'm1',
				cached: true,
				quota_remaining: 10
			})
		);
		const { aiCompanionApi } = await import('../../src/lib/api/ai_companion');
		const res = await aiCompanionApi.ask({ interaction_type: 'explain', prompt: 'x' });
		expect(res.data.cached).toBe(true);
		expect(res.data.quota_remaining).toBe(10);
	});

	it('the mirrored limits match what the backend enforces', async () => {
		const { AI_DAILY_QUOTA, AI_MAX_PROMPT_CHARS, AI_MAX_CODE_CHARS } = await import(
			'../../src/lib/api/ai_companion'
		);
		// services::ai_companion — DAILY_QUOTA / MAX_PROMPT_CHARS / MAX_CODE_CHARS.
		expect(AI_DAILY_QUOTA).toBe(10);
		expect(AI_MAX_PROMPT_CHARS).toBe(4000);
		expect(AI_MAX_CODE_CHARS).toBe(20_000);
	});

	it('interactions() can narrow to what is not attached yet', async () => {
		fetchMock.mockResolvedValue(ok({ interactions: [] }));
		const { aiCompanionApi } = await import('../../src/lib/api/ai_companion');
		await aiCompanionApi.interactions({ limit: 25, undisclosed_only: true });
		expect(fetchMock.mock.calls[0][0]).toBe(
			'/api/users/me/assistant-interactions?limit=25&undisclosed_only=true'
		);
	});
});

describe('talentOffersApi', () => {
	it('an explicit null price is what makes an offer free', async () => {
		fetchMock.mockResolvedValue(ok({ offer: { id: 'o1' } }, 201));
		const { talentOffersApi } = await import('../../src/lib/api/talent_offers');
		await talentOffersApi.create({
			offer_type: 'pair_programming',
			availability_hours: 2,
			price_cents_per_hour: null
		});
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			offer_type: 'pair_programming',
			availability_hours: 2,
			price_cents_per_hour: null
		});
	});

	it('update() distinguishes clearing a price from leaving it alone', async () => {
		fetchMock.mockResolvedValue(ok({ offer: { id: 'o1' } }));
		const { talentOffersApi } = await import('../../src/lib/api/talent_offers');

		await talentOffersApi.update('o1', { price_cents_per_hour: null });
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ price_cents_per_hour: null });

		await talentOffersApi.update('o1', { active: false });
		expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ active: false });
	});

	it('browse() filters by skill slug and free-only', async () => {
		fetchMock.mockResolvedValue(ok({ offers: [], limit: 24, offset: 0 }));
		const { talentOffersApi } = await import('../../src/lib/api/talent_offers');
		await talentOffersApi.browse({ offer_type: 'code_review', skill: 'rust', free_only: true });
		expect(fetchMock.mock.calls[0][0]).toBe(
			'/api/talent-offers?offer_type=code_review&skill=rust&free_only=true'
		);
	});

	it('listMine() reports whether the rank floor is cleared', async () => {
		fetchMock.mockResolvedValue(ok({ offers: [], can_publish: false }));
		const { talentOffersApi } = await import('../../src/lib/api/talent_offers');
		const res = await talentOffersApi.listMine();
		expect(res.data.can_publish).toBe(false);
	});
});

describe('vouchingsApi', () => {
	it('create() defaults are mirrored from the backend window rules', async () => {
		const { VOUCHING_MIN_WINDOW_DAYS, VOUCHING_MAX_WINDOW_DAYS, VOUCHING_DEFAULT_WINDOW_DAYS } =
			await import('../../src/lib/api/vouchings');
		// services::vouchings — MIN_WINDOW_DAYS / MAX_WINDOW_DAYS, ticket default.
		expect(VOUCHING_MIN_WINDOW_DAYS).toBe(30);
		expect(VOUCHING_MAX_WINDOW_DAYS).toBe(365);
		expect(VOUCHING_DEFAULT_WINDOW_DAYS).toBe(180);
	});

	it('create() posts the stake kind so the two flavours stay distinct', async () => {
		fetchMock.mockResolvedValue(ok({ vouching: { id: 'v1' } }, 201));
		const { vouchingsApi } = await import('../../src/lib/api/vouchings');
		await vouchingsApi.create({
			vouched_id: 'u1',
			window_days: 90,
			at_stake_kind: 'reputation_only',
			statement: 'I know their work'
		});
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			vouched_id: 'u1',
			window_days: 90,
			at_stake_kind: 'reputation_only',
			statement: 'I know their work'
		});
	});

	it('withdraw() answers 204 and forUser() resolves the voucher', async () => {
		fetchMock.mockResolvedValueOnce(noContent());
		fetchMock.mockResolvedValueOnce(
			ok({ vouchings: [{ id: 'v1', voucher_display_name: 'Ada' }], count: 1 })
		);
		const { vouchingsApi } = await import('../../src/lib/api/vouchings');

		await expect(vouchingsApi.withdraw('v1')).resolves.toBeUndefined();

		const res = await vouchingsApi.forUser('u1');
		expect(fetchMock.mock.calls[1][0]).toBe('/api/users/u1/vouchings');
		expect(res.data.vouchings[0].voucher_display_name).toBe('Ada');
	});
});

describe('skillTreeApi', () => {
	it('forUser() omits the domain filter when there is none', async () => {
		fetchMock.mockResolvedValue(ok({ user_id: 'u1', tree: [], counts: {} }));
		const { skillTreeApi } = await import('../../src/lib/api/skill_tree');
		await skillTreeApi.forUser('u1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/u1/skill-tree');
	});

	it('forUser() narrows to one domain when asked', async () => {
		fetchMock.mockResolvedValue(ok({ user_id: 'u1', tree: [], counts: { locked: 2 } }));
		const { skillTreeApi } = await import('../../src/lib/api/skill_tree');
		const res = await skillTreeApi.forUser('u1', 'security');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/u1/skill-tree?domain=security');
		expect(res.data.counts.locked).toBe(2);
	});

	it('every status the backend can return has copy in both locales', async () => {
		const { SKILL_TREE_STATUSES } = await import('../../src/lib/types');
		const { postMvpFr } = await import('../../src/lib/i18n/postmvp.fr');
		const { postMvpEn } = await import('../../src/lib/i18n/postmvp.en');
		for (const status of SKILL_TREE_STATUSES) {
			expect(postMvpFr.skillTree.statuses[status]).toBeTruthy();
			expect(postMvpFr.skillTree.statusHints[status]).toBeTruthy();
			expect(postMvpEn.skillTree.statuses[status]).toBeTruthy();
			expect(postMvpEn.skillTree.statusHints[status]).toBeTruthy();
		}
	});

	it('the domain filter list matches the backend allowlist', async () => {
		const { SKILL_TREE_DOMAINS } = await import('../../src/lib/api/skill_tree');
		// routes::skill_tree — ALLOWED_DOMAINS.
		expect([...SKILL_TREE_DOMAINS]).toEqual([
			'code',
			'design',
			'game',
			'security',
			'soft_skills',
			'ai',
			'ops'
		]);
	});
});
