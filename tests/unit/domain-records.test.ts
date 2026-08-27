import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The five craft records served with a nested score — code, quality, ops,
 * leadership, security.
 *
 * Each one carries an invariant the backend enforces and the front must not
 * undo: a defect lists its fix and not its reproduction, a test run is
 * verified or absent, an objective carries its source, confidential
 * leadership work is said in the abstract, and an embargoed finding arrives
 * without its title.
 */

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
	};
}

function notFound() {
	return {
		ok: false,
		status: 404,
		json: () =>
			Promise.resolve({
				error: { code: 'RESOURCE_NOT_FOUND', message: 'profile not found' },
				meta: { request_id: 'r', timestamp: '2026-08-27' }
			})
	};
}

const score = {
	score: 1200,
	tier_slug: 'engineer',
	tier_name: 'Engineer',
	tier_description: 'Ships work other people rely on.',
	next_tier_at: 2000,
	breakdown: [{ term: 'x', measured: 3, points: 300, explanation: 'Trois choses' }],
	capped: false
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

describe('domainProfilesApi', () => {
	it('addresses each record by username and domain', async () => {
		fetchMock.mockResolvedValue(ok({ username: 'ada', score, orientations: [] }));
		const { domainProfilesApi } = await import('../../src/lib/api/domain_profiles');

		await domainProfilesApi.quality('ada');
		await domainProfilesApi.ops('ada');
		await domainProfilesApi.leadership('ada');
		await domainProfilesApi.security('ada');
		await domainProfilesApi.code('ada');

		expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
			'/api/users/ada/quality-profile',
			'/api/users/ada/ops-profile',
			'/api/users/ada/leadership-profile',
			'/api/users/ada/security-profile',
			'/api/users/ada/code-profile'
		]);
	});

	it('a profile in a domain somebody never worked in answers 404', async () => {
		fetchMock.mockResolvedValue(notFound());
		const { domainProfilesApi } = await import('../../src/lib/api/domain_profiles');
		// A 404 rather than an empty object, so the absence cannot be read as
		// "this person has done nothing". The section swallows it and does not
		// render.
		await expect(domainProfilesApi.ops('nobody')).rejects.toMatchObject({ status: 404 });
	});

	it('code nests its score under `craft_score`, the other four under `score`', async () => {
		fetchMock.mockResolvedValue(
			ok({
				username: 'ada',
				craft_score: score,
				stored_score: 1100,
				stored_score_computed_at: '2026-08-27T00:00:00Z',
				orientations: [],
				attestations: [],
				languages: [],
				published_packages: [],
				missions_completed: [],
				portfolios: []
			})
		);
		const { domainProfilesApi } = await import('../../src/lib/api/domain_profiles');
		const res = await domainProfilesApi.code('ada');
		// The divergence the backend ticket is about. Until it lands, the front
		// reads both rather than pretending only one exists.
		expect(res.data.craft_score.tier_name).toBe('Engineer');
		// The stored figure is what the listings sort on; showing it next to the
		// live one is what makes a gap visible instead of confusing.
		expect(res.data.stored_score).toBe(1100);
	});
});

describe('the invariants each record carries', () => {
	it('a confirmed defect carries the fix and never the reproduction', async () => {
		fetchMock.mockResolvedValue(
			ok({
				username: 'ada',
				display_name: null,
				orientations: [],
				score,
				confirmed_bugs: [
					{
						title: 'Le parser casse sur les offsets négatifs',
						severity: 'high',
						severity_reviewed: true,
						reproducibility: 'always',
						fix_url: 'https://github.test/pull/1',
						fix_confirmed_at: '2026-08-01T00:00:00Z'
					}
				],
				target_domain_breakdown: [],
				attestations: [],
				verified_test_runs: []
			})
		);
		const { domainProfilesApi } = await import('../../src/lib/api/domain_profiles');
		const res = await domainProfilesApi.quality('ada');
		const bug = res.data.confirmed_bugs[0];
		expect(bug.fix_url).toContain('github.test');
		// A public list of reproductions for defects in other people's products
		// would be a disclosure channel nobody agreed to.
		expect(bug).not.toHaveProperty('reproduction');
		expect(bug).not.toHaveProperty('steps');
	});

	it('an embargoed finding arrives with no title and a month, not a day', async () => {
		fetchMock.mockResolvedValue(
			ok({
				username: 'ada',
				display_name: null,
				orientations: [],
				score,
				findings: [
					{
						id: 'f1',
						title: null,
						severity_tier: 'high',
						cvss_score: 8.1,
						cwe_id: 'CWE-89',
						status: 'confirmed',
						disclosure_stage: 'embargoed',
						target_kind: 'web',
						writeup_url: null,
						confirmed_month: '2026-06'
					}
				],
				practice: [],
				attestations: [],
				credentials: [],
				external_platforms: []
			})
		);
		const { domainProfilesApi } = await import('../../src/lib/api/domain_profiles');
		const res = await domainProfilesApi.security('ada');
		const finding = res.data.findings[0];
		// The title of an embargoed finding is half the disclosure, and the
		// backend withholds it rather than trusting a client to hide it.
		expect(finding.title).toBeNull();
		// A precise day narrows the embargo window; a month does not.
		expect(finding.confirmed_month).toBe('2026-06');
		expect(finding.confirmed_month).not.toMatch(/^\d{4}-\d{2}-\d{2}/);
	});

	it('confidential leadership work says the kind and never the client', async () => {
		fetchMock.mockResolvedValue(
			ok({
				username: 'ada',
				display_name: null,
				orientations: [],
				score,
				artefacts: [],
				confidential_summary: [
					{ subtype: 'reorganisation', context: 'Une scale-up de 200 personnes', verified_at: null }
				],
				cohorts: [
					{
						slug: 'cohorte-2026',
						target_domain: 'code',
						joined_total: 12,
						graduated_total: 9,
						left_for_work: 2,
						concluded_at: '2026-07-01T00:00:00Z',
						led_to_the_end: true
					}
				],
				retrospectives: [],
				target_domain_breakdown: [],
				attestations: []
			})
		);
		const { domainProfilesApi } = await import('../../src/lib/api/domain_profiles');
		const res = await domainProfilesApi.leadership('ada');
		const row = res.data.confidential_summary[0];
		expect(row.context).toContain('scale-up');
		expect(row).not.toHaveProperty('client_name');

		// A cohort is checkable: joined, finished, and those who left for a job
		// counted apart because that is the cohort working, not failing.
		const cohort = res.data.cohorts[0];
		expect(cohort.graduated_total).toBeLessThan(cohort.joined_total);
		expect(cohort.left_for_work).toBe(2);
	});

	it('cost work says whether the objective survived the saving', async () => {
		fetchMock.mockResolvedValue(
			ok({
				username: 'ada',
				display_name: null,
				orientations: [],
				score,
				objectives: [
					{
						service_name: 'api',
						target_percent: 99.9,
						achieved_percent: 99.95,
						window_days: 30,
						evidence_url: 'https://grafana.test/x',
						met: true
					}
				],
				incidents: [],
				cost_work: [
					{
						scope: 'stockage',
						monthly_before: '4200.00',
						monthly_after: '1800.00',
						currency: 'EUR',
						service_still_meets_slo: false
					}
				],
				attestations: [],
				credentials: []
			})
		);
		const { domainProfilesApi } = await import('../../src/lib/api/domain_profiles');
		const res = await domainProfilesApi.ops('ada');
		// Halving a bill by breaking the thing is not a saving, and the payload
		// says which happened.
		expect(res.data.cost_work[0].service_still_meets_slo).toBe(false);
		// An objective carries its source so a reader can check rather than
		// take the tier's word for it.
		expect(res.data.objectives[0].evidence_url).toContain('grafana');
	});
});

describe('the record domains', () => {
	it('lists the five served with a nested score', async () => {
		const { RECORD_DOMAINS } = await import('../../src/lib/types/domain_profiles');
		expect([...RECORD_DOMAINS]).toEqual(['code', 'quality', 'ops', 'leadership', 'security']);
	});
});
