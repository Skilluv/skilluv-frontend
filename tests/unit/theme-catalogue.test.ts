import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { THEMES, THEME_KEYS, LOGO, ESCAPE, hueDistance, isNearMiss } from '$lib/config/themes';

/**
 * The catalogue and the stylesheet must agree, and the palette must stay out of
 * the near-miss band.
 *
 * A switcher paints a preview dot for a theme that is not applied, so it cannot
 * read that theme's custom properties and the swatch has to be a literal. That
 * leaves the same colour written twice, which is a drift waiting to happen —
 * and it had already happened: before the catalogue existed, forge showed
 * #c47a2e in all three switchers while app.css declared #ea8a3d, and
 * scriptorium carried a different value in each of the three files. Nobody
 * noticed, because a wrong swatch looks like a design choice.
 *
 * Every number below is derived from the colour itself. Nothing is asserted
 * against a hand-written hue, because a stale one would wave a bad accent
 * through — which is exactly what happened when this was first written.
 */

const CSS = readFileSync('src/app.css', 'utf-8').replace(/\r\n/g, '\n');

function tokenOf(theme: string, token: string): string | null {
	const block = new RegExp(`\\[data-theme='${theme}'\\] \\{(.*?)\\n\\}`, 's').exec(CSS);
	if (!block) return null;
	const hit = new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{6})`).exec(block[1]);
	return hit ? hit[1].toLowerCase() : null;
}

/** Hue, saturation and lightness in the same units the catalogue reasons in. */
function hsl(hex: string): { h: number; s: number; l: number } {
	const n = hex.replace('#', '');
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === r) h = ((g - b) / d) % 6;
	else if (max === g) h = (b - r) / d + 2;
	else h = (r - g) / d + 4;
	return { h: Math.round((((h * 60) % 360) + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

describe('catalogue and stylesheet', () => {
	it('lists every theme the stylesheet defines, and no others', () => {
		const declared = [...CSS.matchAll(/\[data-theme='([a-z]+)'\] \{/g)].map((m) => m[1]);
		expect([...new Set(declared)].sort()).toEqual([...THEME_KEYS].sort());
	});

	it.each(THEMES.map((t) => [t.key, t.accent] as const))(
		'%s: the dark swatch matches app.css',
		(key, accent) => {
			expect(tokenOf(key, 'sk-accent')).toBe(accent.toLowerCase());
		}
	);

	it.each(THEMES.map((t) => [t.key, t.accentLight] as const))(
		'%s: the light swatch matches app.css',
		(key, accentLight) => {
			expect(tokenOf(`${key}-light`, 'sk-accent')).toBe(accentLight.toLowerCase());
		}
	);
});

describe('the near-miss rule', () => {
	it.each(THEMES.map((t) => [t.key, t.accent] as const))(
		'%s escapes the band by hue, saturation or lightness',
		(key, accent) => {
			const { h, s, l } = hsl(accent);
			const why =
				hueDistance(h, LOGO.hue) >= ESCAPE.hue
					? 'hue'
					: Math.abs(s - LOGO.saturation) >= ESCAPE.saturation
						? 'saturation'
						: Math.abs(l - LOGO.lightness) >= ESCAPE.lightness
							? 'lightness'
							: 'nothing';
			expect(
				isNearMiss(h, s, l),
				`${key} ${accent} is H${h} S${s} L${l} — escapes by ${why}`
			).toBe(false);
		}
	);

	it('uses all three escape routes, not just one', () => {
		// If every theme escaped the same way the palette would be varied on one
		// axis and flat on the others — six hues at one saturation, say. Each
		// route being used is what makes the set read as designed.
		const routes = new Set(
			THEMES.map((t) => {
				const { h, s, l } = hsl(t.accent);
				if (hueDistance(h, LOGO.hue) >= ESCAPE.hue) return 'hue';
				if (Math.abs(s - LOGO.saturation) >= ESCAPE.saturation) return 'saturation';
				return 'lightness';
			})
		);
		expect(routes.size).toBeGreaterThanOrEqual(3);
	});

	it('covers more than one quadrant of the wheel', () => {
		// The five original themes occupied 53° between them — every accent
		// somewhere between red and orange. A palette that narrow reads as one
		// colour with variations, whatever the names say.
		const spread = Math.max(
			...THEMES.map((a) =>
				Math.max(...THEMES.map((b) => hueDistance(hsl(a.accent).h, hsl(b.accent).h)))
			)
		);
		expect(spread).toBeGreaterThan(90);
	});
});

describe('the green thread', () => {
	it.each(THEME_KEYS.map((k) => [k] as const))(
		'%s: success comes from the logo green, not a teal',
		(key) => {
			for (const variant of [key, `${key}-light`]) {
				const v = tokenOf(variant, 'sk-success');
				expect(v, `${variant} has no success token`).not.toBeNull();
				// The logo's green is 145°. The teal it replaces sat at 175 — the
				// same near-miss, on the logo's other colour.
				expect(Math.abs(hsl(v!).h - 145), `${variant} is ${hsl(v!).h}°`).toBeLessThanOrEqual(10);
			}
		}
	);
});
