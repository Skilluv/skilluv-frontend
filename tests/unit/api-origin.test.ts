import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * The API origin switch.
 *
 * These assertions exist because the failure they guard against is invisible
 * in development: a relative `/api` works there (Vite proxies it) and 404s in
 * production the moment the backend lives on its own subdomain. Nothing in the
 * type system notices, and the app renders perfectly while every call fails.
 *
 * The env module is mocked with a mutable object rather than re-imported per
 * case, because the helpers read it at call time — which is the property that
 * lets one image serve staging and production without a rebuild, and is
 * therefore worth pinning.
 */
const publicEnv = vi.hoisted(() => ({}) as Record<string, string | undefined>);
vi.mock('$env/dynamic/public', () => ({ env: publicEnv }));

import { apiOrigin, apiBase, publicBase, wsUrl } from '$api/origin';

beforeEach(() => {
	for (const k of Object.keys(publicEnv)) delete publicEnv[k];
});

describe('apiBase', () => {
	it('stays relative when no origin is declared', () => {
		// The 117 existing clients were written against this, and dev, the unit
		// suite and Playwright all rely on it. Unset must mean unchanged.
		expect(apiBase()).toBe('/api');
	});

	it('prefixes the declared origin and keeps the /api segment', () => {
		publicEnv.PUBLIC_API_ORIGIN = 'https://api.skill-uv.com';
		expect(apiBase()).toBe('https://api.skill-uv.com/api');
	});

	it('tolerates a trailing slash', () => {
		// Somebody will paste the origin out of a browser bar.
		publicEnv.PUBLIC_API_ORIGIN = 'https://api.skill-uv.com/';
		expect(apiBase()).toBe('https://api.skill-uv.com/api');
	});
});

describe('publicBase', () => {
	it('is the bare origin, with no /api prefix', () => {
		// The maintainer-digest endpoints are deliberately served outside the
		// prefix; adding it here would 404 the opt-in flow.
		publicEnv.PUBLIC_API_ORIGIN = 'https://api.skill-uv.com';
		expect(publicBase()).toBe('https://api.skill-uv.com');
	});

	it('is empty when calls stay relative', () => {
		expect(publicBase()).toBe('');
	});
});

describe('wsUrl', () => {
	it('follows the API origin rather than the page', () => {
		// Pointing the socket at window.location sends it to the SvelteKit
		// server, which has no /ws route — the exact 404 seen in the e2e logs.
		publicEnv.PUBLIC_API_ORIGIN = 'https://api.skill-uv.com';
		expect(wsUrl()).toBe('wss://api.skill-uv.com/ws');
	});

	it('downgrades to ws for a plain-http origin', () => {
		publicEnv.PUBLIC_API_ORIGIN = 'http://localhost:3001';
		expect(wsUrl()).toBe('ws://localhost:3001/ws');
	});

	it('falls back to the page host when nothing is declared', () => {
		expect(wsUrl()).toBe(`ws://${window.location.host}/ws`);
	});
});

describe('apiOrigin', () => {
	it('is empty rather than undefined when unset', () => {
		// Callers concatenate it; `undefined` would reach a URL as a literal.
		expect(apiOrigin()).toBe('');
	});
});
