import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The AI domain of work — `/ai/artifacts` and `/ai/competitions`, both served
 * for a while with no page calling them.
 *
 * Not the assistant. The backend split the two deliberately (`/api/assistant`
 * is the other one) and the client keeps the split: `$api/ai` is the
 * assistant, `$api/ai_domain` is the trade.
 */

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
	};
}

const artifact = {
	slice_id: 's1',
	title: 'Un modèle de segmentation',
	ai_subtype: 'ml_model',
	ai_frameworks: ['pytorch'],
	hosting_url: 'https://huggingface.co/x/y',
	model_size_params: 7_000_000_000,
	author_username: 'ada',
	orientation_slug: 'ml-engineer',
	downloads_recent: null,
	likes_count: 12
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

describe('aiDomainApi', () => {
	it('browses artefacts with the filters the backend accepts', async () => {
		fetchMock.mockResolvedValue(ok({ artifacts: [] }));
		const { aiDomainApi } = await import('../../src/lib/api/ai_domain');
		await aiDomainApi.artifacts({ subtype: 'ml_model', framework: 'pytorch', limit: 20 });
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url.split('?')[0]).toBe('/api/ai/artifacts');
		const qs = new URLSearchParams(url.split('?')[1]);
		expect(qs.get('subtype')).toBe('ml_model');
		expect(qs.get('framework')).toBe('pytorch');
	});

	it('a hub that publishes no download figure stays null, not zero', async () => {
		fetchMock.mockResolvedValue(ok({ artifacts: [artifact] }));
		const { aiDomainApi } = await import('../../src/lib/api/ai_domain');
		const res = await aiDomainApi.artifacts();
		// The backend sorts on `COALESCE(downloads_recent, 0)` so an unfetched
		// artefact does not drop out of the listing — but the figure itself
		// must not be drawn as a zero somebody would read as a verdict.
		expect(res.data.artifacts[0].downloads_recent).toBeNull();
		expect(res.data.artifacts[0].likes_count).toBe(12);
	});

	it('competitions default to open ones only', async () => {
		fetchMock.mockResolvedValue(ok({ competitions: [] }));
		const { aiDomainApi } = await import('../../src/lib/api/ai_domain');
		await aiDomainApi.competitions();
		// No `include_closed`: a listing that keeps showing closed entries
		// teaches people to stop reading it.
		expect(fetchMock.mock.calls[0][0]).toBe('/api/ai/competitions');
	});

	it('a rolling leaderboard has no deadline, and that is not a missing value', async () => {
		fetchMock.mockResolvedValue(
			ok({
				competitions: [
					{
						id: 'c1',
						platform: 'Kaggle',
						title: 'Rolling benchmark',
						url: 'https://kaggle.test/x',
						why_this_one: 'The only one that scores calibration.',
						deadline: null,
						prize_note: null,
						orientation_slugs: ['ml-engineer']
					}
				]
			})
		);
		const { aiDomainApi } = await import('../../src/lib/api/ai_domain');
		const res = await aiDomainApi.competitions();
		expect(res.data.competitions[0].deadline).toBeNull();
		// The curator's line is the editorial point of the section.
		expect(res.data.competitions[0].why_this_one).toContain('calibration');
	});

	it('mirrors the six artefact subtypes', async () => {
		const { AI_ARTIFACT_SUBTYPES } = await import('../../src/lib/types/ai_domain');
		expect([...AI_ARTIFACT_SUBTYPES]).toEqual([
			'ml_model',
			'dataset',
			'llm_agent',
			'data_pipeline',
			'ai_service_api',
			'ai_research_paper'
		]);
	});
});

describe('the mission board is one surface for every domain', () => {
	it('browses `/missions` narrowed by skill_domain, never a per-domain path', async () => {
		fetchMock.mockResolvedValue(ok({ missions: [] }));
		const { missionsApi } = await import('../../src/lib/api/missions');
		await missionsApi.browse({ skill_domain: 'ai', limit: 24, offset: 0 });
		const url = fetchMock.mock.calls[0][0] as string;
		// There is no `/ai/missions` API and no `/design/missions` one: the
		// board is a component pointed at a domain, which is why an AI mission
		// and a design mission share a workflow, a commission and a dispute
		// path.
		expect(url.split('?')[0]).toBe('/api/missions');
		expect(new URLSearchParams(url.split('?')[1]).get('skill_domain')).toBe('ai');
	});
});
