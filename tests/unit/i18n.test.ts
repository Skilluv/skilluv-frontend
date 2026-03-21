import { describe, it, expect } from 'vitest';
import { fr } from '../../src/lib/i18n/fr';
import { en } from '../../src/lib/i18n/en';

describe('i18n translations', () => {
	it('FR and EN have the same top-level keys', () => {
		const frKeys = Object.keys(fr).sort();
		const enKeys = Object.keys(en).sort();
		expect(frKeys).toEqual(enKeys);
	});

	it('FR and EN have the same nested keys for common', () => {
		const frKeys = Object.keys(fr.common).sort();
		const enKeys = Object.keys(en.common).sort();
		expect(frKeys).toEqual(enKeys);
	});

	it('FR and EN have the same nested keys for auth', () => {
		const frKeys = Object.keys(fr.auth).sort();
		const enKeys = Object.keys(en.auth).sort();
		expect(frKeys).toEqual(enKeys);
	});

	it('FR and EN have the same nested keys for challenges', () => {
		const frKeys = Object.keys(fr.challenges).sort();
		const enKeys = Object.keys(en.challenges).sort();
		expect(frKeys).toEqual(enKeys);
	});

	it('all FR values are non-empty strings (deep check)', () => {
		function checkNonEmpty(obj: unknown, path = ''): string[] {
			const errors: string[] = [];
			if (typeof obj === 'string') {
				if (obj.trim() === '') errors.push(`Empty value at ${path}`);
			} else if (typeof obj === 'object' && obj !== null) {
				for (const [key, val] of Object.entries(obj)) {
					errors.push(...checkNonEmpty(val, path ? `${path}.${key}` : key));
				}
			}
			return errors;
		}
		const errors = checkNonEmpty(fr);
		expect(errors).toEqual([]);
	});

	it('all EN values are non-empty strings (deep check)', () => {
		function checkNonEmpty(obj: unknown, path = ''): string[] {
			const errors: string[] = [];
			if (typeof obj === 'string') {
				if (obj.trim() === '') errors.push(`Empty value at ${path}`);
			} else if (typeof obj === 'object' && obj !== null) {
				for (const [key, val] of Object.entries(obj)) {
					errors.push(...checkNonEmpty(val, path ? `${path}.${key}` : key));
				}
			}
			return errors;
		}
		const errors = checkNonEmpty(en);
		expect(errors).toEqual([]);
	});

	it('FR and EN have matching deep key structure', () => {
		function getKeys(obj: unknown, prefix = ''): string[] {
			const keys: string[] = [];
			if (typeof obj === 'object' && obj !== null) {
				for (const [key, val] of Object.entries(obj)) {
					const fullKey = prefix ? `${prefix}.${key}` : key;
					if (typeof val === 'object' && val !== null) {
						keys.push(...getKeys(val, fullKey));
					} else {
						keys.push(fullKey);
					}
				}
			}
			return keys;
		}

		const frKeys = getKeys(fr).sort();
		const enKeys = getKeys(en).sort();
		expect(frKeys).toEqual(enKeys);
	});
});
