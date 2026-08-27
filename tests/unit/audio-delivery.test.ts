import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * The audio delivery: the files, what was measured on them, and the source
 * declaration the attestation generators read.
 *
 * Two invariants carry the whole surface and are pinned here. Measurements are
 * measured and never declared, so absent must stay absent rather than becoming
 * zero. And the completeness of the source list is a *statement*, not a row
 * count — a wholly original track has no sources and is not undeclared.
 */

function ok(data: unknown) {
	return {
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data, meta: { request_id: 'r', timestamp: '2026-08-27' } })
	};
}

const unmeasured = {
	id: 'f1',
	role: 'master',
	original_filename: 'theme.wav',
	byte_size: 48_000_000,
	container: 'wav',
	duration_ms: null,
	sample_rate_hz: null,
	bit_depth: null,
	channels: null,
	loudness_lufs: null,
	true_peak_dbfs: null,
	loudness_range_lu: null,
	analysis_status: 'pending',
	analysis_error: null,
	waveform_peaks: null
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

describe('audioDeliveryApi — files', () => {
	it('reads the files of one delivery', async () => {
		fetchMock.mockResolvedValue(ok([unmeasured]));
		const { audioDeliveryApi } = await import('../../src/lib/api/audio');
		const res = await audioDeliveryApi.files('s1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/audio/slices/s1/files');
		expect(res.data[0].container).toBe('wav');
	});

	it('an unmeasured file keeps its nulls — not measured is not zero', async () => {
		fetchMock.mockResolvedValue(ok([unmeasured]));
		const { audioDeliveryApi } = await import('../../src/lib/api/audio');
		const res = await audioDeliveryApi.files('s1');
		const file = res.data[0];
		// A meter drawing 0 LUFS for "unknown" is a meter a reviewer grades on.
		expect(file.loudness_lufs).toBeNull();
		expect(file.true_peak_dbfs).toBeNull();
		expect(file.analysis_status).toBe('pending');
	});

	it('a measured file carries numbers, not decimal strings', async () => {
		fetchMock.mockResolvedValue(
			ok([{ ...unmeasured, loudness_lufs: -14.2, true_peak_dbfs: -1.1, analysis_status: 'done' }])
		);
		const { audioDeliveryApi } = await import('../../src/lib/api/audio');
		const res = await audioDeliveryApi.files('s1');
		// The handler casts to FLOAT8 precisely so a client does not have to
		// parse a string to draw a meter and get it wrong once.
		expect(typeof res.data[0].loudness_lufs).toBe('number');
		expect(res.data[0].loudness_lufs).toBeCloseTo(-14.2);
	});

	it('an upload is multipart, with the role as its own part', async () => {
		fetchMock.mockResolvedValue(ok({ id: 'f9', analysis: 'pending' }));
		const { audioDeliveryApi } = await import('../../src/lib/api/audio');
		const file = new File(['x'], 'stem.wav', { type: 'audio/wav' });
		await audioDeliveryApi.upload('s1', file, 'stem');

		expect(fetchMock.mock.calls[0][0]).toBe('/api/audio/slices/s1/files');
		const body = fetchMock.mock.calls[0][1].body as FormData;
		expect(body).toBeInstanceOf(FormData);
		expect(body.get('role')).toBe('stem');
		expect((body.get('file') as File).name).toBe('stem.wav');
		// No Content-Type of ours: the browser has to set the boundary.
		expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
	});

	it('listening is a signed URL with a life span', async () => {
		fetchMock.mockResolvedValue(ok({ url: 'https://storage.test/f1?sig=x', expires_in_seconds: 300 }));
		const { audioCastingsApi } = await import('../../src/lib/api/audio');
		const res = await audioCastingsApi.listen('f1');
		expect(res.data.expires_in_seconds).toBeGreaterThan(0);
	});
});

describe('audioDeliveryApi — sources', () => {
	it('an empty list with no statement is undeclared, not original', async () => {
		fetchMock.mockResolvedValue(ok({ sources: [], declared_complete_at: null }));
		const { audioDeliveryApi } = await import('../../src/lib/api/audio');
		const res = await audioDeliveryApi.sources('s1');
		expect(res.data.sources).toEqual([]);
		// The difference the backend is careful about, and the one the panel
		// renders as a warning rather than a clean bill.
		expect(res.data.declared_complete_at).toBeNull();
	});

	it('an empty list with a statement is a wholly original piece', async () => {
		fetchMock.mockResolvedValue(
			ok({ sources: [], declared_complete_at: '2026-08-01T00:00:00Z' })
		);
		const { audioDeliveryApi } = await import('../../src/lib/api/audio');
		const res = await audioDeliveryApi.sources('s1');
		expect(res.data.declared_complete_at).not.toBeNull();
	});

	it('declaring a source posts what a reader can check', async () => {
		fetchMock.mockResolvedValue(ok({ id: 'src1' }));
		const { audioDeliveryApi } = await import('../../src/lib/api/audio');
		await audioDeliveryApi.declareSource('s1', {
			kind: 'creative_commons',
			source_name: 'Freesound 12345',
			source_url: 'https://freesound.org/s/12345',
			licence_identifier: 'CC-BY-4.0',
			attribution_text: 'Sound by someone (CC BY 4.0)'
		});
		expect(fetchMock.mock.calls[0][0]).toBe('/api/audio/slices/s1/sources');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
			kind: 'creative_commons',
			licence_identifier: 'CC-BY-4.0'
		});
	});

	it('completing the list is its own statement', async () => {
		fetchMock.mockResolvedValue(ok({ declared: true }));
		const { audioDeliveryApi } = await import('../../src/lib/api/audio');
		await audioDeliveryApi.completeSources('s1');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/audio/slices/s1/sources/complete');
		expect(fetchMock.mock.calls[0][1].method).toBe('POST');
	});

	it('mirrors the six ways a source is come by', async () => {
		const { AUDIO_SOURCE_KINDS } = await import('../../src/lib/types/audio');
		expect([...AUDIO_SOURCE_KINDS]).toEqual([
			'original',
			'public_domain',
			'creative_commons',
			'royalty_free',
			'licensed_commercial',
			'third_party_work'
		]);
	});
});

describe('project credits', () => {
	it('every credit carries the code that lets a reader check it', async () => {
		fetchMock.mockResolvedValue(
			ok([
				{
					username: 'ada',
					display_name: 'Ada Lovelace',
					credit_title: 'Original score',
					audio_subtype: 'score',
					verification_code: 'ABC123DEF456',
					issued_at: '2026-08-01T00:00:00Z'
				}
			])
		);
		const { audioDeliveryApi } = await import('../../src/lib/api/audio');
		const res = await audioDeliveryApi.projectCredits('skilluv-backend');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/projects/skilluv-backend/credits');
		// A credit nobody can check is a line on a page.
		expect(res.data[0].verification_code).toBe('ABC123DEF456');
	});

	it('escapes a slug rather than pasting it into the path', async () => {
		fetchMock.mockResolvedValue(ok([]));
		const { audioDeliveryApi } = await import('../../src/lib/api/audio');
		await audioDeliveryApi.projectCredits('scope/name');
		expect(fetchMock.mock.calls[0][0]).toBe('/api/projects/scope%2Fname/credits');
	});
});

describe('the slice envelope', () => {
	it('unwraps `{ data: { slice } }`, which is what the backend answers', async () => {
		fetchMock.mockResolvedValue(ok({ slice: { id: 's1', title: 'Un thème', slice_type: 'audio_artifact' } }));
		const { slicesApi } = await import('../../src/lib/api/slices');
		const res = await slicesApi.get('s1');
		// Typed as `ApiResponse<Slice>` before, so every field read off it was
		// `undefined` at runtime and the detail page rendered an empty title.
		expect(res.data.slice.title).toBe('Un thème');
		expect(res.data.slice.slice_type).toBe('audio_artifact');
	});
});
