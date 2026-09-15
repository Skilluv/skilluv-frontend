import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

/**
 * Joining the newsletter.
 *
 * ## The one answer
 *
 * `POST /newsletter/subscriptions` answers `202` and the same body for a new
 * address, one already pending, one already confirmed and one that
 * unsubscribed. Not `200`, and never `409`.
 *
 * That is deliberate on the backend's side and it decides how this is rendered:
 * a different answer for a known address would turn a public endpoint into an
 * oracle for "is this person on the list", which is an enumeration surface on
 * exactly the data a mailing list holds. So there is one success state, it says
 * to check the inbox, and it says it whatever the address turns out to be.
 *
 * The confirmation mail is what actually changes anything, and it goes to the
 * address rather than to whoever typed it.
 */

export interface SubscribeBody {
	email: string;
	/** `fr`, `en` or `ar`. An unserved locale is refused rather than defaulted. */
	locale?: string;
	/** Which surface it came from. Forty characters, and the column is that wide. */
	source?: string;
	/**
	 * The exact wording shown beside the field.
	 *
	 * Stored with the address, the IP and the user agent. A consent is *for* a
	 * sentence, and a boolean cannot say which one was agreed to — so if this
	 * wording ever changes, what somebody agreed to under the old one stays
	 * readable as that.
	 */
	consent_text?: string;
}

export const newsletterApi = {
	subscribe(body: SubscribeBody) {
		return api.post<ApiResponse<{ message: string }>>('/newsletter/subscriptions', body);
	},

	/**
	 * `GET /newsletter/confirm/{token}` — the link in the confirmation mail.
	 *
	 * The token is spent on use: a second click answers 404, not 200. That is
	 * deliberate — a confirmation link that keeps working is a live credential
	 * sitting in a mailbox somebody else may read one day.
	 *
	 * So 404 here covers two different people: one whose link expired, and one
	 * who simply clicked twice and is already subscribed. The page must not tell
	 * the second to subscribe again, and cannot tell which of the two it has.
	 */
	confirm(token: string) {
		return api.get<ApiResponse<{ message: string }>>(
			`/newsletter/confirm/${encodeURIComponent(token)}`
		);
	},

	/**
	 * `GET /newsletter/unsubscribe/{token}` — the link every issue carries.
	 *
	 * The opposite of the confirmation token by design: this one never expires
	 * and is idempotent, so clicking twice answers 200 twice. Somebody who kept
	 * a two-year-old mail must still be able to get out with it, and neither
	 * page requires an account. The wording beside the form promises one click,
	 * and this is the click.
	 */
	unsubscribe(token: string) {
		return api.get<ApiResponse<{ message: string }>>(
			`/newsletter/unsubscribe/${encodeURIComponent(token)}`
		);
	}
};

/**
 * The address shape the API accepts, copied from its OpenAPI rather than
 * invented here.
 *
 * Deliberately permissive: a local part, a host, a dot, a TLD of at least two
 * characters. What decides deliverability is the confirmation mail, not a
 * regular expression — so anything stricter would refuse addresses the backend
 * takes, which is the worse of the two failures.
 */
export const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s.]{2,}$/;
