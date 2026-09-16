/**
 * A trace of the account-linking round trip, readable after the fact.
 *
 * This flow cannot be debugged from the console. It leaves the app for the
 * provider, comes back through the API on another origin, and lands on a
 * fresh document — three full-page navigations, each of which wipes whatever
 * was logged before it. By the time somebody looks, the interesting part is
 * gone.
 *
 * So each step is appended to `sessionStorage` as well as printed. The buffer
 * survives the navigations, is scoped to the tab, and is dumped in one piece
 * when the browser comes back.
 *
 * ## Off unless asked for
 *
 * Enabled by `?oauth_trace=1` on any page, which sets a flag that then
 * survives the round trip — the whole point being that the switch has to
 * outlive the navigation it is tracing. `?oauth_trace=0` clears it. With the
 * flag unset every function here returns immediately and writes nothing.
 *
 * Nothing recorded identifies anybody: paths, status codes and booleans. The
 * one field that could is the return path, which is a route on this site.
 */

const FLAG = 'skilluv-oauth-trace';
const BUFFER = 'skilluv-oauth-trace-log';
const MAX_ENTRIES = 80;

function storage(kind: 'local' | 'session'): Storage | null {
	try {
		return kind === 'local' ? localStorage : sessionStorage;
	} catch {
		// Private browsing, or storage refused. Tracing is a convenience.
		return null;
	}
}

/**
 * Whether tracing is on, honouring `?oauth_trace=` first so the switch can be
 * thrown from the address bar and persist from there.
 */
export function oauthTraceEnabled(search?: string): boolean {
	const local = storage('local');
	if (search !== undefined) {
		const asked = new URLSearchParams(search).get('oauth_trace');
		if (asked === '1') local?.setItem(FLAG, '1');
		else if (asked === '0') local?.removeItem(FLAG);
	}
	return local?.getItem(FLAG) === '1';
}

interface Entry {
	at: string;
	step: string;
	detail: Record<string, unknown>;
}

function read(): Entry[] {
	const raw = storage('session')?.getItem(BUFFER);
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as Entry[]) : [];
	} catch {
		return [];
	}
}

/**
 * Record one step.
 *
 * `detail` is spread into the line rather than stringified whole, so a step
 * reads as a sentence in the console and still survives as data in the
 * buffer.
 */
export function oauthTrace(step: string, detail: Record<string, unknown> = {}): void {
	if (!oauthTraceEnabled()) return;

	const entry: Entry = { at: new Date().toISOString().slice(11, 23), step, detail };
	console.info(`[oauth] ${entry.at} ${step}`, detail);

	const session = storage('session');
	if (!session) return;
	// Capped, because a reconnecting socket or a retry loop could otherwise
	// fill the quota and take the rest of the tab's storage with it.
	const next = [...read(), entry].slice(-MAX_ENTRIES);
	try {
		session.setItem(BUFFER, JSON.stringify(next));
	} catch {
		// Quota. The console line above already went out.
	}
}

/**
 * Print everything recorded so far, oldest first.
 *
 * Called when a traced page loads, which is the moment after the round trip
 * when the earlier steps are no longer anywhere else.
 */
export function oauthTraceDump(): void {
	if (!oauthTraceEnabled()) return;
	const entries = read();
	if (entries.length === 0) return;

	console.info(`[oauth] --- ${entries.length} steps recorded across this flow ---`);
	for (const e of entries) {
		console.info(`[oauth] ${e.at} ${e.step}`, e.detail);
	}
}

/** Start a fresh trace. Called when a link is pressed, not on every page. */
export function oauthTraceReset(): void {
	if (!oauthTraceEnabled()) return;
	storage('session')?.removeItem(BUFFER);
}
