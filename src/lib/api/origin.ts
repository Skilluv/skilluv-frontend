import { env } from '$env/dynamic/public';

/**
 * Where the browser sends API traffic.
 *
 * ## Why this exists
 *
 * Every client was built around a relative `/api`, which works in exactly two
 * places: the dev server, where Vite proxies it, and a deployment where a
 * reverse proxy routes `/api/*` to the backend on the same host. Neither is
 * true of a backend living on its own subdomain — `adapter-node` proxies
 * nothing, so a relative call resolves to the SvelteKit server and 404s.
 *
 * ## Why a new variable rather than PUBLIC_API_BASE_URL
 *
 * That one already means something else: the *target of the dev proxy*
 * (`vite.config.ts`) and the base for the SSR `/auth/me` call
 * (`hooks.server.ts`). Both run server-side or at dev time. Reusing it here
 * would make the dev browser bypass its own proxy and hit the backend
 * directly, which trades a working setup for a CORS failure.
 *
 * So: a separate switch, and one whose *unset* state is the old behaviour.
 * Dev, the unit suite and the Playwright run set nothing and keep the relative
 * path. Only a deployment that actually needs an absolute origin declares one.
 *
 * ## Read at runtime, on purpose
 *
 * `$env/dynamic/public` rather than `$env/static/public`: the value reaches the
 * page at startup instead of being frozen into the bundle, so the same image
 * runs against staging and production by restarting with a different value.
 */

/** The API origin with no trailing slash, or `''` when calls stay relative. */
export function apiOrigin(): string {
	return (env.PUBLIC_API_ORIGIN ?? '').replace(/\/+$/, '');
}

/**
 * Base for the REST clients.
 *
 * The backend serves under an `/api` prefix, so the origin gains it. Unset
 * gives back the bare relative prefix the 117 clients were written against.
 */
export function apiBase(): string {
	const origin = apiOrigin();
	return origin ? `${origin}/api` : '/api';
}

/**
 * Base for the endpoints deliberately served outside `/api` — the opt-in
 * public maintainer-digest flow. Same origin, no prefix.
 */
export function publicBase(): string {
	return apiOrigin();
}

/**
 * The WebSocket endpoint.
 *
 * Follows the API rather than the page: the socket is served by the backend,
 * and pointing it at `window.location.host` sends it to the SvelteKit server,
 * which has no `/ws` route. The scheme is derived from the origin's own, so an
 * https API gets `wss` and a local http one gets `ws`.
 */
export function wsUrl(): string {
	const origin = apiOrigin();
	if (origin) return `${origin.replace(/^http/, 'ws')}/ws`;
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	return `${protocol}//${window.location.host}/ws`;
}
