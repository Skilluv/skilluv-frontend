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

/**
 * What to do first, given what was just answered.
 *
 * Returned by `PUT /users/me/domain-profile/{domain}` and by nothing else:
 * the backend calls it "the reply to having answered, not a property of the
 * profile", which is why a read never carries one. Showing month-one advice
 * to somebody in their sixth month would be the same mistake from the other
 * direction.
 *
 * The prose is authored server-side, in `services::onboarding_recommendation`,
 * as explicit rules rather than a score — "you said beginner, web and five
 * hours a week, so here is the web guide". It arrives already written and is
 * rendered verbatim; there is no i18n key for it, because the sentence a
 * person reads is the sentence the rule produced.
 */
export interface DomainRecommendation {
	/** One sentence, second person. The first thing read. */
	headline: string;
	/** Why this and not something else, so it can be argued with. */
	because: string;
	/** Guide slugs, resolved by the front to `/guides/{slug}`. */
	guides: string[];
	/**
	 * A ready-made query against the domain's feed — an **API** path, not a
	 * route. Deliberately not rendered as a link: `/api/code/first-issues?…`
	 * is not a page, and offering it as one would hand somebody raw JSON. The
	 * suggestions below the wizard are the browsable form of the same intent.
	 */
	feed_query: string;
	/** What to aim at in the first month. Three, four when an answer earns it. */
	next_steps: string[];
}
