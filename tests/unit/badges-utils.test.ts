import { describe, it, expect } from 'vitest';
import {
	hashSlug,
	derivePatchVisual,
	PATCH_CATEGORIES,
	PATCH_KEY_TYPES,
	RANK_TO_LEVEL
} from '../../src/lib/utils/badges';

describe('hashSlug', () => {
	it('is deterministic for the same input', () => {
		expect(hashSlug('dev-frontend')).toBe(hashSlug('dev-frontend'));
	});

	it('produces different hashes for different inputs', () => {
		expect(hashSlug('a')).not.toBe(hashSlug('b'));
	});

	it('always returns a non-negative integer', () => {
		for (const s of ['', 'x', 'skill_patch_react', 'a'.repeat(1000)]) {
			const h = hashSlug(s);
			expect(h).toBeGreaterThanOrEqual(0);
			expect(Number.isInteger(h)).toBe(true);
		}
	});
});

describe('derivePatchVisual', () => {
	it('returns a valid category and keyType for a slug', () => {
		const v = derivePatchVisual(0, 'react');
		expect(PATCH_CATEGORIES).toContain(v.category);
		expect(PATCH_KEY_TYPES).toContain(v.keyType);
	});

	it('is deterministic for the same slug regardless of index', () => {
		const a = derivePatchVisual(0, 'react');
		const b = derivePatchVisual(42, 'react');
		expect(a).toEqual(b);
	});

	it('falls back to index when slug is undefined', () => {
		const v0 = derivePatchVisual(0, undefined);
		const v1 = derivePatchVisual(1, undefined);
		expect(v0.category).toBe(PATCH_CATEGORIES[0]);
		expect(v1.category).toBe(PATCH_CATEGORIES[1]);
	});
});

describe('RANK_TO_LEVEL', () => {
	it('maps all 5 canonical ranks to 1..5 bijectively', () => {
		expect(RANK_TO_LEVEL.apprenti).toBe(1);
		expect(RANK_TO_LEVEL.ranger).toBe(2);
		expect(RANK_TO_LEVEL.artisan).toBe(3);
		expect(RANK_TO_LEVEL.maitre).toBe(4);
		expect(RANK_TO_LEVEL.doyen).toBe(5);
		const values = Object.values(RANK_TO_LEVEL);
		expect(new Set(values).size).toBe(5);
	});
});
