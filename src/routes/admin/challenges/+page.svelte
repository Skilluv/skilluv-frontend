<script lang="ts">
	import { adminApi } from '$api/admin';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { i18n } from '$lib/i18n';
	import type { Challenge } from '$types';

	let challenges = $state<Challenge[]>([]);
	let total = $state(0);
	let loading = $state(true);

	$effect(() => { loadChallenges(); });

	async function loadChallenges() {
		loading = true;
		try {
			const res = await adminApi.listChallenges();
			challenges = res.data.challenges;
			total = res.data.total;
		} catch { /* silent */ }
		loading = false;
	}

	async function publish(id: string) {
		try {
			await adminApi.publishChallenge(id);
			const c = challenges.find((ch) => ch.id === id);
			if (c) c.status = 'published';
		} catch { /* silent */ }
	}

	async function archive(id: string) {
		try {
			await adminApi.archiveChallenge(id);
			const c = challenges.find((ch) => ch.id === id);
			if (c) c.status = 'archived';
		} catch { /* silent */ }
	}

	const statusColors: Record<string, string> = {
		draft: 'warning', published: 'success', archived: 'default'
	};
</script>

<svelte:head>
	<title>{i18n.t('admin.challenges.title')} — Admin Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">{i18n.t('admin.challenges.title')}</h1>
			<p class="text-text-muted">{total} {i18n.t('admin.challenges.total')}</p>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-col gap-3">{#each Array(5) as _}<Skeleton class="h-16 w-full" rounded="xl" />{/each}</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each challenges as ch}
				<div class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4">
					<div class="flex-1">
						<div class="mb-1 flex items-center gap-2">
							<span class="font-medium">{ch.title}</span>
							<Badge variant={statusColors[ch.status] as any}>{ch.status}</Badge>
							<Badge variant={ch.skill_domain as any}>{ch.skill_domain}</Badge>
						</div>
						<p class="text-xs text-text-muted line-clamp-1">{ch.description}</p>
					</div>
					<div class="flex gap-2">
						{#if ch.status === 'draft'}
							<Button variant="primary" size="sm" onclick={() => publish(ch.id)}>{i18n.t('admin.challenges.publishBtn')}</Button>
						{/if}
						{#if ch.status === 'published'}
							<Button variant="ghost" size="sm" onclick={() => archive(ch.id)}>{i18n.t('admin.challenges.archiveBtn')}</Button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
