import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$env/dynamic/public', () => ({ env: {} }));

/**
 * The working half of the Skilluv Design programme: the critique loop, the
 * large-file upload, the cloud tools, the curated briefs, the ranked
 * suggestions, the plagiarism cases and a mission once it is running.
 *
 * What these tests are actually holding in place is the set of backend
 * decisions the UI is not allowed to quietly reverse:
 *
 * - every design read is wrapped in a named key (`rounds`, `checks`,
 *   `comparison`, `stories`, `suggestions`), never returned bare;
 * - part uploads go to the object store with no Skilluv credentials attached;
 * - an unreadable ETag is a bucket misconfiguration and says so, rather than
 *   surfacing as a mystery failure after gigabytes have moved;
 * - a ceiling is checked before anything moves;
 * - the NDA hash that comes back is the hash of the document that was shown.
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

/** A presigned PUT answer from the object store, with the ETag exposed. */
function storeAccepted(etag = '"abc123"') {
	return {
		ok: true,
		status: 200,
		headers: new Headers({ ETag: etag }),
		json: () => Promise.resolve({})
	};
}

/** The same, from a bucket that never exposed `ETag` to the browser. */
function storeAcceptedWithoutEtag() {
	return {
		ok: true,
		status: 200,
		headers: new Headers({}),
		json: () => Promise.resolve({})
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

describe('the critique trail', () => {
	it('reads the rounds out of the key the backend wraps them in', async () => {
		fetchMock.mockResolvedValue(
			ok({ rounds: [{ round: 1, decision: 'iterate', decided_at: '2026-08-01T00:00:00Z' }] })
		);
		const { designApi } = await import('../../src/lib/api/design');
		const res = await designApi.reviewHistory('s1');
		expect(res.data.rounds[0].decision).toBe('iterate');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/design/slices/s1/reviews');
	});

	it('compare passes the round pair as query parameters', async () => {
		fetchMock.mockResolvedValue(ok({ comparison: { slice_id: 's1', critiques_between: [] } }));
		const { designApi } = await import('../../src/lib/api/design');
		await designApi.compare('s1', 1, 3);
		const url = String(fetchMock.mock.calls[0][0]);
		expect(url).toContain('/api/design/slices/s1/compare');
		expect(url).toContain('from=1');
		expect(url).toContain('to=3');
	});

	it('a single round is addressed by its number, not by a query', async () => {
		fetchMock.mockResolvedValue(ok({ version: { round: 2, decision: 'approve' } }));
		const { designApi } = await import('../../src/lib/api/design');
		const res = await designApi.versionAt('s1', 2);
		expect(fetchMock.mock.calls[0][0]).toBe('/api/design/slices/s1/versions/2');
		expect(res.data.version.round).toBe(2);
	});

	it('auto-checks come back per round and carry a severity', async () => {
		fetchMock.mockResolvedValue(
			ok({
				checks: [
					{
						round: 1,
						check_type: 'contrast',
						severity: 'error',
						message: 'ratio below 4.5',
						details: null,
						ran_at: '2026-08-01T00:00:00Z'
					}
				]
			})
		);
		const { designApi } = await import('../../src/lib/api/design');
		const res = await designApi.autoChecks('s1');
		expect(res.data.checks[0].severity).toBe('error');
	});

	it('iteration stories are addressed by an encoded username', async () => {
		fetchMock.mockResolvedValue(ok({ stories: [] }));
		const { designApi } = await import('../../src/lib/api/design');
		await designApi.iterationStories('ada lovelace', 4);
		const url = String(fetchMock.mock.calls[0][0]);
		expect(url).toContain('/api/design/users/ada%20lovelace/iteration-stories');
		expect(url).toContain('limit=4');
	});
});

describe('ranked suggestions', () => {
	it('carry the cache flag through rather than swallowing it', async () => {
		fetchMock.mockResolvedValue(ok({ suggestions: [{ id: 'c1', reasons: ['x'] }], cached: true }));
		const { nextChallenges } = await import('../../src/lib/api/design');
		const res = await nextChallenges({ domain: 'design' });
		expect(res.data.cached).toBe(true);
		expect(res.data.suggestions[0].reasons).toEqual(['x']);
	});

	it('designSuggestions asks for the design domain explicitly', async () => {
		fetchMock.mockResolvedValue(ok({ suggestions: [], cached: false }));
		const { designSuggestions } = await import('../../src/lib/api/design');
		await designSuggestions(3);
		const url = String(fetchMock.mock.calls[0][0]);
		expect(url).toContain('/api/users/me/next-challenges');
		expect(url).toContain('domain=design');
		expect(url).toContain('limit=3');
	});

	it('an empty payload yields an empty list rather than throwing', async () => {
		fetchMock.mockResolvedValue(ok({}));
		const { designSuggestions } = await import('../../src/lib/api/design');
		await expect(designSuggestions()).resolves.toEqual([]);
	});
});

describe('curated briefs', () => {
	it('a proposal is posted whole and comes back pending', async () => {
		fetchMock.mockResolvedValue(ok({ proposal: { id: 'b1', status: 'pending' } }, 201));
		const { designBriefsApi } = await import('../../src/lib/api/design_briefs');
		const res = await designBriefsApi.propose({
			title: 'A mark for a co-op',
			brief_md: 'the ask',
			orientation_slug: 'brand-identity',
			design_subtype: 'brand_kit',
			difficulty: 3,
			expected_rounds: 3,
			format: 'individual'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/design/briefs');
		expect(JSON.parse(init.body).design_subtype).toBe('brand_kit');
		expect(res.data.proposal.status).toBe('pending');
	});

	it('withdrawing is a POST on the proposal, not a delete', async () => {
		fetchMock.mockResolvedValue(ok({ proposal: { id: 'b1', status: 'withdrawn' } }));
		const { designBriefsApi } = await import('../../src/lib/api/design_briefs');
		await designBriefsApi.withdraw('b1');
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/design/briefs/b1/withdraw');
		expect(init.method).toBe('POST');
	});
});

describe('cloud design tools', () => {
	it('inspect is a plain query and needs no session', async () => {
		fetchMock.mockResolvedValue(ok({ source: null, warning: 'unknown link' }));
		const { designCloudApi } = await import('../../src/lib/api/design_cloud');
		const res = await designCloudApi.inspect('https://example.test/a');
		expect(String(fetchMock.mock.calls[0][0])).toContain('/api/design/cloud/inspect');
		expect(res.data.warning).toBe('unknown link');
	});

	it('a deployment with no credentials surfaces the 503 instead of hiding it', async () => {
		fetchMock.mockResolvedValue(fail(503, 'NOT_CONFIGURED', 'FIGMA_CLIENT_SECRET is unset'));
		const { designCloudApi } = await import('../../src/lib/api/design_cloud');
		const { SkilluError } = await import('../../src/lib/api/client');
		await expect(designCloudApi.start('figma')).rejects.toBeInstanceOf(SkilluError);
	});

	it('a provider is path-encoded', async () => {
		fetchMock.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve({}) });
		const { designCloudApi } = await import('../../src/lib/api/design_cloud');
		await designCloudApi.disconnect('web flow');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/design/cloud/web%20flow/disconnect');
	});
});

describe('large uploads', () => {
	it('refuses a file over the subtype ceiling before anything moves', async () => {
		const { uploadDesignFile } = await import('../../src/lib/api/design_uploads');
		// A copy deck is capped at 100 MiB; this is a hair over.
		const file = new File(['x'], 'deck.pdf');
		Object.defineProperty(file, 'size', { value: 101 * 1024 * 1024 });
		await expect(
			uploadDesignFile(file, { design_subtype: 'copy_deck' })
		).rejects.toBeInstanceOf(RangeError);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('an unknown subtype is not refused client-side, since the server checks too', async () => {
		const { maxBytesFor } = await import('../../src/lib/api/design_uploads');
		expect(maxBytesFor('something_new_server_side')).toBeNull();
	});

	it('knows which subtypes have to arrive with a preview', async () => {
		const { requiresPreview } = await import('../../src/lib/api/design_uploads');
		expect(requiresPreview('three_d_scene')).toBe(true);
		expect(requiresPreview('sound')).toBe(true);
		expect(requiresPreview('icon_set')).toBe(false);
	});

	it('parts go to the store with no Skilluv credentials attached', async () => {
		const { uploadParts } = await import('../../src/lib/api/design_uploads');
		fetchMock.mockResolvedValue(storeAccepted());
		const blob = new Blob([new Uint8Array(32)]);
		await uploadParts(blob, [{ part_number: 1, url: 'https://store.test/p1', bytes: 32 }], 32);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://store.test/p1');
		expect(init.method).toBe('PUT');
		// Sending the session cookie or the CSRF header to a third-party bucket
		// would leak both somewhere they have no business being.
		expect(init.credentials).toBe('omit');
	});

	it('keeps the ETag exactly as the store wrote it, quotes and all', async () => {
		const { uploadParts } = await import('../../src/lib/api/design_uploads');
		fetchMock.mockResolvedValue(storeAccepted('"deadbeef"'));
		const blob = new Blob([new Uint8Array(16)]);
		const parts = await uploadParts(
			blob,
			[{ part_number: 1, url: 'https://store.test/p1', bytes: 16 }],
			16
		);
		expect(parts).toEqual([{ part_number: 1, etag: '"deadbeef"' }]);
	});

	it('names a bucket that never exposed its ETag, rather than failing obscurely', async () => {
		const { uploadParts, MissingEtagError } = await import('../../src/lib/api/design_uploads');
		fetchMock.mockResolvedValue(storeAcceptedWithoutEtag());
		const blob = new Blob([new Uint8Array(16)]);
		await expect(
			uploadParts(blob, [{ part_number: 1, url: 'https://store.test/p1', bytes: 16 }], 16)
		).rejects.toBeInstanceOf(MissingEtagError);
	});

	it('a part already held is skipped rather than re-uploaded', async () => {
		const { uploadParts } = await import('../../src/lib/api/design_uploads');
		fetchMock.mockResolvedValue(storeAccepted('"second"'));
		const blob = new Blob([new Uint8Array(32)]);
		const known = new Map([[1, '"first"']]);
		const parts = await uploadParts(
			blob,
			[
				{ part_number: 1, url: 'https://store.test/p1', bytes: 16 },
				{ part_number: 2, url: 'https://store.test/p2', bytes: 16 }
			],
			16,
			{ known }
		);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(parts).toEqual([
			{ part_number: 1, etag: '"first"' },
			{ part_number: 2, etag: '"second"' }
		]);
	});

	it('progress is reported per part, which is the only honest signal available', async () => {
		const { uploadParts } = await import('../../src/lib/api/design_uploads');
		fetchMock.mockResolvedValue(storeAccepted());
		const blob = new Blob([new Uint8Array(32)]);
		const seen: number[] = [];
		await uploadParts(
			blob,
			[
				{ part_number: 1, url: 'https://store.test/p1', bytes: 16 },
				{ part_number: 2, url: 'https://store.test/p2', bytes: 16 }
			],
			16,
			{ onProgress: (p) => seen.push(p.partsDone) }
		);
		expect(seen).toEqual([1, 2]);
	});

	it('resuming asks only for the range still missing an ETag', async () => {
		const { resumeParts } = await import('../../src/lib/api/design_uploads');
		fetchMock.mockResolvedValue(
			ok({
				parts: [
					{ part_number: 2, url: 'https://store.test/p2', bytes: 16 },
					{ part_number: 3, url: 'https://store.test/p3', bytes: 16 }
				]
			})
		);
		const known = new Map([[1, '"first"']]);
		const missing = await resumeParts('u1', 3, known);
		const url = String(fetchMock.mock.calls[0][0]);
		expect(url).toContain('/api/design/uploads/u1/parts');
		expect(url).toContain('from=2');
		expect(url).toContain('to=3');
		expect(missing.map((p) => p.part_number)).toEqual([2, 3]);
	});

	it('resuming a finished upload costs no request at all', async () => {
		const { resumeParts } = await import('../../src/lib/api/design_uploads');
		const known = new Map([
			[1, '"a"'],
			[2, '"b"']
		]);
		await expect(resumeParts('u1', 2, known)).resolves.toEqual([]);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('a download link is asked for with the ttl the caller wants', async () => {
		const { designUploadsApi } = await import('../../src/lib/api/design_uploads');
		fetchMock.mockResolvedValue(ok({ url: 'https://store.test/get', expires_in: 3600 }));
		await designUploadsApi.downloadUrl('u1', 120);
		expect(String(fetchMock.mock.calls[0][0])).toContain('ttl_seconds=120');
	});
});

describe('external portfolio declarations', () => {
	it('a platform URL is built from its own pattern, never guessed', async () => {
		const { profileUrlFor } = await import('../../src/lib/api/portfolios');
		const platform = {
			slug: 'docker_hub',
			skill_domain: 'ops',
			name: 'Docker Hub',
			profile_url_pattern: 'https://hub.docker.com/u/{handle}',
			items_label: null,
			reach_label: null,
			has_public_api: true
		};
		expect(profileUrlFor(platform, '@ada')).toBe('https://hub.docker.com/u/ada');
		expect(profileUrlFor({ ...platform, profile_url_pattern: null }, 'ada')).toBeNull();
		expect(profileUrlFor(platform, '   ')).toBeNull();
	});

	it('the platform listing is narrowed by domain', async () => {
		const { portfoliosApi } = await import('../../src/lib/api/portfolios');
		fetchMock.mockResolvedValue(ok([]));
		await portfoliosApi.platforms('ops');
		expect(String(fetchMock.mock.calls[0][0])).toContain('domain=ops');
	});
});

describe('plagiarism cases on contest entries', () => {
	it('a case is raised against a submission and carries its evidence link', async () => {
		fetchMock.mockResolvedValue(ok({ id: 'c1', status: 'open' }, 201));
		const { contestPlagiarismApi } = await import('../../src/lib/api/contest_plagiarism');
		await contestPlagiarismApi.flag('s1', {
			reason_md: 'this is the same mark',
			evidence_url: 'https://example.test/original'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/contests/submissions/s1/flag');
		expect(JSON.parse(init.body).evidence_url).toBe('https://example.test/original');
	});

	it('the response window is read off the case, not tracked locally', async () => {
		const { respondWindowClosed } = await import('../../src/lib/api/contest_plagiarism');
		const entry = { respond_by: '2026-08-20T00:00:00Z' } as never;
		expect(respondWindowClosed(entry, new Date('2026-08-19T00:00:00Z'))).toBe(false);
		expect(respondWindowClosed(entry, new Date('2026-08-21T00:00:00Z'))).toBe(true);
	});
});

describe('a mission once it is running', () => {
	it('the agreement is fetched for a locale', async () => {
		fetchMock.mockResolvedValue(ok({ agreement: { sha256: 'abc', is_reviewed: false } }));
		const { missionsApi } = await import('../../src/lib/api/missions');
		await missionsApi.nda('brand-refresh', 'fr');
		const url = String(fetchMock.mock.calls[0][0]);
		expect(url).toContain('/api/missions/brand-refresh/nda');
		expect(url).toContain('locale=fr');
	});

	it('signing sends back the hash of the document that was shown', async () => {
		fetchMock.mockResolvedValue(ok({ signature: { id: 'sig1' } }));
		const { missionsApi } = await import('../../src/lib/api/missions');
		await missionsApi.signNda('brand-refresh', {
			typed_name: 'Ada Lovelace',
			document_sha256: 'abc',
			locale: 'fr'
		});
		expect(JSON.parse(fetchMock.mock.calls[0][1].body).document_sha256).toBe('abc');
	});

	it('a changed agreement is a 409, not a silent signature', async () => {
		fetchMock.mockResolvedValue(fail(409, 'CONFLICT'));
		const { missionsApi } = await import('../../src/lib/api/missions');
		const { SkilluError } = await import('../../src/lib/api/client');
		await expect(
			missionsApi.signNda('brand-refresh', { typed_name: 'Ada', document_sha256: 'stale' })
		).rejects.toBeInstanceOf(SkilluError);
	});

	it('rounds come back under `rounds`, and several of them is the normal case', async () => {
		fetchMock.mockResolvedValue(
			ok({
				rounds: [
					{ id: 'd1', round: 1, decision: 'changes_requested' },
					{ id: 'd2', round: 2, decision: null }
				]
			})
		);
		const { missionsApi, pendingRound } = await import('../../src/lib/api/missions');
		const res = await missionsApi.deliveries('brand-refresh');
		expect(res.data.rounds).toHaveLength(2);
		expect(pendingRound(res.data.rounds)?.round).toBe(2);
	});

	it('with every round decided there is nothing waiting', async () => {
		const { pendingRound } = await import('../../src/lib/api/missions');
		expect(pendingRound([{ decision: 'accepted' } as never])).toBeNull();
	});

	it('asking for changes posts the reason to its own endpoint', async () => {
		fetchMock.mockResolvedValue(ok({ delivery: { id: 'd2' } }));
		const { missionsApi } = await import('../../src/lib/api/missions');
		await missionsApi.requestChanges('brand-refresh', { reason: 'the grid drifts on mobile' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/missions/brand-refresh/deliveries/request-changes');
		expect(JSON.parse(init.body).reason).toBe('the grid drifts on mobile');
	});

	it('an empty rating list is the blind state, and callers get it verbatim', async () => {
		fetchMock.mockResolvedValue(ok({ ratings: [] }));
		const { missionsApi } = await import('../../src/lib/api/missions');
		const res = await missionsApi.ratings('brand-refresh');
		expect(res.data.ratings).toEqual([]);
	});

	it('a standing is addressed by an encoded username', async () => {
		fetchMock.mockResolvedValue(ok({ standing: { received: 0, average: null } }));
		const { missionsApi } = await import('../../src/lib/api/missions');
		const res = await missionsApi.standing('ada lovelace');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/users/ada%20lovelace/mission-standing');
		// Null rather than zero: an unrated person is not a badly rated one.
		expect(res.data.standing.average).toBeNull();
	});

	it('a decision is addressed by application id, not by mission', async () => {
		fetchMock.mockResolvedValue(ok({ application: { id: 'a1', status: 'rejected' } }));
		const { missionsApi } = await import('../../src/lib/api/missions');
		await missionsApi.decide('a1', { status: 'rejected', reason: 'brief mismatch' });
		expect(fetchMock.mock.calls[0][0]).toBe('/api/mission-applications/a1/decision');
	});

	it('an invoice checkout is addressed by invoice id', async () => {
		fetchMock.mockResolvedValue(ok({ checkout_url: 'https://pay.test/x' }));
		const { missionsApi } = await import('../../src/lib/api/missions');
		const res = await missionsApi.checkoutInvoice('i1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/mission-invoices/i1/checkout');
		expect(res.data.checkout_url).toBe('https://pay.test/x');
	});
});

describe('design slices are told apart from code slices', () => {
	it('by slice_type, which decides which workflow a page offers', async () => {
		const { isDesignSlice, DESIGN_SLICE_TYPE } = await import('../../src/lib/api/slices');
		expect(DESIGN_SLICE_TYPE).toBe('design_artifact');
		expect(isDesignSlice({ slice_type: 'design_artifact' })).toBe(true);
		expect(isDesignSlice({ slice_type: 'github_issue' })).toBe(false);
		// A slice serialised without the field is not a design slice: guessing
		// would put a Figma field on a GitHub issue.
		expect(isDesignSlice({})).toBe(false);
	});
});

describe('the subtype ceilings mirror the server table', () => {
	it('and the three enormous ones are the ones the backend calls enormous', async () => {
		const { DESIGN_SUBTYPE_MAX_BYTES } = await import('../../src/lib/types');
		const GB = 1024 * 1024 * 1024;
		expect(DESIGN_SUBTYPE_MAX_BYTES.video).toBe(5 * GB);
		expect(DESIGN_SUBTYPE_MAX_BYTES.three_d_scene).toBe(5 * GB);
		expect(DESIGN_SUBTYPE_MAX_BYTES.motion).toBe(2 * GB);
		expect(DESIGN_SUBTYPE_MAX_BYTES.copy_deck).toBe(100 * 1024 * 1024);
	});

	it('every subtype in the list has a ceiling', async () => {
		const { DESIGN_SUBTYPES, DESIGN_SUBTYPE_MAX_BYTES } = await import('../../src/lib/types');
		for (const subtype of DESIGN_SUBTYPES) {
			expect(DESIGN_SUBTYPE_MAX_BYTES[subtype]).toBeGreaterThan(0);
		}
	});
});

describe('mentor matching', () => {
	it('is one endpoint per domain path, with a limit', async () => {
		fetchMock.mockResolvedValue(ok({ mentors: [], suggested: false }));
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		await domainProfileApi.mentorMatches('design', 3);
		const url = String(fetchMock.mock.calls[0][0]);
		expect(url).toContain('/api/domains/design/mentors/for-me');
		expect(url).toContain('limit=3');
	});

	it('carries the reasoning attached to each match', async () => {
		fetchMock.mockResolvedValue(
			ok({
				mentors: [
					{
						mentor_user_id: 'm1',
						username: 'ada',
						headline: 'type and grids',
						craft_score: 700,
						score: 42,
						shared_families: ['brand'],
						shared_tools: ['figma'],
						timezone_gap_hours: null,
						active_mentees: 2,
						because: ['same family', 'same tool']
					}
				],
				suggested: true
			})
		);
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		const res = await domainProfileApi.mentorMatches('design');
		expect(res.data.mentors[0].because).toEqual(['same family', 'same tool']);
		// Null rather than zero: "we did not know" and "the same timezone" are
		// different answers and only one of them is good news.
		expect(res.data.mentors[0].timezone_gap_hours).toBeNull();
		expect(res.data.suggested).toBe(true);
	});

	it('a domain with no mentorship rules is a refusal, not an empty list', async () => {
		fetchMock.mockResolvedValue(fail(400, 'VALIDATION', 'no mentorship rules for domain `x`'));
		const { domainProfileApi } = await import('../../src/lib/api/domain_profile');
		const { SkilluError } = await import('../../src/lib/api/client');
		await expect(
			domainProfileApi.mentorMatches('design')
		).rejects.toBeInstanceOf(SkilluError);
	});
});

describe('the visual half of an issued attestation', () => {
	it('addresses the card and the certificate by verification code', async () => {
		const { attestationApi } = await import('../../src/lib/api/attestation');
		expect(attestationApi.issuedCardUrl('ABC123DEF456')).toBe(
			'/api/attestations/verify/ABC123DEF456/card.png'
		);
		expect(attestationApi.issuedCertificateUrl('ABC123DEF456')).toBe(
			'/api/attestations/verify/ABC123DEF456/certificate.svg'
		);
	});

	it('encodes a code rather than interpolating it raw', async () => {
		const { attestationApi } = await import('../../src/lib/api/attestation');
		expect(attestationApi.issuedCardUrl('a/b')).toContain('a%2Fb');
	});
});

describe('the annual awards', () => {
	it('an edition is addressed by the year the work happened in', async () => {
		fetchMock.mockResolvedValue(ok({ edition: { year: 2026, status: 'voting' }, nominees: [] }));
		const { awardsApi } = await import('../../src/lib/api/awards');
		const res = await awardsApi.edition(2026);
		expect(fetchMock.mock.calls[0][0]).toBe('/api/awards/2026');
		expect(res.data.edition.year).toBe(2026);
	});

	it('the jury ballot is a query flag, and separate from the community one', async () => {
		fetchMock.mockResolvedValue(ok({ recorded: true, ballot: 'jury' }));
		const { awardsApi } = await import('../../src/lib/api/awards');
		await awardsApi.vote('n1', true);
		expect(fetchMock.mock.calls[0][0]).toBe('/api/awards/nominees/n1/vote?jury=true');

		fetchMock.mockClear();
		await awardsApi.vote('n1');
		// A juror holds both ballots; casting one must not spend the other, so
		// the community call carries no flag at all.
		expect(fetchMock.mock.calls[0][0]).toBe('/api/awards/nominees/n1/vote');
	});

	it('a nomination carries the citation, which is the whole nomination', async () => {
		fetchMock.mockResolvedValue(ok({ nominee_id: 'n1' }));
		const { awardsApi } = await import('../../src/lib/api/awards');
		await awardsApi.nominate(2026, {
			category_slug: 'brand-of-the-year',
			subject_id: 'd1',
			citation: 'it changed how the co-op reads'
		});
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/awards/2026/nominations');
		expect(JSON.parse(init.body).citation).toBe('it changed how the co-op reads');
	});

	it('the shortlist is posted as a list of ids', async () => {
		fetchMock.mockResolvedValue(ok({ shortlisted: 2 }));
		const { awardsApi } = await import('../../src/lib/api/awards');
		await awardsApi.shortlist(['n1', 'n2']);
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ nominee_ids: ['n1', 'n2'] });
	});

	it('nominees group by category, best weighted score first', async () => {
		const { groupByCategory } = await import('../../src/lib/api/awards');
		const grouped = groupByCategory([
			{ id: 'a', category_slug: 'brand', weighted_score: '4.0' },
			{ id: 'b', category_slug: 'brand', weighted_score: '9.5' },
			{ id: 'c', category_slug: 'motion', weighted_score: '1.0' }
		] as never);
		expect(grouped.get('brand')?.map((n) => n.id)).toEqual(['b', 'a']);
		expect(grouped.get('motion')).toHaveLength(1);
	});

	it('only one action is offered, and only in the phase that accepts it', async () => {
		const { currentAction } = await import('../../src/lib/api/awards');
		expect(currentAction({ status: 'nominations' } as never)).toBe('nominate');
		expect(currentAction({ status: 'voting' } as never)).toBe('vote');
		// Neither is public and neither moves: offering a button in either
		// state would be offering an error.
		expect(currentAction({ status: 'draft' } as never)).toBeNull();
		expect(currentAction({ status: 'concluded' } as never)).toBeNull();
	});
});
