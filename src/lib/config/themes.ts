import type { ThemeBase } from '$lib/types';

/**
 * The theme catalogue — one list, read by every switcher.
 *
 * ## Why this file exists
 *
 * The same five themes were spelled out in three components (the navbar, the
 * footer and the enterprise header) plus the store and the settings page, each
 * with its own copy of the swatch colours. Changing one accent meant four
 * edits, and adding a theme meant seven — which is exactly how a palette drifts
 * apart one component at a time.
 *
 * ## Why the hex values live here and not only in CSS
 *
 * A switcher paints a preview dot for a theme that is *not* currently applied,
 * so it cannot read that theme's CSS custom properties — those only exist once
 * the theme is on the document. The swatch has to be a literal.
 *
 * That leaves two copies of each colour, here and in `app.css`, which is a
 * drift waiting to happen. `tests/unit/theme-catalogue.test.ts` parses the
 * stylesheet and fails if the two disagree, so the duplication cannot rot
 * silently.
 *
 * ## The rule the accents follow
 *
 * No accent sits between 15° and 25° of the logo's orange (39°). A colour that
 * close reads as a failed match rather than a deliberate contrast — near-miss
 * is worse than far-miss. Either take the logo's hue exactly, or leave enough
 * room that nobody wonders whether it was meant.
 */
export interface ThemeEntry {
	key: ThemeBase;
	/** Shown in every switcher. Deliberately not translated: these are names. */
	label: string;
	/** The signature colour, and the switcher's swatch. */
	accent: string;
	/** The secondary, used by the two-dot switchers. */
	primary: string;
	/** The light variant's accent — what a switcher shows in light mode. */
	accentLight: string;
}

export const THEMES: readonly ThemeEntry[] = [
	// Fire on metal. Moved from a sandy #ea8a3d (27°) to a true ember: further
	// from the logo, and closer to what the name promises.
	{ key: 'forge', label: 'Forge', accent: '#ff6c47', accentLight: '#a03318', primary: '#e9c46a' },

	// Dusk over a deep blue ground. Kept warm but lifted and softened, so it
	// reads as the light that remains rather than as a second orange.
	{
		key: 'vesperal',
		label: 'Vespéral',
		accent: '#f2b8a0',
		accentLight: '#8c462c',
		primary: '#e9c46a'
	},

	// Untouched: 44° from the logo, and nobody has ever mistaken it for one.
	{ key: 'arena', label: 'Arena', accent: '#e63946', accentLight: '#b91c1c', primary: '#e9c46a' },

	// Manuscript ink. Same hue as before, two thirds of the saturation — a
	// muted colour stops competing with a vivid one even at the same angle.
	{
		key: 'scriptorium',
		label: 'Scriptorium',
		accent: '#a8794e',
		accentLight: '#815937',
		primary: '#83c5be'
	},

	// Untouched: 64° away, and the only theme whose accent is lighter than its
	// text.
	{ key: 'sakura', label: 'Sakura', accent: '#e8a5c1', accentLight: '#d4739c', primary: '#c47a2e' },

	// The sixth, and the only one outside the warm wedge the other five share.
	// Its accent is the logo's own green, darkened five points so it passes AA
	// as text — 106° from the logo's orange, which makes it simultaneously the
	// most on-brand theme and the furthest from the orange.
	{ key: 'lagune', label: 'Lagune', accent: '#2cdd7c', accentLight: '#087d3c', primary: '#3d8ea1' }
];

/** The logo's orange, as HSL. Every accent is measured against it. */
export const LOGO = { hue: 39, saturation: 100, lightness: 50 } as const;

/** Shortest distance around the wheel, in degrees. */
export function hueDistance(a: number, b: number): number {
	const d = Math.abs(a - b) % 360;
	return d > 180 ? 360 - d : d;
}

/**
 * Whether an accent reads as a failed match rather than a deliberate contrast.
 *
 * A near-miss is a colour close enough to the logo to invite comparison and
 * far enough to lose it. There are three ways out, and each of the six themes
 * uses a different one — which is why the palette reads as varied rather than
 * as one colour with excuses:
 *
 * - **by hue**: far enough round the wheel that nobody compares them at all.
 *   Forge (27°), Arena (44°), Sakura (64°), Lagune (108°).
 * - **by saturation**: same angle, but muted enough to read as a different
 *   material. Scriptorium is the logo's hue at a third of its saturation.
 * - **by lightness**: same angle, but light enough to read as a tint of it
 *   rather than a rival to it. Vesperal.
 *
 * The thresholds are where the eye stops reading "wrong" and starts reading
 * "related" — they are judgements, not physics, and they are written down so
 * the next accent is argued against something.
 */
export const ESCAPE = { hue: 25, saturation: 40, lightness: 25 } as const;

export function isNearMiss(hue: number, saturation: number, lightness: number): boolean {
	return (
		hueDistance(hue, LOGO.hue) < ESCAPE.hue &&
		Math.abs(saturation - LOGO.saturation) < ESCAPE.saturation &&
		Math.abs(lightness - LOGO.lightness) < ESCAPE.lightness
	);
}

export const THEME_KEYS: readonly ThemeBase[] = THEMES.map((t) => t.key);
