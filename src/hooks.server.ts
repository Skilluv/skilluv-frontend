import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { UserPrivate } from '$lib/types';

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

	return resolve(event);
};
