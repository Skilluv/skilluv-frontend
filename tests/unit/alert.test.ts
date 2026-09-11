import { describe, it, expect } from 'vitest';
import { globSync, readFileSync } from 'node:fs';

/**
 * The alert box, as one component rather than a hundred and twenty-two.
 *
 * These read the source rather than rendering it. What is worth holding in
 * place here is not how the box looks — that is the component's own business
 * and changes — but that nothing went back to hand-rolling it, and that the
 * one behaviour a reader cannot see stays correct: whether a screen reader
 * is interrupted.
 */

const ALERT = 'src/lib/components/ui/Alert.svelte';

/** Every `.svelte` file under `src`, read once, keyed by POSIX path. */
function sources(): Map<string, string> {
	const files = globSync('src/**/*.svelte') as string[];
	return new Map(files.map((f) => [f.replace(/\\/g, '/'), readFileSync(f, 'utf8')]));
}

describe('the alert box is one component', () => {
	it('asserts on an error and stays polite on everything else', () => {
		const src = readFileSync(ALERT, 'utf8');

		// `alert` interrupts a screen reader mid-sentence. That is right for a
		// failure the reader just caused and is waiting on, and wrong for a
		// note that was on the page when it loaded — so the role follows the
		// tone rather than the component.
		expect(src).toContain("role ?? (tone === 'error' ? 'alert' : 'status')");
	});

	it('lets a standing panel opt out of announcing itself', () => {
		const src = readFileSync(ALERT, 'utf8');

		// A danger zone is styled like a failure and is not one. `none` has to
		// reach the DOM as no attribute at all: `role="none"` strips the
		// element's semantics, which is a different thing from having none to
		// announce.
		expect(src).toContain("resolvedRole === 'none' ? undefined : resolvedRole");
	});

	it('reads its colours from theme tokens, never from palette literals', () => {
		const src = readFileSync(ALERT, 'utf8');
		const tones = src.slice(src.indexOf('const TONES'), src.indexOf('const SIZES'));

		// The shades this replaced were fixed literals chosen against dark
		// backgrounds; on a light ground they read at about 2:1 where WCAG AA
		// asks 4.5, and nothing caught it because a label with too little
		// contrast renders perfectly.
		expect(tones).not.toMatch(/\b(red|amber|green|blue|slate|zinc)-[0-9]{3}\b/);
		expect(tones).toContain('border-error/40');
	});
});

describe('nothing went back to hand-rolling it', () => {
	/**
	 * The boxes that are deliberately not alerts.
	 *
	 * A sticky page-wide banner, two "not found" page heroes, a locked-thread
	 * chip whose padlock is the message, and three result panels built out of
	 * badges, code blocks and buttons with no sentence in them. They borrow
	 * the tint and nothing else.
	 */
	const EXEMPT = [
		'src/lib/components/ui/Alert.svelte',
		'src/lib/components/auth/EmailVerificationBanner.svelte',
		'src/routes/diplomas/verify/[code]/+page.svelte',
		'src/routes/forum/[id]/+page.svelte',
		'src/routes/marketplace/[id]/+page.svelte',
		'src/routes/security/+page.svelte',
		'src/routes/slices/[id]/+page.svelte',
		'src/routes/validations/[slice_id]/review/+page.svelte'
	];

	it('no new file hand-writes the box', () => {
		// `border-<tone>/NN` together with `bg-<tone>/N` on one element is what
		// makes it one of these boxes rather than an icon chip, which is why
		// the two are required together.
		const pattern =
			/<[a-z]+ class="[^"]*\bborder-(error|warning|success)\/(?:30|40)\b[^"]*\bbg-\1\/(?:5|10)\b[^"]*"/;

		const offenders: string[] = [];
		for (const [file, src] of sources()) {
			if (EXEMPT.includes(file)) continue;
			if (pattern.test(src)) offenders.push(file);
		}

		expect(offenders, `hand-written alert boxes:\n${offenders.join('\n')}`).toEqual([]);
	});

	it('the exemptions are real files, so the list cannot rot quietly', () => {
		const files = sources();
		for (const file of EXEMPT) {
			expect(files.has(file), file).toBe(true);
		}
	});
});
