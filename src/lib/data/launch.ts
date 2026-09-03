/**
 * When Skilluv opens, and how long is left.
 *
 * The date was inline in `HeroSection`. A second surface needed it — the
 * first-visit notice — and two copies of a date is how one of them comes to
 * announce a day the other has already passed. So it lives here, once.
 *
 * The value is a real commitment rather than a placeholder: the pre-season
 * opens on 11 January 2027, and the first full season follows in June.
 */
export const OPENING = new Date('2027-01-11T00:00:00Z');

/**
 * Whole days until the opening, negative once it is past.
 *
 * Never call this at module scope or during SSR. Evaluating it on the server
 * bakes the server's day into the HTML, and a cached page then serves a
 * countdown that is wrong by however long it sat in the cache. Call it on
 * mount, which is also when the reader's own clock is available.
 */
export function daysUntilOpening(now: Date = new Date()): number {
	const msPerDay = 86_400_000;
	return Math.ceil((OPENING.getTime() - now.getTime()) / msPerDay);
}
