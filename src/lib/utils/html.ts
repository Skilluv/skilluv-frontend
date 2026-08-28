/**
 * Escape HTML special characters so a user-controlled string is safe to embed
 * inside an `{@html ...}` context.
 *
 * Svelte escapes interpolations by default, but `{@html}` does not, and the
 * i18n `t()` helper substitutes params by plain string replacement without
 * escaping. Any user-controlled value that reaches an `{@html}` must pass
 * through here first — otherwise a display name like `<img onerror=...>` is
 * stored XSS.
 */
export function escapeHtml(input: unknown): string {
	return String(input ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
