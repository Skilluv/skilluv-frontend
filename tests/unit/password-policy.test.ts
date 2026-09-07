import { describe, it, expect } from 'vitest';
import {
	checkPassword,
	passwordChecks,
	PASSWORD_RULES,
	PASSWORD_MIN,
	PASSWORD_MAX
} from '$lib/utils/password';

/**
 * The client's copy of the server's password rule.
 *
 * The reason this file exists is not that the function is hard — it is four
 * regexes — but that it is a *mirror*. A mirror that drifts is worse than no
 * mirror: too strict and it refuses passwords the API would have taken, too
 * loose and it promises an account the API then refuses. So the cases here are
 * written against the backend's `validate_password`, not against the
 * implementation next door, and the three places where JavaScript and Rust
 * disagree by default each get a case of their own.
 */
describe('the password policy, mirrored from the backend', () => {
	it('takes a password that satisfies all four classes', () => {
		expect(checkPassword('StrongPass1!')).toBe('ok');
	});

	it('states the bounds the backend states', () => {
		expect(PASSWORD_MIN).toBe(10);
		expect(PASSWORD_MAX).toBe(128);
	});

	describe('length', () => {
		it('refuses one character short and takes exactly the minimum', () => {
			// 'Aa1!' plus filler, so only the length is ever in question.
			const short = 'Aa1!' + 'x'.repeat(PASSWORD_MIN - 5);
			expect([...short].length).toBe(PASSWORD_MIN - 1);
			expect(checkPassword(short)).toBe('tooShort');
			expect(checkPassword(short + 'x')).toBe('ok');
		});

		it('takes exactly the maximum and refuses one past it', () => {
			const atMax = 'Aa1!' + 'x'.repeat(PASSWORD_MAX - 4);
			expect(checkPassword(atMax)).toBe('ok');
			expect(checkPassword(atMax + 'x')).toBe('tooLong');
		});

		it('counts characters, not UTF-16 code units', () => {
			// Ten code points, of which four are astral. `.length` would say 14
			// and take it as comfortably long; Rust's `chars()` says 10, which is
			// exactly the minimum. Measuring the JavaScript way would have made
			// this the boundary case it is not.
			const tenCodePoints = 'Aa1!😀😀😀😀xx';
			expect(tenCodePoints.length).toBe(14);
			expect([...tenCodePoints].length).toBe(10);
			expect(checkPassword(tenCodePoints)).toBe('ok');

			// Nine code points: below the floor, whatever `.length` reports.
			const nine = 'Aa1!😀😀😀😀x';
			expect(nine.length).toBe(13);
			expect(checkPassword(nine)).toBe('tooShort');
		});
	});

	describe('the four classes', () => {
		it('names a missing class rather than a length problem', () => {
			expect(checkPassword('strongpass1!')).toBe('missingClass'); // no uppercase
			expect(checkPassword('STRONGPASS1!')).toBe('missingClass'); // no lowercase
			expect(checkPassword('StrongPassX!')).toBe('missingClass'); // no digit
			expect(checkPassword('StrongPass12')).toBe('missingClass'); // no symbol
		});

		it('reads uppercase and lowercase as ASCII, the way the backend does', () => {
			// "É" is uppercase to a human and to Unicode, and not to this rule.
			// It does satisfy *symbol*, because symbol means "not ASCII
			// alphanumeric and not whitespace" — so this password has lowercase,
			// digit and symbol, and no uppercase.
			expect(checkPassword('éstrongpass1')).toBe('missingClass');
			// The same password with an ASCII capital passes.
			expect(checkPassword('éStrongpass1')).toBe('ok');
		});

		it('treats whitespace as neither a symbol nor a disqualification', () => {
			// A space does not earn the symbol class...
			expect(checkPassword('Strong Pass1')).toBe('missingClass');
			// ...but it is allowed to sit in a password that has one elsewhere.
			expect(checkPassword('Strong Pass1!')).toBe('ok');
		});

		it('accepts any non-alphanumeric as the symbol, not a fixed list', () => {
			for (const symbol of ['!', '#', '_', '~', '€', '中', '😀']) {
				expect(checkPassword(`StrongPass1${symbol}`)).toBe('ok');
			}
		});
	});

	describe('the per-rule breakdown the form ticks off', () => {
		it('names every rule the form lists, and nothing else', () => {
			expect([...PASSWORD_RULES].sort()).toEqual(Object.keys(passwordChecks('')).sort());
		});

		it('says nothing is met for an empty password', () => {
			expect(passwordChecks('')).toEqual({
				length: false,
				upper: false,
				lower: false,
				digit: false,
				symbol: false
			});
		});

		it('marks exactly the rule that is missing, not all of them', () => {
			// The reason the breakdown exists: "one uppercase, one lowercase, one
			// digit and one symbol" tells somebody four things and not which one
			// they are short of.
			expect(passwordChecks('strongpass1!')).toMatchObject({
				length: true,
				upper: false,
				lower: true,
				digit: true,
				symbol: true
			});
		});

		it('fails the length rule at both ends, not only the short one', () => {
			expect(passwordChecks('Aa1!x').length).toBe(false);
			expect(passwordChecks('Aa1!' + 'x'.repeat(PASSWORD_MAX)).length).toBe(false);
			expect(passwordChecks('Aa1!' + 'x'.repeat(PASSWORD_MAX - 4)).length).toBe(true);
		});

		it('agrees with the verdict on every password, so the list cannot lie', () => {
			// The two are shown to the same person about the same field: the
			// checklist while they type, the verdict when they submit. A password
			// with five ticks that is then refused would be the worst of both.
			const samples = [
				'',
				'weak',
				'StrongPass1!',
				'strongpass1!',
				'STRONGPASS1!',
				'StrongPassX!',
				'StrongPass12',
				'Strong Pass1',
				'éStrongpass1',
				'Aa1!' + 'x'.repeat(PASSWORD_MAX - 3)
			];
			for (const sample of samples) {
				const checks = passwordChecks(sample);
				const allMet = PASSWORD_RULES.every((rule) => checks[rule]);
				expect(allMet, sample).toBe(checkPassword(sample) === 'ok');
			}
		});
	});

	it('reports length before classes, so one problem is raised at a time', () => {
		// 'weak' fails both. Saying "too short" first is the honest order: the
		// classes cannot be judged on a password that is not going to be long
		// enough anyway.
		expect(checkPassword('weak')).toBe('tooShort');
	});
});
