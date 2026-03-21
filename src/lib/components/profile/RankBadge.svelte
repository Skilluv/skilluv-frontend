<script lang="ts">
	import { i18n } from '$lib/i18n';
	import type { Title } from '$types';

	interface Props {
		title: Title;
		goldenStars?: number;
		size?: 'sm' | 'md' | 'lg';
	}

	let { title, goldenStars = 0, size = 'md' }: Props = $props();

	const titleStyles: Record<Title, string> = {
		apprenti: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
		artisan: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
		maitre: 'bg-accent/15 text-accent border-accent/20',
		legende: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20 shadow-[0_0_12px_rgba(234,179,8,0.2)]'
	};

	const sizeStyles: Record<string, string> = {
		sm: 'px-2 py-0.5 text-xs gap-1',
		md: 'px-3 py-1 text-sm gap-1.5',
		lg: 'px-4 py-1.5 text-base gap-2'
	};

	let stars = $derived(Math.min(goldenStars, 10));
</script>

<span
	class="inline-flex items-center rounded-lg border font-bold capitalize {titleStyles[title]} {sizeStyles[size]}"
>
	{i18n.t(`common.titles.${title}`)}
	{#if stars > 0}
		<span class="text-yellow-400">
			{'★'.repeat(stars)}
		</span>
	{/if}
</span>
