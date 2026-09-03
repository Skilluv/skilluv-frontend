<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SkillDomain } from '$lib/types';

	interface Props {
		// Derived from SkillDomain rather than spelled out: this list was written
		// by hand and fell behind the catalogue twice.
		variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | SkillDomain;
		size?: 'sm' | 'md';
		children: Snippet;
	}

	let { variant = 'default', size = 'sm', children }: Props = $props();

	/**
	 * Soft badges, on theme tokens rather than palette literals.
	 *
	 * Two things changed here and both were contrast bugs.
	 *
	 * The discipline rows named Tailwind shades — `text-blue-400` and the rest —
	 * which are fixed colours chosen against a dark ground. On a light one they
	 * read at roughly 2:1 where AA asks 4.5. They now name `domain-*` tokens
	 * that follow the theme.
	 *
	 * The semantic rows keep their fill token for the wash and take a dedicated
	 * `*-on` token for the label. The base tokens were designed as backgrounds —
	 * `--sk-error` is annotated "assombri pour contrast avec text-white" — so
	 * using them as text on their own wash measured as low as 2.1:1.
	 *
	 * The tint dropped from /15 to /10 for the same reason across every row: a
	 * badge is not always on a neutral card. Put a /15 wash of its own hue on
	 * one of the categorical surfaces — which are already tinted — and the two
	 * stack into a background dark enough to swallow the text. That is exactly
	 * how `bg-accent/15 text-accent` measured 4.34 on the profile page while
	 * looking perfectly fine.
	 */
	const variants: Record<string, string> = {
		default: 'bg-surface-overlay text-text-muted',
		primary: 'bg-primary/10 text-primary-on',
		accent: 'bg-accent/10 text-accent-on',
		success: 'bg-success/10 text-success-on',
		warning: 'bg-warning/10 text-warning-on',
		error: 'bg-error/10 text-error-on',
		code: 'bg-domain-code/10 text-domain-code',
		design: 'bg-domain-design/10 text-domain-design',
		game: 'bg-domain-game/10 text-domain-game',
		security: 'bg-domain-security/10 text-domain-security',
		ai: 'bg-domain-ai/10 text-domain-ai',
		ops: 'bg-domain-ops/10 text-domain-ops',
		soft_skills: 'bg-domain-communication/10 text-domain-communication',
		quality: 'bg-domain-quality/10 text-domain-quality',
		leadership: 'bg-domain-leadership/10 text-domain-leadership',
		audio: 'bg-domain-audio/10 text-domain-audio',
		communication: 'bg-domain-communication/10 text-domain-communication',
		education: 'bg-domain-education/10 text-domain-education'
	};

	const sizes: Record<string, string> = {
		sm: 'px-2 py-0.5 text-xs',
		md: 'px-3 py-1 text-sm'
	};
</script>

<span class="inline-flex items-center gap-1 rounded-lg font-medium {variants[variant]} {sizes[size]}">
	{@render children()}
</span>
