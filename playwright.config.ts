import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'tests/e2e',
	testMatch: '**/*.test.ts',
	use: {
		baseURL: 'http://localhost:4173',
		screenshot: 'only-on-failure',
		trace: 'on-first-retry'
	},
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'github' : 'list'
});
