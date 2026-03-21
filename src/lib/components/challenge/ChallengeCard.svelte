<script lang="ts">
	import { i18n } from '$lib/i18n';
	import type { Challenge } from '$lib/types';
	import Badge from '$components/ui/Badge.svelte';

	interface Props {
		challenge: Challenge;
		locked?: boolean;
	}

	let { challenge, locked = false }: Props = $props();

	function formatDuration(minutes: number | null): string {
		if (!minutes) return i18n.t('common.time.noLimit');
		if (minutes < 60) return i18n.t('common.time.minutes', { n: minutes });
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m > 0 ? `${h}h${m}` : i18n.t('common.time.hours', { n: h });
	}
</script>

<a
	href={locked ? undefined : `/challenges/${challenge.id}`}
	class="group relative flex flex-col rounded-2xl border border-border bg-surface-elevated p-5 transition-all
		{locked
		? 'cursor-not-allowed opacity-60'
		: 'hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30'}"
	aria-disabled={locked}
>
	{#if locked}
		<div class="absolute right-3 top-3 text-text-muted" title={i18n.t('challenges.locked')}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
			</svg>
		</div>
	{/if}

	<!-- Badges -->
	<div class="mb-3 flex flex-wrap items-center gap-2">
		<Badge variant={challenge.skill_domain}>{i18n.t(`common.domains.${challenge.skill_domain}`)}</Badge>
		<Badge variant={challenge.tone === 'fun' ? 'warning' : 'default'}>{i18n.t(`common.tone.${challenge.tone}`)}</Badge>
		{#if challenge.mode === 'team'}
			<Badge variant="primary">{i18n.t('common.team')}</Badge>
		{/if}
	</div>

	<!-- Titre -->
	<h3 class="mb-2 font-semibold leading-snug group-hover:text-accent transition-colors">
		{challenge.title}
	</h3>

	<!-- Description -->
	<p class="mb-4 flex-1 text-sm text-text-muted line-clamp-2">
		{challenge.description}
	</p>

	<!-- Footer -->
	<div class="flex items-center justify-between text-xs text-text-muted">
		<!-- Difficulté -->
		<div class="flex items-center gap-1.5">
			<span class="flex gap-0.5">
				{#each Array(5) as _, i}
					<span
						class="h-1.5 w-1.5 rounded-full {i < challenge.difficulty
							? 'bg-accent'
							: 'bg-surface-overlay'}"
					></span>
				{/each}
			</span>
			<span>{i18n.t(`common.difficulty.${challenge.difficulty}`)}</span>
		</div>

		<!-- Durée + Fragments -->
		<div class="flex items-center gap-3">
			<span>{formatDuration(challenge.duration_minutes)}</span>
			<span class="font-medium text-accent">+{challenge.reward_fragments} ◆</span>
		</div>
	</div>
</a>
