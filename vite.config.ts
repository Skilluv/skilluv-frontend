import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
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
