/**
 * What came back on the URL when linking GitHub failed.
 *
 * The OAuth callback is a browser navigation, so a failure cannot be a
 * response body somebody reads — it has to survive a redirect. The backend
 * sends the browser back to `return_to` with `?github_error=<code>`, and the
 * code is deliberately a short stable token rather than a sentence: the
 * wording lives here, in both languages, because the API has no business
 * choosing which one a reader gets.
 *
 * Mirrors `github_error_code` in `routes::github`. An unrecognised code is
 * not dropped: a failure nobody explains is worse than one explained
 * generically, and a new code added server-side would otherwise arrive as
 * silence.
 */

/** The codes `routes::github` emits. */
export const GITHUB_LINK_ERRORS = [
	/** That GitHub account already belongs to another Skilluv profile. */
	'already_linked',
	/** The state token ran out, or the session behind it did. */
	'expired',
	/** The callback was malformed. */
	'invalid_request',
	/** GitHub OAuth is not configured on this deployment. */
	'unavailable',
	/** Anything else. */
	'failed'
] as const;

export type GithubLinkError = (typeof GITHUB_LINK_ERRORS)[number];

/** The query parameter the callback sends it back on. */
export const GITHUB_ERROR_PARAM = 'github_error';

function isKnown(value: string): value is GithubLinkError {
	return (GITHUB_LINK_ERRORS as readonly string[]).includes(value);
}

/**
 * The i18n key for a code, known or not.
 *
 * `failed` is the catch-all the backend itself falls back to, so an unknown
 * code resolving to the same wording says the true thing: something went
 * wrong and we cannot be more specific.
 */
export function githubLinkErrorKey(code: string): string {
	return `githubLink.errors.${isKnown(code) ? code : 'failed'}`;
}

/**
 * Read the code off a URL, and say what the URL should become.
 *
 * Returns the cleaned search string so the caller can drop the parameter:
 * left in place it would reappear on every reload and on every link somebody
 * copies out of the address bar, turning one failed attempt into a permanent
 * banner. Pure, so it is testable without a browser.
 *
 * @returns the code, or `null` when the URL carries none.
 */
export function readGithubLinkError(search: string): {
	code: GithubLinkError | null;
	cleanedSearch: string;
} {
	const params = new URLSearchParams(search);
	const raw = params.get(GITHUB_ERROR_PARAM);
	if (raw === null) return { code: null, cleanedSearch: search };

	params.delete(GITHUB_ERROR_PARAM);
	const rest = params.toString();
	return {
		// An unknown token still reports as a failure rather than as no
		// failure at all: the link did not happen either way.
		code: isKnown(raw) ? raw : 'failed',
		cleanedSearch: rest ? `?${rest}` : ''
	};
}
