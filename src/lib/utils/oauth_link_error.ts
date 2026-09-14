/**
 * What came back on the URL when linking a provider failed.
 *
 * An OAuth callback is a browser navigation, so a failure cannot be a
 * response body somebody reads — it has to survive a redirect. The backend
 * sends the browser back to `return_to` with `?<provider>_error=<code>`, and
 * the code is deliberately a short stable token rather than a sentence: the
 * wording lives here, in both languages, because the API has no business
 * choosing which one a reader gets.
 *
 * Namespaced by provider, which is what makes a settings page showing four
 * connect buttons able to say *which* one refused.
 *
 * Mirrors `oauth_error_code` and `error_return_url` in `routes::oauth`. An
 * unrecognised code is not dropped: a failure nobody explains is worse than
 * one explained generically, and a code added server-side would otherwise
 * arrive as silence.
 */

/** The codes every provider's callback can send back. */
export const OAUTH_LINK_ERRORS = [
	/** That account already belongs to another Skilluv profile. */
	'already_linked',
	/** The state token ran out, or the session behind it did. */
	'expired',
	/** The callback was malformed. */
	'invalid_request',
	/** This provider is not configured on this deployment. */
	'unavailable',
	/** Anything else — a revoked code, an outage at the provider, a dropped
	 * connection. These used to be the silent ones. */
	'failed'
] as const;

export type OAuthLinkError = (typeof OAUTH_LINK_ERRORS)[number];

/**
 * The providers whose callback can report a failure this way.
 *
 * Wider than `LINKABLE_PROVIDERS`: GitHub links through the repo-sync flow
 * rather than through `/auth/{provider}/link`, and it reports failures like
 * the rest.
 *
 * `google` and `linkedin` appear here for their `/link` route only. Their
 * `/start` routes — sign-up and sign-in rather than linking — carry no
 * `return_to`, so they produce no parameter to read. Nothing breaks: this
 * finds none and renders nothing.
 */
export const LINK_ERROR_PROVIDERS = ['github', 'discord', 'google', 'linkedin'] as const;

export type LinkErrorProvider = (typeof LINK_ERROR_PROVIDERS)[number];

/**
 * How each provider spells its own name.
 *
 * Not translated: a brand is the same word in both locales, and the
 * alternative — interpolating the slug — puts "Ce compte linkedin" in front
 * of somebody.
 */
export const OAUTH_PROVIDER_NAMES: Record<LinkErrorProvider, string> = {
	github: 'GitHub',
	discord: 'Discord',
	google: 'Google',
	linkedin: 'LinkedIn'
};

function isKnownCode(value: string): value is OAuthLinkError {
	return (OAUTH_LINK_ERRORS as readonly string[]).includes(value);
}

/**
 * The i18n key for a code, known or not.
 *
 * `failed` is the catch-all the backend itself falls back to, so an unknown
 * code resolving to the same wording says the true thing: something went
 * wrong and we cannot be more specific.
 */
export function oauthLinkErrorKey(code: string): string {
	return `oauthLink.errors.${isKnownCode(code) ? code : 'failed'}`;
}

export interface OAuthLinkFailure {
	provider: LinkErrorProvider;
	code: OAuthLinkError;
}

/**
 * Read the failure off a URL, and say what the URL should become.
 *
 * Returns the cleaned search string so the caller can drop the parameter:
 * left in place it would reappear on every reload and on every link somebody
 * copies out of the address bar, turning one failed attempt into a permanent
 * banner — including on somebody else's screen.
 *
 * The first provider found is reported, and **only that one** is stripped.
 * Two at once cannot happen — one callback runs at a time — but a page can
 * hold two readers, each owning different buttons, and one clearing the
 * other's parameter before it has been read would lose the message.
 *
 * Pure, so it is testable without a browser.
 */
export function readOAuthLinkError(search: string): {
	failure: OAuthLinkFailure | null;
	cleanedSearch: string;
} {
	const params = new URLSearchParams(search);

	for (const provider of LINK_ERROR_PROVIDERS) {
		const raw = params.get(`${provider}_error`);
		if (raw === null) continue;

		params.delete(`${provider}_error`);
		const rest = params.toString();
		return {
			// An unknown token still reports as a failure rather than as no
			// failure at all: the link did not happen either way.
			failure: { provider, code: isKnownCode(raw) ? raw : 'failed' },
			cleanedSearch: rest ? `?${rest}` : ''
		};
	}

	return { failure: null, cleanedSearch: search };
}
