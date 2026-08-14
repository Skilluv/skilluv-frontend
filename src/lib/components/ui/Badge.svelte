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

	const variants: Record<string, string> = {
		default: 'bg-surface-overlay text-text-muted',
		primary: 'bg-primary/15 text-primary',
		accent: 'bg-accent/15 text-accent',
		success: 'bg-success/15 text-success',
		warning: 'bg-warning/15 text-warning',
		error: 'bg-error/15 text-error',
		code: 'bg-blue-400/15 text-blue-400',
		design: 'bg-pink-400/15 text-pink-400',
		game: 'bg-green-400/15 text-green-400',
		security: 'bg-red-400/15 text-red-400',
		ai: 'bg-violet-400/15 text-violet-400',
		ops: 'bg-teal-400/15 text-teal-400',
		soft_skills: 'bg-amber-400/15 text-amber-400',
		quality: 'bg-cyan-400/15 text-cyan-400',
		leadership: 'bg-orange-400/15 text-orange-400',
		audio: 'bg-fuchsia-400/15 text-fuchsia-400',
		communication: 'bg-amber-400/15 text-amber-400',
		education: 'bg-lime-400/15 text-lime-400'
	};

	const sizes: Record<string, string> = {
		sm: 'px-2 py-0.5 text-xs',
		md: 'px-3 py-1 text-sm'
	};
</script>

<span class="inline-flex items-center gap-1 rounded-lg font-medium {variants[variant]} {sizes[size]}">
	{@render children()}
</span>
