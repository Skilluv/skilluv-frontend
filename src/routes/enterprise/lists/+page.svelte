<script lang="ts">
	import { enterpriseApi } from '$api/enterprise';
	import { SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { i18n } from '$lib/i18n';

	let lists = $state<{ id: string; name: string; description: string | null; talent_count: number; created_at: string }[]>([]);
	let loading = $state(true);
	let error = $state('');
	let creating = $state(false);
	let showForm = $state(false);
	let newName = $state('');
	let newDesc = $state('');

	$effect(() => { loadLists(); });

	async function loadLists() {
		loading = true;
		try {
			const res = await enterpriseApi.getLists();
			lists = res.data.lists;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function createList(e: SubmitEvent) {
		e.preventDefault();
		if (!newName.trim()) return;
		creating = true;
		try {
			const res = await enterpriseApi.createList(newName.trim(), newDesc.trim() || undefined);
			lists = [...lists, res.data.list];
			newName = '';
			newDesc = '';
			showForm = false;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
		} finally {
			creating = false;
		}
	}

	async function deleteList(id: string) {
		try {
			await enterpriseApi.deleteList(id);
			lists = lists.filter((l) => l.id !== id);
		} catch { /* silent */ }
	}
</script>

<svelte:head>
	<title>{i18n.t('enterprise.lists.title')} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">{i18n.t('enterprise.lists.title')}</h1>
			<p class="text-text-muted">{i18n.t('enterprise.lists.subtitle')}</p>
		</div>
		<Button variant="accent" size="sm" onclick={() => (showForm = !showForm)}>
			{showForm ? i18n.t('enterprise.lists.cancelBtn') : i18n.t('enterprise.lists.newList')}
		</Button>
	</div>

	{#if showForm}
		<form onsubmit={createList} class="mb-6 rounded-2xl border border-border bg-surface-elevated p-4">
			<div class="flex flex-col gap-3">
				<Input label={i18n.t('enterprise.lists.listName')} placeholder="" bind:value={newName} required />
				<Input label={i18n.t('enterprise.lists.description')} placeholder="" bind:value={newDesc} />
				<Button variant="primary" size="sm" type="submit" loading={creating}>{i18n.t('enterprise.lists.createBtn')}</Button>
			</div>
		</form>
	{/if}

	{#if loading}
		<div class="flex flex-col gap-3">
			{#each Array(3) as _}
				<Skeleton class="h-16 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if lists.length === 0 && !showForm}
		<div class="rounded-2xl border border-border bg-surface-elevated p-16 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-overlay text-text-muted">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="8" x2="21" y1="6" y2="6" />
					<line x1="8" x2="21" y1="12" y2="12" />
					<line x1="8" x2="21" y1="18" y2="18" />
					<line x1="3" x2="3.01" y1="6" y2="6" />
					<line x1="3" x2="3.01" y1="12" y2="12" />
					<line x1="3" x2="3.01" y1="18" y2="18" />
				</svg>
			</div>
			<p class="text-base text-text-muted">{i18n.t('enterprise.lists.empty')}</p>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each lists as list}
				<div class="flex items-center justify-between rounded-2xl border border-border bg-surface-elevated p-4">
					<a href="/enterprise/lists/{list.id}" class="flex-1">
						<p class="font-medium hover:text-accent">{list.name}</p>
						<div class="flex items-center gap-3 text-xs text-text-muted">
							<span>{list.talent_count} talent{list.talent_count !== 1 ? 's' : ''}</span>
							{#if list.description}
								<span>· {list.description}</span>
							{/if}
						</div>
					</a>
					<button class="text-sm text-text-muted hover:text-error" onclick={() => deleteList(list.id)} title={i18n.t('common.actions.delete')}>✕</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
