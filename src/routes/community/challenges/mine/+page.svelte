<script lang="ts">
	import { communityApi } from '$api/community';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import { i18n } from '$lib/i18n';
	import type { Challenge } from '$types';

	let challenges = $state<Challenge[]>([]);
	let loading = $state(true);

	const statusColors: Record<string, string> = {
		draft: 'warning', review: 'info', approved: 'success', rejected: 'error'
	};

	$effect(() => { loadMine(); });

	async function loadMine() {
		loading = true;
		try {
			const res = await communityApi.mine();
			challenges = res.data.challenges;
		} catch { /* silent */ }
		loading = false;
	}
</script>

<svelte:head>
	<title>{i18n.t('community.mine.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12 sm:py-16">
	<div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<a href="/community/challenges" class="mb-3 inline-block text-sm text-text-muted hover:text-text-primary">← {i18n.t('common.nav.community')}</a>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
				{i18n.t('community.mine.title')}<span class="text-accent">.</span>
			</h1>
		</div>
		<Button variant="accent" href="/community/challenges/create">+ {i18n.t('community.createBtn')}</Button>
	</div>

	{#if loading}
		<div class="flex flex-col gap-3" aria-busy="true">
			{#each Array(3) as _}
				<div class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4">
					<div class="flex-1">
						<div class="mb-2 flex items-center gap-2">
							<div class="h-4 w-40 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
							<div class="h-5 w-16 rounded-full bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
							<div class="h-5 w-14 rounded-full bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
						</div>
						<div class="h-3 w-full rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
						<div class="mt-2 flex items-center gap-3">
							<div class="h-3 w-12 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
							<div class="h-3 w-10 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if challenges.length === 0}
		<div class="py-12 text-center">
			<p class="mb-4 text-text-muted">{i18n.t('community.mine.empty')}</p>
			<Button variant="accent" href="/community/challenges/create">{i18n.t('community.mine.createFirst')}</Button>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each challenges as ch}
				<div class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4">
					<div class="flex-1">
						<div class="mb-1 flex items-center gap-2">
							<span class="font-medium">{ch.title}</span>
							{#if ch.community_status}
								<Badge variant={statusColors[ch.community_status] as any}>
									{i18n.t(`community.mine.status.${ch.community_status}`)}
								</Badge>
							{/if}
							<Badge variant={ch.skill_domain as any}>{ch.skill_domain}</Badge>
						</div>
						<p class="text-xs text-text-muted line-clamp-1">{ch.description}</p>
						<div class="mt-1 flex items-center gap-3 text-xs text-text-muted">
							<span>▲ {ch.vote_count} {i18n.t('common.votes')}</span>
							<span>+{ch.reward_fragments} ◆</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
