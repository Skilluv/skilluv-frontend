<script lang="ts">
	import { i18n } from '$lib/i18n';
	import type { Challenge } from '$lib/types';

	interface Props {
		challenge: Challenge;
		locked?: boolean;
	}

	let { challenge, locked = false }: Props = $props();

	const domainDot: Record<string, string> = {
		code: 'bg-blue-500', design: 'bg-pink-500', game: 'bg-green-500', security: 'bg-red-500'
	};

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
	class="group flex flex-col rounded-xl border border-border bg-surface-elevated overflow-hidden transition-colors duration-200
		{locked ? 'cursor-not-allowed opacity-50' : 'hover:border-text-muted/40'}"
	aria-disabled={locked}
>
	<!-- Header bar -->
	<div class="flex items-center gap-2 border-b border-border px-4 py-2.5">
		<div class="h-2.5 w-2.5 rounded-sm {domainDot[challenge.skill_domain] ?? 'bg-text-muted'}"></div>
		<span class="text-xs font-mono text-text-muted capitalize">{i18n.t(`common.domains.${challenge.skill_domain}`)}</span>
		{#if challenge.language}
			<span class="text-xs text-text-muted">· {challenge.language}</span>
		{/if}
		<span class="ml-auto text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5">
			{i18n.t(`common.difficulty.${challenge.difficulty}`)}
		</span>
		{#if locked}
			<svg class="h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
			</svg>
		{/if}
	</div>

	<!-- Content -->
	<div class="p-4 flex-1 flex flex-col">
		<h3 class="text-sm font-semibold mb-1 transition-colors duration-200 group-hover:text-accent">{challenge.title}</h3>
		<p class="text-xs text-text-muted line-clamp-2 mb-4 flex-1">{challenge.description}</p>

		<!-- Footer -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3 text-xs text-text-muted">
				<span>{formatDuration(challenge.duration_minutes)}</span>
				{#if challenge.mode === 'team'}
					<span class="border border-border rounded px-1.5 py-0.5 text-[10px]">{i18n.t('common.team')}</span>
				{/if}
				{#if !challenge.ai_allowed}
					<span class="border border-error/30 text-error rounded px-1.5 py-0.5 text-[10px]">{i18n.t('challenges.detail.noAi')}</span>
				{/if}
			</div>
			<span class="text-sm font-bold text-accent">+{challenge.reward_fragments} ◆</span>
		</div>
	</div>
</a>
