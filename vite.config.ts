import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// SE-04: never emit source maps in the build. A .map ships the original
	// source (server logic included), so the prod bundle must carry none — the
	// CI gate `find build -name '*.map'` enforces it.
	build: {
		sourcemap: false
	},
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:3001',
				changeOrigin: true
			},
			'/ws': {
				target: 'http://localhost:3001',
				ws: true
			}
		}
	},
	test: {
		include: ['tests/unit/**/*.test.ts'],
		environment: 'jsdom',
		setupFiles: ['tests/unit/setup.ts'],
		globals: true
	}
});
