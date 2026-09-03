<script lang="ts">
	import { i18n } from '$lib/i18n';
	import type { Title } from '$types';

	interface Props {
		title: Title;
		goldenStars?: number;
		size?: 'sm' | 'md' | 'lg';
	}

	let { title, goldenStars = 0, size = 'md' }: Props = $props();

	// Every colour is a theme token. The literal shades these replaced were
	// picked on a dark ground and read at about 2:1 on a light one — and the
	// tint is deliberately dropped to /10 because these badges also sit on the
	// categorical surfaces, where a /15 wash stacks on an already-coloured
	// background and eats the contrast the text needs.
	const titleStyles: Record<Title, string> = {
		apprenti: 'bg-text-muted/10 text-text-muted border-text-muted/20',
		artisan: 'bg-rank-artisan/10 text-rank-artisan border-rank-artisan/20',
		maitre: 'bg-rank-maitre/10 text-rank-maitre border-rank-maitre/20',
		legende: 'bg-rank-doyen/10 text-rank-doyen border-rank-doyen/20'
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
