/**
 * The password policy, once.
 *
 * ## Why this file exists
 *
 * There is one rule, enforced in one place: both `POST /api/auth/register` and
 * `POST /api/enterprise/invite/register-and-accept` call the same
 * `validate_password` in the backend, and so do the reset and change handlers.
 *
 * Four screens stated it, and no two agreed. Signup said ten characters with
 * four classes, which was right. The enterprise invitation said twelve and did
 * not mention lowercase, borrowed from `seed_admin.rs` — an operator CLI that
 * demands twelve for the admin account and has never applied to an HTTP
 * endpoint. Reset-password and the settings screen said "8 characters minimum"
 * and enforced eight, so a person could submit a password the client accepted
 * and the server refused, with the client's own hint as the only explanation.
 *
 * That is what a rule copied into four places does. It lives here now, and the
 * screens read it.
 *
 * ## Mirroring the server exactly
 *
 * A client check that is stricter than the server rejects passwords that would
 * have worked. One that is looser sends the person to a refusal they were told
 * would not happen. Both are worse than no check at all, so the three places
 * where JavaScript and Rust disagree by default are handled here:
 *
 * - **Length is counted in characters, not UTF-16 code units.** Rust counts
 *   `chars()`. `"a😀".length` is 3 in JavaScript and 2 in Rust, so a password
 *   made of emoji would be measured a third longer here than there.
 * - **The classes are ASCII.** "É" does not satisfy uppercase and "é" does not
 *   satisfy lowercase, on either side. Both do satisfy *symbol*, because the
 *   symbol test is "not ASCII-alphanumeric and not whitespace" rather than a
 *   list of punctuation.
 * - **Whitespace is neither a symbol nor forbidden.** A space may sit in a
 *   password; it simply does not earn the symbol class on its own.
 */

/** Inclusive, counted in characters. */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export type PasswordVerdict = 'ok' | 'tooShort' | 'tooLong' | 'missingClass';

/**
 * Every requirement, judged separately.
 *
 * `checkPassword` answers "may this be submitted", which is one sentence and
 * the right thing to say when somebody presses the button. It is the wrong
 * thing to show while they are still typing: told only "at least one uppercase,
 * one lowercase, one digit and one symbol", somebody has to work out for
 * themselves which of the four they are missing, on a field they cannot read
 * back. So the form shows all five, ticking as they go, and this is what it
 * reads.
 *
 * Both come from the same test, so the list and the verdict cannot drift into
 * disagreeing about the same password.
 */
export interface PasswordChecks {
	/** Within `PASSWORD_MIN` and `PASSWORD_MAX`, counted in characters. */
	length: boolean;
	upper: boolean;
	lower: boolean;
	digit: boolean;
	symbol: boolean;
}

/** The requirement names, in the order a form should list them. */
export const PASSWORD_RULES = ['length', 'upper', 'lower', 'digit', 'symbol'] as const;

export function passwordChecks(password: string): PasswordChecks {
	// Spread rather than `.length`: code points, the way the server counts.
	const size = [...password].length;
	return {
		length: size >= PASSWORD_MIN && size <= PASSWORD_MAX,
		upper: /[A-Z]/.test(password),
		lower: /[a-z]/.test(password),
		digit: /[0-9]/.test(password),
		// Anything that is neither ASCII-alphanumeric nor whitespace.
		symbol: /[^A-Za-z0-9\s]/.test(password)
	};
}

/**
 * Which of the four `auth.password.*` messages this password earns, or `ok`.
 *
 * The verdict is a translation key rather than a sentence, so the copy stays
 * with the other copy and this file stays the rule.
 */
export function checkPassword(password: string): PasswordVerdict {
	const size = [...password].length;
	// Length before classes, and short before long: one problem at a time, and
	// the classes cannot be judged on a password that is not going to be the
	// right size anyway.
	if (size < PASSWORD_MIN) return 'tooShort';
	if (size > PASSWORD_MAX) return 'tooLong';
	const checks = passwordChecks(password);
	if (!checks.upper || !checks.lower || !checks.digit || !checks.symbol) return 'missingClass';
	return 'ok';
}
