import { describe, it, expect } from 'vitest';
import { domainStyle, DOMAIN_STYLES, rankColor, RANK_COLORS } from '$lib/utils/domains';

/**
 * The discipline catalogue lives on the backend and grows there first. Three
 * domains (`ai`, `ops`, `soft_skills`) were already served by
 * `GET /api/orientations` — 13 of the 36 live orientations — while this build
 * only knew four, and the direct lookup returned `undefined`. Reading `.dot`
 * off that threw and took the whole card down.
 */
describe('domainStyle', () => {
	it('covers every discipline the backend currently serves', () => {
		// Observed on the test backend: primary_domain across /api/orientations.
		const served = ['ai', 'code', 'design', 'game', 'ops', 'security', 'soft_skills'];
		for (const d of served) {
			expect(DOMAIN_STYLES[d as keyof typeof DOMAIN_STYLES], d).toBeDefined();
		}
	});

	it('falls back to neutral styling for a discipline this build does not know', () => {
		// The backend will ship `audio`, `education` and the rest before we do.
		const style = domainStyle('audio' as never);
		expect(style).toBeDefined();
		expect(style.dot).toBeTruthy();
		expect(style.text).toBeTruthy();
	});

	it('never returns undefined for a missing or empty domain', () => {
		expect(domainStyle(null).dot).toBeTruthy();
		expect(domainStyle(undefined).dot).toBeTruthy();
		expect(domainStyle('').dot).toBeTruthy();
	});
});

/**
 * Ranks reach the UI straight from the backend, which still carries `legende`
 * on historical profiles even though the canonical Rank type dropped it.
 */
describe('rankColor', () => {
	it('covers the five canonical ranks', () => {
		for (const r of ['apprenti', 'ranger', 'artisan', 'maitre', 'doyen']) {
			expect(RANK_COLORS[r as keyof typeof RANK_COLORS], r).toBeDefined();
		}
	});

	it('still colours the legacy legende rank', () => {
		expect(rankColor('legende')).toBe('text-amber-400');
	});

	it('never returns undefined for an unknown or missing rank', () => {
		expect(rankColor('archimage')).toBeTruthy();
		expect(rankColor(null)).toBeTruthy();
		expect(rankColor(undefined)).toBeTruthy();
	});
});
