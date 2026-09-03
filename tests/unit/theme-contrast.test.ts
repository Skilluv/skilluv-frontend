import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * WCAG AA on the colours that carry meaning.
 *
 * Every one of these tokens replaced a hardcoded Tailwind shade — `text-blue-400`
 * for the `code` discipline, `text-amber-400` for the `doyen` rank, the fill
 * tokens reused as badge labels. Those literals were chosen against a dark
 * ground and could not follow a theme, so on a light one the discipline labels
 * read at about 2:1 where AA asks 4.5. Nothing caught it: a label with too
 * little contrast renders perfectly, and the light themes were only ever one
 * click away rather than the default.
 *
 * The check is arithmetic on `app.css` rather than a rendered page, because
 * the property has to hold for twelve themes and every surface in each, which
 * no page can exercise. An axe run on one page proves one combination; this
 * proves all of them.
 */
const CSS = readFileSync('src/app.css', 'utf-8');

function luminance(hex: string): number {
	const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
	const lin = ch.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/** Composite `fg` at `alpha` over `bg`, the way a ten-percent wash renders. */
function over(fg: string, bg: string, alpha: number): string {
	const px = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
	const [f, b] = [px(fg), px(bg)];
	return (
		'#' +
		f
			.map((v, i) => Math.round(alpha * v + (1 - alpha) * b[i]))
			.map((v) => v.toString(16).padStart(2, '0'))
			.join('')
	);
}

/** Every `--sk-*` declaration inside one theme block. */
function themeBlocks(): Map<string, Map<string, string>> {
	const out = new Map<string, Map<string, string>>();
	const re = /\[data-theme='([a-z-]+)'\]\s*\{([\s\S]*?)\n\}/g;
	for (const m of CSS.matchAll(re)) {
		const name = m[1];
		if (name.endsWith("$='-light'")) continue;
		const vars = out.get(name) ?? new Map<string, string>();
		for (const d of m[2].matchAll(/--sk-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
			vars.set(d[1], d[2].toLowerCase());
		}
		out.set(name, vars);
	}
	return out;
}

/** Tokens defined once for every light theme by the suffix selector. */
function lightFamily(): Map<string, string> {
	const m = CSS.match(/\[data-theme\$='-light'\]\s*\{([\s\S]*?)\n\}/);
	const out = new Map<string, string>();
	if (!m) return out;
	for (const d of m[1].matchAll(/--sk-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
		out.set(d[1], d[2].toLowerCase());
	}
	return out;
}

/** Tokens on the bare `:root`, which every theme inherits unless it overrides. */
function globals(): Map<string, string> {
	const out = new Map<string, string>();
	for (const m of CSS.matchAll(/(?:^|\n):root[,\s][\s\S]*?\n\}/g)) {
		for (const d of m[0].matchAll(/--sk-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
			if (!out.has(d[1])) out.set(d[1], d[2].toLowerCase());
		}
	}
	return out;
}

const SURFACE_KEYS = [
	'surface',
	'surface-alt',
	'surface-elevated',
	'surface-craft',
	'surface-create',
	'surface-understand',
	'surface-operate',
	'surface-share',
	'surface-meta'
];

const DOMAINS = [
	'code',
	'design',
	'game',
	'security',
	'ai',
	'ops',
	'quality',
	'leadership',
	'audio',
	'communication',
	'education'
];
const RANKS = ['apprenti', 'ranger', 'artisan', 'maitre', 'doyen'];
const SEMANTICS = ['accent', 'success', 'warning', 'error', 'primary', 'info'];

const THEMES = themeBlocks();
const LIGHT = lightFamily();
const GLOBAL = globals();

/** What a token resolves to in one theme, following the real cascade. */
function resolve(theme: string, key: string): string | undefined {
	const own = THEMES.get(theme)?.get(key);
	if (own) return own;
	if (theme.endsWith('-light') && LIGHT.has(key)) return LIGHT.get(key);
	return GLOBAL.get(key);
}

function surfaces(theme: string): string[] {
	const vars = THEMES.get(theme);
	if (!vars) return [];
	return SURFACE_KEYS.map((k) => vars.get(k)).filter((v): v is string => Boolean(v));
}

describe('the theme catalogue is complete enough to test', () => {
	it('finds twelve themes, each with its own surfaces', () => {
		const withSurfaces = [...THEMES.keys()].filter((t) => surfaces(t).length > 0);
		expect(withSurfaces.length).toBe(12);
	});
});

describe('discipline colours clear AA on every surface of their theme', () => {
	for (const theme of [...THEMES.keys()].filter((t) => surfaces(t).length > 0)) {
		for (const domain of DOMAINS) {
			it(`${theme} · ${domain}`, () => {
				const fg = resolve(theme, `domain-${domain}`);
				expect(fg, `--sk-domain-${domain} unresolved in ${theme}`).toBeDefined();
				const worst = Math.min(...surfaces(theme).map((bg) => contrast(fg!, bg)));
				expect(worst).toBeGreaterThanOrEqual(4.5);
			});
		}
	}
});

describe('rank colours clear AA on every surface of their theme', () => {
	for (const theme of [...THEMES.keys()].filter((t) => surfaces(t).length > 0)) {
		for (const rank of RANKS) {
			it(`${theme} · ${rank}`, () => {
				const fg = resolve(theme, `rank-${rank}`);
				expect(fg, `--sk-rank-${rank} unresolved in ${theme}`).toBeDefined();
				const worst = Math.min(...surfaces(theme).map((bg) => contrast(fg!, bg)));
				expect(worst).toBeGreaterThanOrEqual(4.5);
			});
		}
	}
});

describe('soft badge labels clear AA over their own wash', () => {
	/**
	 * A ten-percent accent pill takes its background from whatever is behind it,
	 * so the same badge measured 7:1 on a white card and 2.1:1 on a categorical
	 * ground. The label token has to survive the worst of those, not the best.
	 */
	for (const theme of [...THEMES.keys()].filter((t) => surfaces(t).length > 0)) {
		for (const sem of SEMANTICS) {
			it(`${theme} · ${sem}`, () => {
				const fill = resolve(theme, sem);
				const label = resolve(theme, `${sem}-on`);
				expect(fill, `--sk-${sem} unresolved in ${theme}`).toBeDefined();
				expect(label, `--sk-${sem}-on unresolved in ${theme}`).toBeDefined();
				const worst = Math.min(
					...surfaces(theme).map((bg) => contrast(label!, over(fill!, bg, 0.1)))
				);
				expect(worst).toBeGreaterThanOrEqual(4.5);
			});
		}
	}
});
