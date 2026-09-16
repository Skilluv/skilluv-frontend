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
	it('listDesignContests narrows server-side rather than in memory', async () => {
		fetchMock.mockResolvedValue(ok({ tournaments: [tournament()] }));
		const { listDesignContests } = await import('../../src/lib/api/design');
		const contests = await listDesignContests();
		const url = String(fetchMock.mock.calls[0][0]);
		// SKI-302 added both filters. Narrowing in memory over a capped page
		// held at launch volume and would have silently dropped the oldest
		// design contests past two hundred tournaments.
		expect(url).toContain('kind=brief_contest');
		expect(url).toContain('skill_domain=design');
		expect(contests.map((c) => c.id)).toEqual(['t1']);
	});

	it('does not add the open-to-every-domain contests back itself', async () => {
		// `skill_domain=design` already returns them alongside the design ones,
		// so a second pass here would be a second definition of the same rule.
		fetchMock.mockResolvedValue(
			ok({ tournaments: [tournament(), tournament({ id: 't4', skill_domain: null })] })
		);
		const { listDesignContests } = await import('../../src/lib/api/design');
		const contests = await listDesignContests();
		expect(contests.map((c) => c.id)).toEqual(['t1', 't4']);
		expect(String(fetchMock.mock.calls[0][0])).not.toContain('limit=200');
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

describe('the design wizard is the shared wizard', () => {
	it('reads its questions from the registry rather than from the trade catalogue', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		await domainProfileApi.questions('design');

		// The hand-rolled wizard built its trade list from `GET /orientations`
		// with no parameters — fifty rows across eleven domains, ordered by
		// domain, with `design` fifth. This endpoint answers with the same
		// query the validator runs, so what is offered is what is accepted.
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/domain-profile/design/questions');
	});

	it('sends every answer in one request, with nothing held back on the device', async () => {
		fetchMock.mockResolvedValue(
			ok({ domain: 'design', answers: {}, completed_at: null, skipped_at: null })
		);
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		await domainProfileApi.put('design', {
			level: 'senior',
			weekly_hours: 'gt10',
			goal: 'paid_missions',
			preferred_families: ['design-brand-identity'],
			challenge_preference: 'contest',
			main_tool: 'figma',
			portfolio_url: 'https://behance.net/ada'
		});

		// One request, not two. The old store sent the full body, waited for
		// the 400 and re-sent a subset — which stopped being necessary the day
		// the registry grew these keys, and had been dropping the two answers
		// the server already accepted.
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			level: 'senior',
			weekly_hours: 'gt10',
			goal: 'paid_missions',
			preferred_families: ['design-brand-identity'],
			challenge_preference: 'contest',
			main_tool: 'figma',
			portfolio_url: 'https://behance.net/ada'
		});
	});

	it('surfaces the plan the save comes back with', async () => {
		const plan = {
			headline: 'Trente jours, un livrable.',
			because: 'Une traversée complète vaut mieux que trois débuts.',
			guides: ['toolkit-design'],
			feed_query: '/api/users/me/next-challenges',
			next_steps: ['Déclare un métier.']
		};
		fetchMock.mockResolvedValue(
			ok({
				domain: 'design',
				answers: {},
				completed_at: null,
				skipped_at: null,
				recommendation: plan
			})
		);
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		const res = await domainProfileApi.put('design', { level: 'debutant' });

		// The wizard used to toast and navigate away, discarding this.
		expect(res.data.recommendation).toEqual(plan);
	});

	it('records a dismissal as a dismissal', async () => {
		fetchMock.mockResolvedValue(ok(null, 204));
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		await domainProfileApi.skip('design');

		// `skipped_at` and an empty answer set are different states: the first
		// means stop asking, the second means ask again.
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/me/domain-profile/design/skip');
		expect(fetchMock.mock.calls[0][1].method).toBe('POST');
	});
});

describe('every discipline can be onboarded', () => {
	it('each of the twelve has a wizard URL and a place to land', async () => {
		const { PROFILE_DOMAINS } = await import('../../src/lib/types');
		const { onboardingHref, onboardingDoneHref, isProfileDomain } =
			await import('../../src/lib/utils/domain_onboarding');

		// The backend serves questions for every domain in `SKILL_DOMAINS`.
		// Three of them had a page; the rest were unreachable, `code` included
		// — and code has a ladder, goals and a tools question of its own.
		for (const domain of PROFILE_DOMAINS) {
			expect(isProfileDomain(domain)).toBe(true);
			expect(onboardingHref(domain)).toBe(`/onboarding/domain/${domain}`);
			expect(onboardingDoneHref(domain).startsWith('/')).toBe(true);
		}
	});

	it('refuses a slug the platform does not know', async () => {
		const { isProfileDomain } = await import('../../src/lib/utils/domain_onboarding');
		expect(isProfileDomain('gardening')).toBe(false);
		expect(isProfileDomain('')).toBe(false);
	});
});

describe('the wizard has copy for every vocabulary the backend serves', () => {
	// Mirrors `routes::domain_profile`. A value served with no label renders
	// as its own slug rather than as a blank chip, so this is a quality gate
	// and not a crash guard — but a wizard offering `oscp_or_offsec` as a
	// button is a wizard nobody finished.
	const VOCABULARIES: Record<string, string[]> = {
		level: [
			'debutant',
			'apprentissage',
			'practitioner',
			'senior',
			'researcher',
			'beginner',
			'junior',
			'mid',
			'staff'
		],
		weekly_hours: ['lt3', '3_10', 'gt10', 'fulltime', 'under_5', '5_to_15', '15_to_40'],
		goal: [
			'learning',
			'portfolio',
			'paid_missions',
			'academic_research',
			'startup',
			'learn',
			'build_portfolio',
			'find_paid_work',
			'contribute_upstream',
			'publish_library',
			'become_mentor',
			'ship_own_product'
		],
		compute: ['none', 'personal_gpu', 'cloud_small', 'cloud_large', 'enterprise'],
		main_frameworks: ['pytorch', 'jax', 'tensorflow', 'candle', 'mlx', 'other'],
		challenge_preference: [
			'individual',
			'contest',
			'both',
			'undecided',
			'upstream_contributions',
			'solo_shipped_apps',
			'published_libraries',
			'long_team_projects',
			'short_hackathons'
		],
		main_tool: ['figma', 'adobe', 'sketch', 'blender', 'after_effects', 'other'],
		security_certifications: [
			'none',
			'security_plus',
			'oscp_or_offsec',
			'ceh',
			'cissp_or_cism',
			'gcih_or_giac',
			'cloud_security',
			'other'
		],
		security_lab_setup: ['browser_only', 'local_tools', 'local_vms', 'home_lab', 'cloud'],
		main_formats: [
			'documentation',
			'articles',
			'talks',
			'video',
			'livestream',
			'podcast',
			'translation',
			'research'
		],
		audio_destination: ['game', 'motion', 'podcast', 'brand', 'ui', 'cross'],
		main_daws: [
			'reaper',
			'ardour',
			'logic',
			'fl_studio',
			'ableton',
			'cubase',
			'pro_tools',
			'audacity',
			'other'
		],
		quality_background: [
			'developer_moving_across',
			'professional_tester',
			'support_or_operations',
			'career_change',
			'student',
			'other'
		],
		leadership_level: ['aspiring', 'emerging', 'lead', 'senior_lead', 'executive'],
		leadership_context: ['employed_team', 'open_source', 'community', 'own_venture', 'none_yet'],
		main_settings: [
			'bootcamp',
			'school',
			'university',
			'in_company',
			'community',
			'self_paced',
			'one_to_one'
		],
		learner_level: ['beginner', 'junior', 'mid', 'senior', 'mixed']
	};

	/** The questions asked across the twelve domains, from the same registry. */
	const QUESTION_KEYS = [
		...Object.keys(VOCABULARIES),
		'preferred_families',
		'huggingface_username',
		'portfolio_url',
		'main_tools',
		'github_username',
		'security_tools',
		'subject_domain',
		'dev_to_username',
		'blog_url',
		'soundcloud_username',
		'bandcamp_username',
		'quality_target_domains',
		'quality_tools',
		'leadership_target_domains',
		'leadership_tools'
	];

	it('labels every option in both locales', async () => {
		const { fr } = await import('../../src/lib/i18n/fr');
		const { en } = await import('../../src/lib/i18n/en');
		const frOptions = fr.domainWizard.options as unknown as Record<string, Record<string, string>>;
		const enOptions = en.domainWizard.options as unknown as Record<string, Record<string, string>>;
		for (const [key, values] of Object.entries(VOCABULARIES)) {
			for (const value of values) {
				expect(frOptions[key]?.[value], `fr ${key}.${value}`).toBeTruthy();
				expect(enOptions[key]?.[value], `en ${key}.${value}`).toBeTruthy();
			}
		}
	});

	it('labels every question in both locales', async () => {
		const { fr } = await import('../../src/lib/i18n/fr');
		const { en } = await import('../../src/lib/i18n/en');
		const frQ = fr.domainWizard.questions as unknown as Record<string, string>;
		const enQ = en.domainWizard.questions as unknown as Record<string, string>;
		for (const key of QUESTION_KEYS) {
			expect(frQ[key], `fr ${key}`).toBeTruthy();
			expect(enQ[key], `en ${key}`).toBeTruthy();
		}
	});

	it('titles and subtitles every discipline in both locales', async () => {
		const { PROFILE_DOMAINS } = await import('../../src/lib/types');
		const { fr } = await import('../../src/lib/i18n/fr');
		const { en } = await import('../../src/lib/i18n/en');
		const frTitles = fr.domainWizard.titles as unknown as Record<string, string>;
		const enSubtitles = en.domainWizard.subtitles as unknown as Record<string, string>;
		for (const domain of [...PROFILE_DOMAINS, 'generic']) {
			expect(frTitles[domain], `fr ${domain}`).toBeTruthy();
			expect(enSubtitles[domain], `en ${domain}`).toBeTruthy();
		}
	});

	it('reads the discipline answers from the one place they are already translated', async () => {
		// `quality_target_domains` and `leadership_target_domains` answer with
		// discipline slugs and have no map of their own on purpose: copying
		// the twelve names into two more places is two more places for them to
		// drift out of step with `common.domains`.
		const { fr } = await import('../../src/lib/i18n/fr');
		const { PROFILE_DOMAINS } = await import('../../src/lib/types');
		const frDomains = fr.common.domains as unknown as Record<string, string>;
		expect('quality_target_domains' in fr.domainWizard.options).toBe(false);
		for (const domain of PROFILE_DOMAINS) {
			expect(frDomains[domain], domain).toBeTruthy();
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
