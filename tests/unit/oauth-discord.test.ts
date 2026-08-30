import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({ env: {} }));

import {
	OAUTH_PROVIDERS,
	SIGN_IN_PROVIDERS,
	LINKABLE_PROVIDERS,
	isSignInProvider,
	linkUrl
} from '$api/oauth_links';

/**
 * Discord is link-only, and that single fact is what these pin.
 *
 * The account surface refuses to unlink a provider when it is the only way
 * back in. Counting Discord in that total gets it wrong in both directions: it
 * refuses a harmless unlink when Discord is the only link left, and it permits
 * a dangerous one when the pair is Google + Discord and Google is the only
 * real door. The second is the one that costs somebody their account.
 */
describe('sign-in providers', () => {
	it('knows Discord is not a way to sign in', () => {
		expect(isSignInProvider('discord')).toBe(false);
	});

	it('knows the three that are', () => {
		for (const p of ['github', 'google', 'linkedin']) {
			expect(isSignInProvider(p)).toBe(true);
		}
	});

	it('treats an unknown provider as not a way in', () => {
		// Fail closed on the count, open on the unlink: a provider nobody has
		// declared cannot be somebody's only door, and assuming it is would
		// block them from removing it.
		expect(isSignInProvider('mastodon')).toBe(false);
	});

	it('keeps Discord among the providers an account can carry', () => {
		expect(OAUTH_PROVIDERS).toContain('discord');
		expect(SIGN_IN_PROVIDERS).not.toContain('discord');
	});

	it('offers Discord for linking from the settings surface', () => {
		expect(LINKABLE_PROVIDERS).toContain('discord');
	});

	it('does not offer GitHub there', () => {
		// GitHub links through the repo-sync flow, which carries different
		// scopes; offering it twice would grant the narrow one and look broken.
		expect(LINKABLE_PROVIDERS).not.toContain('github');
	});
});

describe('linkUrl', () => {
	it('points at the provider link endpoint', () => {
		expect(linkUrl('discord')).toBe('/api/auth/discord/link');
	});

	it('follows the API origin when one is declared', () => {
		// A relative path would send the consent flow to the SvelteKit server,
		// which has no such route — the failure only appears once the API moves
		// to its own host, which is exactly when nobody is looking for it.
		expect(linkUrl('discord', 'https://api.skill-uv.com/api')).toBe(
			'https://api.skill-uv.com/api/auth/discord/link'
		);
	});
});
