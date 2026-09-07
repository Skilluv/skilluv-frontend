import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

/**
 * Target of the dev server `/api` and `/ws` proxies.
 *
 * Defaults to a local backend on :3001. Set `PUBLIC_API_BASE_URL` (origin only,
 * without `/api`) to point at a remote backend; the `parcours/` tests skip
 * themselves while it is empty.
 *
 * Example: PUBLIC_API_BASE_URL=https://api.skill-uv.com
 * `/api/auth/me` then goes to https://api.skill-uv.com/api/auth/me, since the
 * backend serves under the `/api` prefix.
 */
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiTarget = env.PUBLIC_API_BASE_URL || 'http://localhost:3001';

	return {
		plugins: [tailwindcss(), sveltekit()],
		// SE-04: never emit source maps in the build. A .map ships the original
		// source (server logic included), so the prod bundle must carry none —
		// the CI gate enforces it.
		build: {
			sourcemap: false
		},
		server: {
			proxy: {
				'/api': {
					target: apiTarget,
					changeOrigin: true
				},
				'/ws': {
					target: apiTarget,
					ws: true,
					// Same as `/api`, and for a reason that only shows up on a
					// TLS target: without it the Host header stays `localhost:5173`,
					// so the proxy opens the connection with that as its SNI. The
					// edge has no certificate for it and answers with Traefik's
					// default one, which is self-signed — and Node refuses it:
					//
					//   [vite] ws proxy error:
					//   Error: self-signed certificate; if the root CA is installed
					//   locally, try running Node.js with --use-system-ca
					//
					// The suggestion is a red herring: nothing is wrong with the
					// machine's trust store. `openssl s_client -servername localhost`
					// returns `CN=TRAEFIK DEFAULT CERT` where the real name returns
					// the Let's Encrypt certificate. `changeOrigin` rewrites the
					// Host, the SNI follows, and the right certificate is served.
					changeOrigin: true
				}
			}
		},
		test: {
			include: ['tests/unit/**/*.test.ts'],
			environment: 'jsdom',
			setupFiles: ['tests/unit/setup.ts'],
			globals: true,
			// The default 5s is spent setting up the environment, not running
			// assertions: the auth-store tests pass alone and time out in a
			// full run on a loaded machine. A suite that fails for that reason
			// is one people learn to re-run instead of read.
			testTimeout: 30_000,
			hookTimeout: 30_000
		}
	};
});
