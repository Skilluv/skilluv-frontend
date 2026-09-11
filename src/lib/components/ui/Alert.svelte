<script lang="ts">
	/**
	 * A short message about something that just happened, in place.
	 *
	 * Not a toast: a toast is for something the reader may miss and does not
	 * need to act on. This is for the opposite — a failure they are standing
	 * in front of, which has to stay on screen while they decide what to do
	 * about it, and which may carry a way out.
	 *
	 * The markup it replaces is written by hand in roughly eighty files, each
	 * picking its own radius, padding and tint. Those are left alone rather
	 * than swept: a mass rewrite of eighty templates for visual tidiness buys
	 * one diff nobody can review. New surfaces use this.
	 *
	 * ## On `role`
	 *
	 * `alert` is assertive — it interrupts a screen reader mid-sentence — and
	 * that is right for an error the reader has just caused and is waiting on.
	 * It is wrong for a note that was on the page when it loaded, which is why
	 * the role follows the tone rather than the component: `error` asserts,
	 * everything else is polite.
	 */
	import type { Snippet } from 'svelte';
	import { AlertTriangle, CheckCircle2, Info, XCircle } from '@lucide/svelte';

	type Tone = 'error' | 'warning' | 'success' | 'info';

	interface Props {
		tone?: Tone;
		/** Bold first line. Omit for a single-sentence message. */
		title?: string;
		children?: Snippet;
		/** A way out: one button or link, rendered under the message. */
		action?: Snippet;
		class?: string;
	}

	let { tone = 'info', title, children, action, class: className = '' }: Props = $props();

	// Theme tokens, never palette literals: the eight shades these replace
	// were chosen against a dark ground and read at about 2:1 on a light one.
	const TONES: Record<Tone, { box: string; icon: string }> = {
		error: { box: 'border-error/40 bg-error/5 text-error', icon: 'text-error' },
		warning: { box: 'border-warning/40 bg-warning/5 text-warning', icon: 'text-warning' },
		success: { box: 'border-success/40 bg-success/5 text-success', icon: 'text-success' },
		info: { box: 'border-border bg-surface-overlay text-text-primary', icon: 'text-text-muted' }
	};

	const ICONS: Record<Tone, typeof Info> = {
		error: XCircle,
		warning: AlertTriangle,
		success: CheckCircle2,
		info: Info
	};

	let Icon = $derived(ICONS[tone]);
</script>

<div
	class="flex gap-3 rounded-xl border p-4 {TONES[tone].box} {className}"
	role={tone === 'error' ? 'alert' : 'status'}
>
	<Icon size={16} strokeWidth={2} class="mt-0.5 shrink-0 {TONES[tone].icon}" aria-hidden="true" />

	<div class="min-w-0 flex-1 text-sm">
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
