import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { theme } from '$stores/theme.svelte';

/**
 * The default colour mode, pinned in the two places that decide it.
 *
 * `app.html` paints `data-theme` from an inline script that runs before
 * hydration, and the store carries the same default for everything after. They
 * are separate literals in separate languages, and nothing links them: if one
 * changes alone the page renders in one mode and flips to the other the moment
 * Svelte takes over — a flash that looks like a rendering bug rather than a
 * wrong constant, which is why it is worth a test.
 */
describe('the default colour mode', () => {
	it('is light in the store', () => {
		expect(theme.mode).toBe('light');
	});

	it('resolves to a light theme name before anything is stored', () => {
		// `current` is what reaches `data-theme`, and only the `-light` suffix
		// selects the light palette.
		expect(theme.current).toBe('forge-light');
	});

	it('is light in the pre-hydration script too', () => {
		const html = readFileSync('src/app.html', 'utf-8');
		expect(html).toContain("localStorage.getItem('skilluv-mode') || 'light'");
	});
});

describe('the site-wide meta description', () => {
	it('carries both languages, since the file is emitted before the locale is known', () => {
		const html = readFileSync('src/app.html', 'utf-8');
		const match = html.match(/name="description"\s*\n?\s*content="([^"]+)"/);
		expect(match).not.toBeNull();
		const content = match![1];
		expect(content).toContain('Prove what you can actually build');
		expect(content).toContain('Prouve ce que tu sais faire');
	});
});
