import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$env/dynamic/public', () => ({ env: {} }));

/**
 * The Skilluv Cyber front layer (SKI-116 … SKI-284).
 *
 * What these tests hold in place is the set of backend decisions the UI is not
 * allowed to quietly reverse:
 *
 * - a proof is a **key**, never a URL, and never rendered as a link;
 * - a wrong flag is a 200, not an error, and carries what is left to try;
 * - a finding's details stay withheld until publication, and a null title is
 *   the embargo working rather than missing data;
 * - an anonymous reporter has a stable alias and stays on the list;
 * - the trust page and the hall of fame read the same rows;
 * - a declared credential is never mixed in with a verified one.
 */

function ok(data: unknown, status = 200) {
	return {
		ok: true,
		status,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
	};
}

function fail(status: number, code: string, message = 'nope') {
	return {
		ok: false,
		status,
		json: () =>
			Promise.resolve({
				error: { code, message },
				meta: { request_id: 'r', timestamp: '2026-08-27' }
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
	vi.unstubAllEnvs();
});

describe('the vocabulary is served, not hardcoded', () => {
	it('the reference carries the payout table the pages quote', async () => {
		fetchMock.mockResolvedValue(
			ok({
				orientations: [],
				severity_tiers: ['critical'],
				fragments_by_severity: { critical: 500, low: 20 },
				triage_sla_days: 5
			})
		);
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.reference();
		expect(fetchMock.mock.calls[0][0]).toBe('/api/security/reference');
		// Read rather than printed: a stale figure here is a broken promise.
		expect(res.data.fragments_by_severity.critical).toBe(500);
	});

	it('the scope is public and carries the out-of-scope list verbatim', async () => {
		fetchMock.mockResolvedValue(
			ok({
				in_scope_hosts: ['skill-uv.com'],
				out_of_scope: ['denial of service of any kind, including load testing'],
				triage_sla_days: 5,
				default_embargo_days: 90,
				contact: 'security@skill-uv.com',
				policy_url: 'https://example.test/security',
				research_mode: { header: 'X-Security-Research', handle_header: 'X-H', multiplier: 5, how: '' }
			})
		);
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.scope();
		expect(fetchMock.mock.calls[0][0]).toBe('/api/security/scope');
		expect(res.data.out_of_scope[0]).toContain('denial of service');
	});
});

describe('reporting', () => {
	it('a report carries its proof keys and comes back with the promised date', async () => {
		fetchMock.mockResolvedValue(
			ok({ report: { id: 'f1', title: 'x', status: 'submitted', triage_due_by: '2026-09-01T00:00:00Z' } })
		);
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.submitReport({
			title: 'Session fixation on login',
			description_md: 'what it is',
			reproduction_steps_md: 'step one',
			target_kind: 'platform',
			proof_keys: ['security-proofs/u1/abc.png'],
			anonymous: false
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/security/reports');
		expect(JSON.parse(init.body).proof_keys).toEqual(['security-proofs/u1/abc.png']);
		// The promise the policy makes, shown back immediately.
		expect(res.data.report.triage_due_by).toBe('2026-09-01T00:00:00Z');
	});

	it('a proof upload goes as multipart with no hand-set content type', async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ data: { key: 'security-proofs/u1/a.png', note: 'not a URL' } })
		});
		const { securityApi } = await import('../../src/lib/api/security');
		const stored = await securityApi.uploadProof(new File(['x'], 'a.png'));
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/security/reports/uploads');
		expect(init.body).toBeInstanceOf(FormData);
		// A hand-set Content-Type strips the boundary the browser generates.
		expect(init.headers).toBeUndefined();
		expect(stored.key).toBe('security-proofs/u1/a.png');
	});

	it('a proof is fetched by key as a query parameter, since it contains slashes', async () => {
		fetchMock.mockResolvedValue(ok({ url: 'https://store.test/x', expires_in_seconds: 3600 }));
		const { securityApi } = await import('../../src/lib/api/security');
		await securityApi.proofUrl('security-proofs/u1/a.png');
		const url = String(fetchMock.mock.calls[0][0]);
		expect(url).toContain('/api/security/proofs');
		expect(url).toContain('key=security-proofs');
	});

	it('withdrawing too late is a 409, which is the system working', async () => {
		fetchMock.mockResolvedValue(fail(409, 'CONFLICT'));
		const { securityApi } = await import('../../src/lib/api/security');
		const { SkilluError } = await import('../../src/lib/api/client');
		await expect(securityApi.withdrawReport('f1')).rejects.toBeInstanceOf(SkilluError);
	});

	it('answering a round posts to the report it belongs to', async () => {
		fetchMock.mockResolvedValue(ok({ round_no: 2 }));
		const { securityApi } = await import('../../src/lib/api/security');
		await securityApi.answerRound('f1', 'here is the pcap');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/security/reports/f1/answer-round');
		expect(JSON.parse(init.body).answer_md).toBe('here is the pcap');
	});

	it('a report with nothing waiting on the reporter has no open round', async () => {
		fetchMock.mockResolvedValue(
			ok({ reports: [{ id: 'f1', status: 'confirmed', open_round: null }] })
		);
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.myReports();
		expect(res.data.reports[0].open_round).toBeNull();
	});
});

describe('practice', () => {
	it('a wrong flag is a 200 carrying what is left to try', async () => {
		fetchMock.mockResolvedValue(
			ok({
				outcome: {
					correct: false,
					attempt_no: 2,
					attempts_left_this_hour: 8,
					first_solve: false,
					fragments_awarded: 0,
					attestation_code: null,
					hint: 'look at the cookie flags'
				}
			})
		);
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.submitFlag('c1', 'skilluv{nope}');
		// Not an error: treating it as one throws away the hint and the count.
		expect(res.data.outcome.correct).toBe(false);
		expect(res.data.outcome.attempts_left_this_hour).toBe(8);
		expect(res.data.outcome.hint).toBe('look at the cookie flags');
	});

	it('a flag is sent as typed, not normalised', async () => {
		fetchMock.mockResolvedValue(ok({ outcome: { correct: true } }));
		const { securityApi } = await import('../../src/lib/api/security');
		await securityApi.submitFlag('c1', 'skilluv{MixedCase}');
		// Case-sensitive by convention: lower-casing would make a correct flag
		// read as wrong on a challenge whose planted flag differs only in case.
		expect(JSON.parse(fetchMock.mock.calls[0][1].body).flag).toBe('skilluv{MixedCase}');
	});

	it('a lab says which answers missed without saying what was right', async () => {
		fetchMock.mockResolvedValue(
			ok({
				outcome: {
					correct_count: 2,
					total_count: 3,
					score_percent: 66,
					passed: false,
					wrong_question_ids: ['q3'],
					hints: [],
					attempt_number: 1,
					attempts_left: 2,
					fragments_awarded: 0,
					attestation_code: null
				}
			})
		);
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.submitAnswers('c1', { q1: 'a', q2: 'b', q3: 'c' });
		expect(fetchMock.mock.calls[0][0]).toBe('/api/security/challenges/c1/answers');
		expect(res.data.outcome.wrong_question_ids).toEqual(['q3']);
		expect(res.data.outcome).not.toHaveProperty('correct_answers');
	});

	it('the scoreboard reads the all-time rows', async () => {
		fetchMock.mockResolvedValue(ok({ all_time: [{ username: 'ada', solves: 3, first_solves: 1 }] }));
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.scoreboard();
		expect(fetchMock.mock.calls[0][0]).toBe('/api/security/ctf/scoreboard');
		expect(res.data.all_time[0].first_solves).toBe(1);
	});
});

describe('reading what was found', () => {
	it('an unpublished finding has no title, and that is the embargo working', async () => {
		fetchMock.mockResolvedValue(
			ok({
				finding: {
					id: 'f1',
					title: null,
					status: 'confirmed',
					severity_tier: 'high',
					reporter: { alias: 'anonymous-ab12cd' }
				}
			})
		);
		const { securityApi, isPublished } = await import('../../src/lib/api/security');
		const res = await securityApi.findingCard('f1');
		expect(res.data.finding.title).toBeNull();
		expect(isPublished(res.data.finding)).toBe(false);
	});

	it('a published one carries its title and reads as published', async () => {
		const { isPublished } = await import('../../src/lib/api/security');
		expect(isPublished({ status: 'published' })).toBe(true);
		expect(isPublished({ status: 'fixed' })).toBe(false);
	});

	it('an anonymous reporter keeps a stable alias rather than disappearing', async () => {
		fetchMock.mockResolvedValue(
			ok({
				top_contributors: [{ reporter: { alias: 'anonymous-ab12cd' }, findings: 4, top_severity: 5 }],
				recent_findings: [],
				stats: { confirmed: 4, published: 0, fixed: 0, by_severity: null, reporters: 1 }
			})
		);
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.hallOfFame();
		const row = res.data.top_contributors[0];
		expect(row.reporter.username).toBeUndefined();
		expect(row.reporter.alias).toBe('anonymous-ab12cd');
		// They did the work; the row stays on the list.
		expect(row.findings).toBe(4);
	});

	it('top_severity is a rank, and is turned back into a word', async () => {
		const { severityFromRank } = await import('../../src/lib/api/security');
		expect(severityFromRank(5)).toBe('critical');
		expect(severityFromRank(1)).toBe('informational');
		// Not guessed on a value the mapping does not know.
		expect(severityFromRank(9)).toBeNull();
	});

	it('findings sort worst-first rather than alphabetically', async () => {
		const { bySeverity } = await import('../../src/lib/api/security');
		const sorted = bySeverity([
			{ severity_tier: 'low' },
			{ severity_tier: 'critical' },
			{ severity_tier: 'high' }
		]);
		// Alphabetically, `critical` sorts after `high` — which is how a triage
		// queue starts being worked in the wrong order.
		expect(sorted.map((f) => f.severity_tier)).toEqual(['critical', 'high', 'low']);
	});

	it('the trust summary reads the same stats block as the hall of fame', async () => {
		fetchMock.mockResolvedValue(
			ok({
				findings: { confirmed: 4, published: 2, fixed: 3, by_severity: null, reporters: 1 },
				scope: ['skill-uv.com'],
				documents: {},
				compliance: [{ framework: 'SOC 2', state: 'not_started' }],
				contacts: {},
				disclosure_programme: { safe_harbour: true, default_embargo_days: 90, triage_sla_days: 5, hall_of_fame: '/x' }
			})
		);
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.trustSummary();
		expect(fetchMock.mock.calls[0][0]).toBe('/api/trust/summary');
		expect(res.data.findings.confirmed).toBe(4);
		// A framework nobody has started is stated, not hidden.
		expect(res.data.compliance[0].state).toBe('not_started');
	});
});

describe('research mode', () => {
	it('a token is issued once and only its prefix comes back later', async () => {
		fetchMock.mockResolvedValue(
			ok({ token: 'skr_secret', details: { token_prefix: 'skr_sec' }, header: 'X-Security-Research', note: '' })
		);
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.issueResearchToken({ label: 'laptop' });
		expect(fetchMock.mock.calls[0][0]).toBe('/api/security/research-token');
		expect(res.data.token).toBe('skr_secret');
		expect(res.data.details.token_prefix).toBe('skr_sec');
	});

	it('revoking is a DELETE on the same path', async () => {
		fetchMock.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve({}) });
		const { securityApi } = await import('../../src/lib/api/security');
		await securityApi.revokeResearchToken();
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/security/research-token');
		expect(init.method).toBe('DELETE');
	});
});

describe('bounties elsewhere', () => {
	it('the listing ships the note saying we run none of them', async () => {
		fetchMock.mockResolvedValue(
			ok({ programmes: [], note: 'Curated, not endorsed. This platform does not run any of these.' })
		);
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.externalBounties({ paid_only: true });
		expect(String(fetchMock.mock.calls[0][0])).toContain('paid_only=true');
		expect(res.data.note).toContain('not endorsed');
	});

	it('a claim starts as waiting, because the claimant is not the check', async () => {
		fetchMock.mockResolvedValue(ok({ claim: { id: 'c1', state: 'waiting' } }));
		const { securityApi } = await import('../../src/lib/api/security');
		const res = await securityApi.claimBounty({
			platform: 'hackerone',
			organisation_name: 'Acme',
			report_url: 'https://hackerone.test/reports/1',
			claimed_severity: 'high',
			summary_md: 'IDOR on invoices'
		});
		expect(fetchMock.mock.calls[0][0]).toBe('/api/security/external-bounties/claims');
		expect(res.data.claim.state).toBe('waiting');
	});
});

describe('declared credentials', () => {
	it('verified and declared are split rather than sorted together', async () => {
		const { splitByVerification } = await import('../../src/lib/api/credentials');
		const split = splitByVerification([
			{ id: 'a', verified_at: '2026-01-01T00:00:00Z' },
			{ id: 'b', verified_at: null }
		] as never);
		// The value of the review is lost the moment the two look alike.
		expect(split.verified.map((c) => c.id)).toEqual(['a']);
		expect(split.declared.map((c) => c.id)).toEqual(['b']);
	});

	it('a declaration requires the public link the server requires', async () => {
		fetchMock.mockResolvedValue(ok({ credential: { id: 'c1', verified_at: null } }));
		const { credentialsApi } = await import('../../src/lib/api/credentials');
		await credentialsApi.declare({
			issuer: 'offsec',
			name: 'OSCP',
			evidence_url: 'https://example.test/verify/1',
			issued_on: '2026-01-01'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/users/me/credentials');
		expect(JSON.parse(init.body).evidence_url).toBe('https://example.test/verify/1');
	});
});

describe('a security profile has one client, not two', () => {
	it('and it is the sibling of the four other craft records', async () => {
		fetchMock.mockResolvedValue(ok({ username: 'ada' }));
		// `/users/{username}/security-profile` is read by `domainProfilesApi`,
		// next to code, quality, ops and leadership. A second client on
		// `securityApi` would be a second place for the shape to drift.
		const { domainProfilesApi } = await import('../../src/lib/api/domain_profiles');
		await domainProfilesApi.security('ada');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/ada/security-profile');

		const { securityApi } = await import('../../src/lib/api/security');
		expect('profile' in securityApi).toBe(false);
	});
});
