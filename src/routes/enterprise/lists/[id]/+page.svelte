<script lang="ts">
	import { page } from '$app/stores';
	import { enterpriseApi } from '$api/enterprise';
	import { SkilluError } from '$api/client';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { i18n } from '$lib/i18n';
	import type { TalentCard } from '$types';
	import { X } from '@lucide/svelte';

	let listId = $derived($page.params.id ?? '');
	let listName = $state('');
	let listDesc = $state('');
	let talents = $state<TalentCard[]>([]);
	let loading = $state(true);
	let error = $state('');

	const titleColors: Record<string, string> = {
		apprenti: 'text-text-muted', artisan: 'text-blue-400', maitre: 'text-accent', legende: 'text-yellow-400'
	};

	$effect(() => {
		if (listId) loadList(listId);
	});

	async function loadList(id: string) {
		loading = true;
		try {
			const res = await enterpriseApi.getList(id);
			listName = res.data.list.name;
			listDesc = res.data.list.description ?? '';
			talents = res.data.talents;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function removeTalent(talentId: string) {
		try {
			await enterpriseApi.removeTalentFromList(listId, talentId);
			talents = talents.filter((t) => t.id !== talentId);
		} catch { /* silent */ }
	}
</script>

<svelte:head>
	<title>{listName || 'Liste'} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<a href="/enterprise/lists" class="mb-4 inline-block text-sm text-text-muted hover:text-text-primary">{i18n.t('enterprise.lists.backToLists')}</a>

	{#if loading}
		<Skeleton class="mb-2 h-7 w-48" />
		<Skeleton class="mb-6 h-4 w-32" />
		<div class="flex flex-col gap-3">{#each Array(3) as _}<Skeleton class="h-16 w-full" rounded="xl" />{/each}</div>
	{:else if error}
		<p class="py-8 text-text-muted">{error}</p>
	{:else}
		<h1 class="mb-1 text-2xl font-bold">{listName}</h1>
		{#if listDesc}
			<p class="mb-6 text-text-muted">{listDesc}</p>
		{/if}

		{#if talents.length === 0}
			<div class="py-12 text-center">
				<p class="text-text-muted">{i18n.t('enterprise.lists.emptyList')}</p>
				<Button variant="accent" href="/enterprise/talents" class="mt-4">{i18n.t('enterprise.lists.emptyListAction')}</Button>
			</div>
		{:else}
			<p class="mb-4 text-sm text-text-muted">{talents.length} talent{talents.length !== 1 ? 's' : ''}</p>
			<div class="flex flex-col gap-3">
				{#each talents as talent}
					<div class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4">
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-overlay font-bold text-text-muted">
							{talent.display_name.charAt(0).toUpperCase()}
						</div>
						<a href="/profile/{talent.username}" class="flex-1">
							<p class="font-medium hover:text-accent">{talent.display_name}</p>
							<div class="flex items-center gap-2 text-xs">
								<span class="capitalize {titleColors[talent.title]}">{talent.title}</span>
								<Badge variant={talent.skill_domain as any}>{talent.skill_domain}</Badge>
								<span class="text-accent">{talent.total_fragments} ◆</span>
							</div>
						</a>
						<button class="text-text-muted hover:text-error" onclick={() => removeTalent(talent.id)} aria-label={i18n.locale === 'fr' ? 'Retirer' : 'Remove'}>
							<X size={16} strokeWidth={2} />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
