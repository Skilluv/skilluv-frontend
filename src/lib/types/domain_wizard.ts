/**
 * The domain wizard, as data.
 *
 * `routes::domain_profile` stopped being a typed body with one optional field
 * per domain's question — the second domain needing three of its own would
 * have made that struct a list of everybody's fields, each null for everybody
 * else. It is a registry now, and it is served:
 * `GET /users/me/domain-profile/{domain}/questions` says which questions a
 * domain asks and what each accepts.
 *
 * So the front renders the wizard from the answer rather than shipping its own
 * copy of the vocabulary. A value added server-side appears without a frontend
 * release; a value removed stops being offered the same day.
 */

/**
 * How one question is answered.
 *
 * Read together with `allowed`: `multi` with an empty `allowed` and a
 * `max_len` means several answers of any value. `multi` comes first
 * deliberately — a question can be several-of-anything, and treating it as
 * `text` would send a string where the validator wants a list.
 */
export type DomainAnswerKind = 'single' | 'multi' | 'text';

export interface DomainQuestionSpec {
	key: string;
	answer: DomainAnswerKind;
	/** The closed vocabulary. Empty means free text, or any value if `multi`. */
	allowed: string[];
	/** Present on `multi` questions: the ceiling on how many may be picked. */
	max_selections: number | null;
	/** Present where `allowed` is empty: the longest accepted answer. */
	max_len: number | null;
}

/** What one question is currently answered with, before it is sent. */
export type DomainAnswerValue = string | string[];
