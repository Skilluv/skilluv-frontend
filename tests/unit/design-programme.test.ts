import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// `$api/attestation` reads PUBLIC_API_BASE_URL to build absolute badge and PDF
// URLs. The virtual module behind it has no `process.env` under jsdom, so it is
// stubbed with the empty environment — which is also what a browser sees when
// the variable is unset.
vi.mock('$env/dynamic/public', () => ({ env: {} }));

/**
 * SKI-237, SKI-248, SKI-253, SKI-265 — the Skilluv Design front layer.
 *
 * The three architectural facts these tests hold in place: a design contest is
 * a `brief_contest` tournament, a design mission is `/missions` filtered by
 * domain, and the design profile is addressed by username.
 */

function ok(data: unknown, status = 200) {
	return {
		ok: true,
		status,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-17' } })
	};
}

function fail(status: number, code: string) {
	return {
		ok: false,
		status,
		json: () =>
			Promise.resolve({
				error: { code, message: 'nope' },
				meta: { request_id: 'r', timestamp: '2026-08-17' }
			})
	};
}

function tournament(overrides: Record<string, unknown> = {}) {
	return {
		id: 't1',
		slug: 'brand-sprint',
		name: 'Brand sprint',
		kind: 'brief_contest',
		skill_domain: 'design',
		status: 'active',
		starts_at: '2026-08-01T00:00:00Z',
		ends_at: '2026-09-01T00:00:00Z',
		prize_pool_fragments: 500,
		rules: { brief: 'make a mark', judging_criteria: 'craft' },
		...overrides
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
	vi.unstubAllEnvs();
});

describe('design contests are tournaments', () => {
	it('listDesignContests keeps only brief_contest entries in the design domain', async () => {
		fetchMock.mockResolvedValue(
			ok({
				tournaments: [
					tournament(),
					tournament({ id: 't2', kind: 'hackathon' }),
					tournament({ id: 't3', skill_domain: 'code' }),
					tournament({ id: 't4', skill_domain: null })
				]
			})
		);
		const { listDesignContests } = await import('../../src/lib/api/design');
		const contests = await listDesignContests();
		// The open-to-every-domain contest counts; the code one and the
		// hackathon do not.
		expect(contests.map((c) => c.id)).toEqual(['t1', 't4']);
	});

	it('the listing is asked for a full page, since it has no kind filter', async () => {
		fetchMock.mockResolvedValue(ok({ tournaments: [] }));
		const { listDesignContests } = await import('../../src/lib/api/design');
		await listDesignContests();
		expect(fetchMock.mock.calls[0][0]).toContain('limit=200');
	});

	it('get() and leaderboard() read the keys the backend wraps them in', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ tournament: tournament() }))
			.mockResolvedValueOnce(ok({ leaderboard: [{ participant_id: 'u1', score: 10, rank: 1 }] }));
		const { tournamentApi } = await import('../../src/lib/api/tournament');

		const detail = await tournamentApi.get('brand-sprint');
		expect(detail.data.tournament.slug).toBe('brand-sprint');

		const standing = await tournamentApi.leaderboard('brand-sprint');
		expect(standing.data.leaderboard[0].rank).toBe(1);
	});

	it('submitting posts the artifact and its summary', async () => {
		fetchMock.mockResolvedValue(ok({ submission: { id: 's1' } }));
		const { tournamentApi } = await import('../../src/lib/api/tournament');
		await tournamentApi.submit('brand-sprint', {
			artifact_url: 'https://figma.com/x',
			artifact_type: 'design_artifact',
			summary: 'the idea'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/tournaments/brand-sprint/submissions');
		expect(JSON.parse(init.body)).toEqual({
			artifact_url: 'https://figma.com/x',
			artifact_type: 'design_artifact',
			summary: 'the idea'
		});
	});

	it('a community vote names the submission, and the tally comes back per entry', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ recorded: true }))
			.mockResolvedValueOnce(ok({ ranking: [{ submission_id: 's1', votes: 4 }] }));
		const { tournamentApi } = await import('../../src/lib/api/tournament');

		await tournamentApi.communityVote('brand-sprint', 's1');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ submission_id: 's1' });

		const ranking = await tournamentApi.communityRanking('brand-sprint');
		expect(ranking.data.ranking[0].votes).toBe(4);
	});
});

describe('design missions are missions', () => {
	it('browse narrows the shared endpoint by domain', async () => {
		fetchMock.mockResolvedValue(ok({ missions: [] }));
		const { missionsApi } = await import('../../src/lib/api/missions');
		await missionsApi.browse({ skill_domain: 'design', ip_terms: 'open_source_output', limit: 24 });
		expect(fetchMock.mock.calls[0][0]).toBe(
			'/api/missions?skill_domain=design&ip_terms=open_source_output&limit=24'
		);
	});

	it('applying posts the letter and the picked references', async () => {
		fetchMock.mockResolvedValue(ok({ application: { id: 'a1' } }));
		const { missionsApi } = await import('../../src/lib/api/missions');
		await missionsApi.apply('rebrand', {
			cover_letter: 'here is why',
			portfolio_urls: ['https://behance.net/x'],
			availability_hours_per_week: 10
		});
		expect(fetchMock.mock.calls[0][0]).toBe('/api/missions/rebrand/apply');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body).portfolio_urls).toEqual([
			'https://behance.net/x'
		]);
	});

	it('every ip term the backend accepts has a label and a hint in both locales', async () => {
		const { MISSION_IP_TERMS } = await import('../../src/lib/types');
		const { designFr } = await import('../../src/lib/i18n/design.fr');
		const { designEn } = await import('../../src/lib/i18n/design.en');
		for (const terms of MISSION_IP_TERMS) {
			expect(designFr.missions.ipTerms[terms]).toBeTruthy();
			expect(designFr.missions.ipTermsHints[terms]).toBeTruthy();
			expect(designEn.missions.ipTerms[terms]).toBeTruthy();
			expect(designEn.missions.ipTermsHints[terms]).toBeTruthy();
		}
	});

	it('every payment model has a label in both locales', async () => {
		const { MISSION_PAYMENT_MODELS } = await import('../../src/lib/types');
		const { designFr } = await import('../../src/lib/i18n/design.fr');
		const { designEn } = await import('../../src/lib/i18n/design.en');
		for (const model of MISSION_PAYMENT_MODELS) {
			expect(designFr.missions.paymentModels[model]).toBeTruthy();
			expect(designEn.missions.paymentModels[model]).toBeTruthy();
		}
	});
});

describe('design profile', () => {
	it('is addressed by username, not by id', async () => {
		fetchMock.mockResolvedValue(
			ok({
				username: 'ada',
				craft_score: { score: 120, tier_slug: 'a', tier_name: 'A', breakdown: [] },
				artefacts: [],
				contests: [],
				trades: [],
				attestations: []
			})
		);
		const { designApi } = await import('../../src/lib/api/design');
		const res = await designApi.profile('ada');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/ada/design-profile');
		expect(res.data.username).toBe('ada');
	});
});

describe('the wizard holds what the server will not take', () => {
	it('sends everything when the server accepts it, and keeps nothing back', async () => {
		fetchMock.mockResolvedValue(ok({ domain: 'design', answers: {} }));
		const { designWizard } = await import('../../src/lib/stores/design_wizard.svelte');
		designWizard.level = 'senior';
		designWizard.weeklyHours = 'gt10';
		designWizard.goal = 'paid_missions';
		designWizard.setFamilies(['brand-identity']);
		designWizard.setMainTool('figma');

		const result = await designWizard.save();

		expect(result.fullySaved).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			level: 'senior',
			weekly_hours: 'gt10',
			goal: 'paid_missions',
			preferred_families: ['brand-identity'],
			main_tool: 'figma'
		});
		expect(designWizard.heldLocally).toBe(false);
	});

	it('falls back to the supported subset when the shape is refused', async () => {
		fetchMock
			.mockResolvedValueOnce(fail(400, 'VALIDATION_ERROR'))
			.mockResolvedValueOnce(ok({ domain: 'design', answers: {} }));
		const { designWizard } = await import('../../src/lib/stores/design_wizard.svelte');
		designWizard.level = 'debutant';
		designWizard.goal = 'learning';
		designWizard.setChallengePreference('contest');

		const result = await designWizard.save();

		expect(result.fullySaved).toBe(false);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		// The second body carries only what the vocabulary knows.
		expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
			level: 'debutant',
			goal: 'learning'
		});
		expect(designWizard.heldLocally).toBe(true);
	});

	it('a failure that is not about shape surfaces instead of losing answers', async () => {
		fetchMock.mockResolvedValue(fail(500, 'INTERNAL'));
		const { designWizard } = await import('../../src/lib/stores/design_wizard.svelte');
		designWizard.level = 'senior';
		designWizard.setMainTool('blender');

		await expect(designWizard.save()).rejects.toThrow();
		// One attempt: a 500 must not be retried with less data.
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('with no extra answers there is a single request and nothing held', async () => {
		fetchMock.mockResolvedValue(ok({ domain: 'design', answers: {} }));
		const { designWizard } = await import('../../src/lib/stores/design_wizard.svelte');
		designWizard.level = 'practitioner';

		const result = await designWizard.save();

		expect(result.fullySaved).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ level: 'practitioner' });
	});

	it('caps the families answer at three', async () => {
		const { designWizard } = await import('../../src/lib/stores/design_wizard.svelte');
		designWizard.setFamilies(['a', 'b', 'c', 'd', 'e']);
		expect(designWizard.pending.preferred_families).toEqual(['a', 'b', 'c']);
	});

	it('every vocabulary value the wizard offers has copy in both locales', async () => {
		const { DOMAIN_LEVELS, DOMAIN_WEEKLY_HOURS, DOMAIN_GOALS } = await import(
			'../../src/lib/types'
		);
		const { designFr } = await import('../../src/lib/i18n/design.fr');
		const { designEn } = await import('../../src/lib/i18n/design.en');
		for (const level of DOMAIN_LEVELS) {
			expect(designFr.designWizard.levels[level]).toBeTruthy();
			expect(designEn.designWizard.levels[level]).toBeTruthy();
		}
		for (const hours of DOMAIN_WEEKLY_HOURS) {
			expect(designFr.designWizard.weeklyHours[hours]).toBeTruthy();
			expect(designEn.designWizard.weeklyHours[hours]).toBeTruthy();
		}
		for (const goal of DOMAIN_GOALS) {
			expect(designFr.designWizard.goals[goal]).toBeTruthy();
			expect(designEn.designWizard.goals[goal]).toBeTruthy();
		}
	});
});

describe('issued attestation verification', () => {
	it('resolves a 12-character code, not a slice hash', async () => {
		fetchMock.mockResolvedValue(
			ok({
				valid: true,
				attestation: { verification_code: 'ABC123XYZ789', title: 'Brand system delivered' },
				verification_url: '/attestations/verify/ABC123XYZ789'
			})
		);
		const { attestationApi } = await import('../../src/lib/api/attestation');
		const res = await attestationApi.verifyIssued('ABC123XYZ789');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/attestations/verify/ABC123XYZ789');
		expect(res.data.valid).toBe(true);
	});

	it('a revoked attestation still comes back with its body', async () => {
		fetchMock.mockResolvedValue(
			ok({
				valid: false,
				reason: 'revoked',
				attestation: { verification_code: 'ABC123XYZ789', revoke_reason: 'plagiarism' }
			})
		);
		const { attestationApi } = await import('../../src/lib/api/attestation');
		const res = await attestationApi.verifyIssued('ABC123XYZ789');
		// Withdrawn and never-existed are different facts about a person.
		expect(res.data.valid).toBe(false);
		expect(res.data.reason).toBe('revoked');
		expect(res.data.attestation?.revoke_reason).toBe('plagiarism');
	});

	it('an unknown code answers 200 with no attestation', async () => {
		fetchMock.mockResolvedValue(ok({ valid: false, reason: 'not_found' }));
		const { attestationApi } = await import('../../src/lib/api/attestation');
		const res = await attestationApi.verifyIssued('NOPE');
		expect(res.data.attestation).toBeUndefined();
	});

	it('the code is escaped into the path', async () => {
		fetchMock.mockResolvedValue(ok({ valid: false, reason: 'not_found' }));
		const { attestationApi } = await import('../../src/lib/api/attestation');
		await attestationApi.verifyIssued('a/b c');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/attestations/verify/a%2Fb%20c');
	});
});
