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
		server: {
			proxy: {
				'/api': {
					target: apiTarget,
					changeOrigin: true
				},
				'/ws': {
					target: apiTarget,
					ws: true
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
