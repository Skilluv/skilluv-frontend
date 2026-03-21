<script lang="ts">
	import { communityApi } from '$api/community';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
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

<div class="mx-auto max-w-3xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<a href="/community/challenges" class="mb-2 inline-block text-sm text-text-muted hover:text-text-primary">← {i18n.t('common.nav.community')}</a>
			<h1 class="text-2xl font-bold">{i18n.t('community.mine.title')}</h1>
		</div>
		<Button variant="accent" href="/community/challenges/create">+ {i18n.t('community.createBtn')}</Button>
	</div>

	{#if loading}
		<div class="flex flex-col gap-3">{#each Array(3) as _}<Skeleton class="h-20 w-full" rounded="xl" />{/each}</div>
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
