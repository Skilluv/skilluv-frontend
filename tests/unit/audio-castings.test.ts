import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Voice castings — the audio domain's hiring loop, which the front had no
 * page for at all.
 *
 * The invariant worth pinning is the blind: while a casting is blind and
 * undecided the identities never leave the backend handler, so there is no
 * client-side hiding to get wrong and no payload field a curious reader could
 * dig a name out of.
 */

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
	};
}

function fail(status: number, code: string) {
	return {
		ok: false,
		status,
		json: () =>
			Promise.resolve({
				error: { code, message: 'nope' },
				meta: { request_id: 'r', timestamp: '2026-08-27' }
			})
	};
}

const blindDetail = {
	casting: {
		id: 'c1',
		slice_id: 's1',
		character_brief_md: '# Le gardien\nGrave, lent, jamais pressé.',
		sample_line_text: 'On ne passe pas.',
		target_language: 'fr-BE',
		max_audition_seconds: 90,
		is_blind: true,
		audition_deadline: '2027-01-01T00:00:00Z',
		status: 'open'
	},
	blind: true,
	auditions: [
		{ id: 'a1', voice: 'voix 1', notes_md: null, duration_ms: 41000, submitted_at: '2026-08-01T00:00:00Z' },
		{ id: 'a2', voice: 'voix 2', notes_md: 'plus bas', duration_ms: 38000, submitted_at: '2026-08-02T00:00:00Z' }
	]
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

describe('audioCastingsApi', () => {
	it('filters castings by an exact BCP-47 tag', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { audioCastingsApi } = await import('../../src/lib/api/audio');
		await audioCastingsApi.list('fr-BE');
		const url = fetchMock.mock.calls[0][0] as string;
		// `fr` must not answer for `fr-BE`: an accent is part of the brief in
		// this trade, so the tag is passed through untouched.
		expect(new URLSearchParams(url.split('?')[1]).get('language')).toBe('fr-BE');
	});

	it('omits the filter entirely when no language is asked for', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { audioCastingsApi } = await import('../../src/lib/api/audio');
		await audioCastingsApi.list();
		expect(fetchMock.mock.calls[0][0]).toBe('/api/audio/castings');
	});

	it('a blind casting carries numbers, and no name anywhere in the payload', async () => {
		fetchMock.mockResolvedValue(ok(blindDetail));
		const { audioCastingsApi } = await import('../../src/lib/api/audio');
		const res = await audioCastingsApi.get('c1');

		expect(res.data.blind).toBe(true);
		expect(res.data.auditions.map((a) => a.voice)).toEqual(['voix 1', 'voix 2']);
		// Nothing to un-hide client-side: the take has an id, a length, notes
		// and a date, and that is all it was sent.
		expect(Object.keys(res.data.auditions[0]).sort()).toEqual(
			['duration_ms', 'id', 'notes_md', 'submitted_at', 'voice'].sort()
		);
	});

	it('once a voice is chosen the names come back', async () => {
		fetchMock.mockResolvedValue(
			ok({
				...blindDetail,
				casting: { ...blindDetail.casting, status: 'selected' },
				blind: false,
				auditions: [{ ...blindDetail.auditions[0], voice: 'ada' }]
			})
		);
		const { audioCastingsApi } = await import('../../src/lib/api/audio');
		const res = await audioCastingsApi.get('c1');
		// Selecting lifts the blind: everybody who auditioned deserves to know
		// who got it.
		expect(res.data.blind).toBe(false);
		expect(res.data.auditions[0].voice).toBe('ada');
	});

	it('an audition posts what there is to listen to', async () => {
		fetchMock.mockResolvedValue(ok({ id: 'a9' }));
		const { audioCastingsApi } = await import('../../src/lib/api/audio');
		await audioCastingsApi.audition('c1', {
			audition_url: 'https://example.test/take.wav',
			notes_md: 'deuxième essai'
		});
		expect(fetchMock.mock.calls[0][0]).toBe('/api/audio/castings/c1/auditions');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			audition_url: 'https://example.test/take.wav',
			notes_md: 'deuxième essai'
		});
	});

	it('choosing names the submission, and a 403 is how you learn it was not yours', async () => {
		fetchMock.mockResolvedValueOnce(ok({ selected: true }));
		const { audioCastingsApi } = await import('../../src/lib/api/audio');
		await audioCastingsApi.select('c1', 'a2');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/audio/castings/c1/select');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ submission_id: 'a2' });

		fetchMock.mockResolvedValue(fail(403, 'FORBIDDEN'));
		await expect(audioCastingsApi.select('c1', 'a2')).rejects.toMatchObject({ status: 403 });
	});

	it('listening is a signed URL with a life span, never a stable link', async () => {
		fetchMock.mockResolvedValue(ok({ url: 'https://storage.test/x?sig=1', expires_in_seconds: 300 }));
		const { audioCastingsApi } = await import('../../src/lib/api/audio');
		const res = await audioCastingsApi.listen('f1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/audio/files/f1/listen');
		// Unreleased work for a paying client is the normal case here, so a URL
		// that outlives its request would outlive the embargo.
		expect(res.data.expires_in_seconds).toBeGreaterThan(0);
	});
});

describe('the casting contract', () => {
	it('mirrors the four statuses and the server-side defaults', async () => {
		const { CASTING_STATUSES, CASTING_DEFAULT_MAX_SECONDS, CASTING_BRIEF_MAX } = await import(
			'../../src/lib/types/audio'
		);
		expect([...CASTING_STATUSES]).toEqual(['open', 'reviewing', 'selected', 'cancelled']);
		expect(CASTING_DEFAULT_MAX_SECONDS).toBe(90);
		expect(CASTING_BRIEF_MAX).toBe(8000);
	});
});
