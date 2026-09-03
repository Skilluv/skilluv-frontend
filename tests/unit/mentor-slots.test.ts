import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Opening a slot, in the format the endpoint actually deserializes.
 *
 * `<input type="time">` yields `HH:MM`. `SlotBody` in
 * `routes/mentoring_products.rs` types the times as `chrono::NaiveTime`, whose
 * deserializer wants seconds, so the body was refused by the extractor before
 * the handler ran and the button did nothing anybody could act on.
 *
 * The sibling endpoint is the tell: `add_availability` in `routes/mentorship.rs`
 * takes the times as `String` and parses `%H:%M` before falling back to
 * `%H:%M:%S`. Somebody met this there and handled it; this endpoint kept the
 * strict type, and its own backend test sends `"14:00:00"`, which is exactly
 * why no test on either side caught the mismatch.
 */
async function withStubbedFetch() {
	const f = vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		json: () => Promise.resolve({ data: { slot_id: 's-1' } })
	});
	vi.resetModules();
	vi.stubGlobal('fetch', f);
	const { mentoringProductsApi } = await import('$api/mentoring_products');
	return { f, mentoringProductsApi };
}

function bodyOf(f: ReturnType<typeof vi.fn>) {
	return JSON.parse(f.mock.calls[0][1].body);
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe('openSlot', () => {
	it('pads a bare HH:MM to the seconds the backend requires', async () => {
		const { f, mentoringProductsApi } = await withStubbedFetch();
		await mentoringProductsApi.openSlot({
			date: '2026-09-10',
			start_time: '14:30',
			end_time: '15:30'
		});
		const body = bodyOf(f);
		expect(body.start_time).toBe('14:30:00');
		expect(body.end_time).toBe('15:30:00');
	});

	it('leaves a time that already carries seconds alone', async () => {
		const { f, mentoringProductsApi } = await withStubbedFetch();
		await mentoringProductsApi.openSlot({
			date: '2026-09-10',
			start_time: '09:00:00',
			end_time: '10:15:30'
		});
		const body = bodyOf(f);
		expect(body.start_time).toBe('09:00:00');
		expect(body.end_time).toBe('10:15:30');
	});

	it('passes the date and timezone through untouched', async () => {
		const { f, mentoringProductsApi } = await withStubbedFetch();
		await mentoringProductsApi.openSlot({
			date: '2026-09-10',
			start_time: '14:30',
			end_time: '15:30',
			timezone: 'Africa/Porto-Novo'
		});
		const body = bodyOf(f);
		// The date is already `YYYY-MM-DD`, which is what `NaiveDate` wants, and
		// the zone is what stops "14:00" being read in the reader's own.
		expect(body.date).toBe('2026-09-10');
		expect(body.timezone).toBe('Africa/Porto-Novo');
	});

	it('hits the route the backend mounts', async () => {
		const { f, mentoringProductsApi } = await withStubbedFetch();
		await mentoringProductsApi.openSlot({
			date: '2026-09-10',
			start_time: '14:30',
			end_time: '15:30'
		});
		expect(f.mock.calls[0][0]).toBe('/api/mentors/me/open-slots');
	});
});
