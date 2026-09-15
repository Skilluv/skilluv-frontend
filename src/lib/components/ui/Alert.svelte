<script lang="ts">
	/**
	 * A short message about something that just happened, in place.
	 *
	 * Not a toast: a toast is for something the reader may miss and does not
	 * need to act on. This is for the opposite — a failure they are standing
	 * in front of, which has to stay on screen while they decide what to do
	 * about it, and which may carry a way out.
	 *
	 * ## Why it exists
	 *
	 * This markup was written by hand a hundred and twenty-two times. Every
	 * copy picked its own radius, padding and tint, so the same event looked
	 * like four different things depending on which screen you hit it on:
	 * `p-6` next to `px-3 py-2`, `border-error/30` next to `border-error/40`,
	 * `rounded-lg` next to `rounded-2xl`. Half carried `role="alert"` and
	 * half carried nothing, which is the part that mattered — a screen reader
	 * announced the failure on some screens and stayed silent on others.
	 *
	 * A hundred and fifteen of them are this component now. The seven that
	 * are not were never alerts: a sticky page-wide banner, two "not found"
	 * page heroes, a locked-thread chip whose padlock *is* the message, and
	 * three result panels made of badges, code blocks and buttons with no
	 * sentence in them. They borrow the tint and nothing else, and forcing
	 * them through a component built for a sentence and a way out would make
	 * each of them worse.
	 *
	 * ## On `role`
	 *
	 * `alert` is assertive — it interrupts a screen reader mid-sentence — and
	 * that is right for an error the reader has just caused and is waiting
	 * on. It is wrong for a note that was on the page when it loaded, which
	 * is why the role follows the tone rather than the component: `error`
	 * asserts, everything else is polite.
	 */
	import type { Snippet } from 'svelte';
	import { AlertTriangle, CheckCircle2, Info, XCircle } from '@lucide/svelte';

	type Tone = 'error' | 'warning' | 'success' | 'info';

	interface Props {
		tone?: Tone;
		/**
		 * `sm` for a one-line refusal under a field, `lg` for the block that
		 * stands in for a page that could not load. `md` is everything else.
		 */
		size?: 'sm' | 'md' | 'lg';
		/**
		 * `center` for the block that replaces a page's whole content — it
		 * reads as a state, not as a note attached to something above it.
		 */
		align?: 'left' | 'center';
		/** Bold first line. Omit for a single-sentence message. */
		title?: string;
		children?: Snippet;
		/** A way out: one button or link, rendered under the message. */
		action?: Snippet;
		/**
		 * Overrides what the tone would announce. `none` for a panel that was
		 * on the page before the reader did anything — a danger zone, a
		 * standing caveat. Those are styled like a failure and are not one,
		 * and letting them assert would interrupt a screen reader to read out
		 * something nothing had just caused.
		 */
		role?: 'alert' | 'status' | 'none';
		class?: string;
	}

	let {
		tone = 'info',
		size = 'md',
		align = 'left',
		title,
		children,
		action,
		role,
		class: className = ''
	}: Props = $props();

	// Theme tokens, never palette literals: the shades these replace were
	// chosen against a dark ground and read at about 2:1 on a light one.
	const TONES: Record<Tone, string> = {
		error: 'border-error/40 bg-error/5 text-error',
		warning: 'border-warning/40 bg-warning/5 text-warning',
		success: 'border-success/40 bg-success/5 text-success',
		info: 'border-border bg-surface-overlay text-text-primary'
	};

	const SIZES: Record<NonNullable<Props['size']>, string> = {
		sm: 'rounded-lg px-3 py-2 gap-2',
		md: 'rounded-xl p-4 gap-3',
		lg: 'rounded-2xl p-6 gap-3'
	};

	const ICONS: Record<Tone, typeof Info> = {
		error: XCircle,
		warning: AlertTriangle,
		success: CheckCircle2,
		info: Info
	};

	let Icon = $derived(ICONS[tone]);
	let centered = $derived(align === 'center');
	let iconSize = $derived(size === 'lg' ? 20 : 16);

	// `none` has to reach the DOM as no attribute at all: `role="none"`
	// removes the element's semantics, which is a different thing from
	// having none to announce.
	let resolvedRole = $derived(role ?? (tone === 'error' ? 'alert' : 'status'));
</script>

<div
	class="flex border text-sm {centered
		? 'flex-col items-center text-center'
		: 'items-start'} {SIZES[size]} {TONES[tone]} {className}"
	role={resolvedRole === 'none' ? undefined : resolvedRole}
>
	<Icon
		size={iconSize}
		strokeWidth={2}
		class={centered ? 'shrink-0' : 'mt-0.5 shrink-0'}
		aria-hidden="true"
	/>

	<div class="min-w-0 {centered ? '' : 'flex-1'}">
		{#if title}
			<p class="font-semibold">{title}</p>
		{/if}
		{#if children}
			<!-- Muted under a title, full strength on its own: a lone sentence
			     is the message, a sentence under a heading is its detail. -->
			<div class={title ? 'mt-1 opacity-90' : ''}>{@render children()}</div>
		{/if}
		{#if action}
			<div class="mt-3">{@render action()}</div>
		{/if}
	</div>
</div>
