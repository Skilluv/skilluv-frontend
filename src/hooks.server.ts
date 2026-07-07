import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { UserPrivate } from '$lib/types';

/**
 * Routes that a user with `profile_completed = false` is still allowed to visit.
 * Anything else redirects to `/onboarding/complete-profile`.
 */
const ONBOARDING_ALLOWLIST = [
	'/onboarding/complete-profile',
	'/auth/', // login, logout, register, magic-link, verify-email, change-email/confirm
	'/legal/',
	'/api/'
];

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('access_token');

	if (accessToken) {
		try {
			const apiUrl = env.API_URL ?? 'http://localhost:3001/api';
			const response = await fetch(`${apiUrl}/auth/me`, {
				headers: {
					Cookie: `access_token=${accessToken}`
				}
			});

			if (response.ok) {
				const body = (await response.json()) as { data: { user: UserPrivate } };
				event.locals.user = body.data.user;
			} else {
				event.locals.user = null;
			}
		} catch {
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	// Pattern C onboarding gate: authenticated users without a completed profile are pinned
	// to the onboarding form until they submit skill_domain + terms.
	const pathname = event.url.pathname;
	if (
		event.locals.user &&
		!event.locals.user.profile_completed &&
		!ONBOARDING_ALLOWLIST.some((prefix) => pathname === prefix.replace(/\/$/, '') || pathname.startsWith(prefix))
	) {
		throw redirect(303, '/onboarding/complete-profile');
	}

	return resolve(event);
};
