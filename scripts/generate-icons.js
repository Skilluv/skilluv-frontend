/**
 * Prints how the icon set is produced.
 *
 * Usage: node scripts/generate-icons.js
 *
 * This used to describe exporting PNGs from `static/icon.svg`, a placeholder
 * that no longer exists — the official artwork arrived as raster. It also
 * listed three sizes when the set needs six, and claimed "the SVG files work
 * directly in all modern browsers", which stopped being the setup the moment
 * the SVG declaration was removed from app.html.
 *
 * Two of those outputs are not resizes and cannot be treated as such:
 *
 *   - the maskable icons, which Android crops to whatever shape the launcher
 *     wants, so they sit on an opaque ground with a 10% safe-zone margin;
 *   - the Apple touch icon, which iOS composites on white when transparent,
 *     putting a white ring around a round mark.
 *
 * Resample in one step from the largest source rather than chaining through
 * intermediate sizes, which softens the outline the mark depends on.
 */

console.log(`
Skilluv — icon set
==================

Source: the official artwork (Favicon.png, 512px, transparent corners).
Ground for opaque variants: #262525 (ink), never the orange — the mark IS an
orange disc, and on an orange ground it loses its silhouette at 48px.

  static/favicon.png             32      transparent
  static/icon-192.png            192     transparent
  static/icon-512.png            512     transparent
  static/icon-192-maskable.png   192     opaque, 10% safe zone
  static/icon-512-maskable.png   512     opaque, 10% safe zone
  static/apple-touch-icon.png    180     opaque, 6% margin
  static/og-image.png            1200x630  opaque, lockup centred

The wordmark ships in two contrast treatments, not five theme colours:
logo-wordmark-light.png for dark surfaces, logo-wordmark-dark.png for light
ones. BrandLogo.svelte picks between them from theme.mode and documents why
the mark itself is never recoloured.

Still owed by design: an SVG set, a lockup with a white outline (the current
one's #262525 outline vanishes on all five dark themes), and a simplified
mark for 16-32px.
`);
