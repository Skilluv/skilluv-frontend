/**
 * Minimal mock backend for the mocked e2e suite (`tests/e2e/*.test.ts`).
 *
 * Authentication state is resolved server-side in `src/hooks.server.ts`, which
 * calls `GET {API_URL}/auth/me` with the `access_token` cookie. That request
 * leaves the Node process, so `page.route()` cannot intercept it and mocking
 * `/auth/me` in the browser has no effect on `data.user`. Without this server
 * every "signed-in user" test actually renders an anonymous page.
 *
 * Contract: a test picks its identity by setting the `access_token` cookie to
 * one of the fixture names below. An unknown token returns 401, i.e. an
 * anonymous visitor.
 *
 * Everything else returns 404; browser calls are mocked inside the specs.
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_BACKEND_PORT ?? 3001);

const baseUser = {
	id: 'u-challenger',
	email: 'kofi@example.com',
	username: 'kofi',
	first_name: 'Kofi',
	last_name: 'Adjovi',
	display_name: 'Kofi Adjovi',
	role: 'user',
	skill_domain: 'code',
	profile_completed: true,
	title: 'artisan',
	golden_stars: 0,
	total_fragments: 0,
	streak_current: 0,
	trust_score: 100,
	country: 'BJ',
	city: 'Cotonou',
	bio: null,
	avatar_url: null,
	github: 'kofi',
	linkedin: null,
	website: null,
	twitter: null,
	email_verified: true,
	totp_enabled: false,
	email_2fa_enabled: false,
	profile_active: true,
	created_at: '2026-01-01'
};

export const USERS = {
	challenger: baseUser,
	validator: {
		...baseUser,
		id: 'u-validator',
		email: 'ama@example.com',
		username: 'ama',
		first_name: 'Ama',
		last_name: 'Doe',
		display_name: 'Ama Doe'
	}
};

function readToken(cookieHeader) {
	if (!cookieHeader) return null;
	for (const part of cookieHeader.split(';')) {
		const [name, ...rest] = part.trim().split('=');
		if (name === 'access_token') return rest.join('=');
	}
	return null;
}

function send(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(payload)
	});
	res.end(payload);
}

const server = createServer((req, res) => {
	const path = new URL(req.url, 'http://localhost').pathname;

	if (path === '/api/auth/me') {
		const user = USERS[readToken(req.headers.cookie) ?? ''];
		if (!user) {
			return send(res, 401, {
				error: { code: 'AUTH_UNAUTHORIZED', message: 'Session invalide' },
				meta: { request_id: 'mock', timestamp: '2026-08-11' }
			});
		}
		return send(res, 200, { data: { user, has_passkey: false } });
	}

	return send(res, 404, {
		error: { code: 'NOT_FOUND', message: `mock-backend: ${path}` },
		meta: { request_id: 'mock', timestamp: '2026-08-11' }
	});
});

server.listen(PORT, () => {
	console.log(`mock-backend listening on http://localhost:${PORT}`);
});
