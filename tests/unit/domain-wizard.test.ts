import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The per-domain onboarding wizard.
 *
 * The point of this surface is that it ships no vocabulary of its own:
 * `routes::domain_profile` owns the words — a CHECK would make each rewording
 * a migration — and serves them at `.../questions`. A wizard carrying its own
 * copy goes stale silently and pushes the refusal onto the user.
 */

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
	};
}

function noContent() {
	return { ok: true, status: 204, json: () => Promise.reject(new Error('no body')) };
}

const aiQuestions = [
	{
		key: 'level',
		answer: 'single',
		allowed: ['debutant', 'apprentissage', 'practitioner', 'senior', 'researcher'],
		max_selections: null,
		max_len: null
	},
	{
		key: 'weekly_hours',
		answer: 'single',
		allowed: ['lt3', '3_10', 'gt10', 'fulltime'],
		max_selections: null,
		max_len: null
	},
	{
		key: 'goal',
		answer: 'single',
		allowed: ['learning', 'portfolio', 'paid_missions', 'academic_research', 'startup'],
		max_selections: null,
		max_len: null
	},
	{
		key: 'compute',
		answer: 'single',
		allowed: ['none', 'personal_gpu', 'cloud_small', 'cloud_large', 'enterprise'],
		max_selections: null,
		max_len: null
	},
	{
		key: 'main_frameworks',
		answer: 'multi',
		allowed: ['pytorch', 'jax', 'tensorflow', 'candle', 'mlx', 'other'],
		max_selections: 3,
		max_len: null
	},
	{
		key: 'huggingface_username',
		answer: 'text',
		allowed: [],
		max_selections: null,
		max_len: 60
	},
	{
		key: 'preferred_families',
		answer: 'multi',
		allowed: ['ml-engineer', 'llm-engineer', 'nlp-engineer'],
		max_selections: 3,
		max_len: null
	}
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.resetModules();
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('domainProfileApi', () => {
	it('reads the questions from the domain rather than shipping them', async () => {
		fetchMock.mockResolvedValue(ok(aiQuestions));
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		const res = await domainProfileApi.questions('ai');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/domain-profile/ai/questions');
		expect(res.data.map((q) => q.key)).toContain('compute');
	});

	it('a multi question carries its ceiling, a text one its length', async () => {
		fetchMock.mockResolvedValue(ok(aiQuestions));
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		const res = await domainProfileApi.questions('ai');

		const frameworks = res.data.find((q) => q.key === 'main_frameworks');
		expect(frameworks).toMatchObject({ answer: 'multi', max_selections: 3 });
		// `multi` and not `text`: the wire shape is a list, and a form reading
		// only the vocabulary would send a string the validator refuses.
		const hf = res.data.find((q) => q.key === 'huggingface_username');
		expect(hf).toMatchObject({ answer: 'text', max_len: 60, allowed: [] });
	});

	it('the families question carries a vocabulary the front cannot know ahead', async () => {
		fetchMock.mockResolvedValue(ok(aiQuestions));
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		const res = await domainProfileApi.questions('ai');
		const families = res.data.find((q) => q.key === 'preferred_families');
		// It comes from the orientations table, so no translation can exist
		// ahead of time — the wizard falls back to the slug rather than an
		// empty chip nobody can pick.
		expect(families?.allowed).toContain('llm-engineer');
	});

	it('saves the answers as a flat object on the domain path', async () => {
		fetchMock.mockResolvedValue(ok({ domain: 'ai', answers: {} }));
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		await domainProfileApi.put('ai', {
			level: 'practitioner',
			main_frameworks: ['pytorch', 'jax'],
			huggingface_username: 'ada'
		});
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/domain-profile/ai');
		expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			level: 'practitioner',
			main_frameworks: ['pytorch', 'jax'],
			huggingface_username: 'ada'
		});
	});

	it('skipping is its own endpoint — an onboarding nobody can leave is a wall', async () => {
		fetchMock.mockResolvedValue(noContent());
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		await expect(domainProfileApi.skip('ai')).resolves.toBeUndefined();
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/domain-profile/ai/skip');
		expect(fetchMock.mock.calls[0][1].method).toBe('POST');
	});
});

describe('the answers type follows the questions', () => {
	it('frameworks are plural and a list, as the question is', async () => {
		// It was `main_framework`, singular, which `closed_multi` would have
		// refused. Nothing read it, so nothing broke — but nothing worked
		// either.
		const mod = await import('../../src/lib/types/design');
		const sample: import('../../src/lib/types/design').DomainProfileAnswers = {
			main_frameworks: ['pytorch'],
			preferred_families: ['ml-engineer']
		};
		expect(Array.isArray(sample.main_frameworks)).toBe(true);
		expect(mod.PROFILE_DOMAINS).toContain('ai');
	});
});
