<script lang="ts">
	import { slicesApi, type ActiveSkilluver } from '$api/slices';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Skeleton from '$components/ui/Skeleton.svelte';

	interface Props {
		projectSlug: string;
	}

	let { projectSlug }: Props = $props();

	let loading = $state(true);
	let error = $state('');
	let count = $state(0);
	let users = $state<ActiveSkilluver[]>([]);

	$effect(() => {
		void projectSlug;
		load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await slicesApi.activeSkilluvers(projectSlug, 30);
			count = res.data.count;
			users = res.data.users;
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('p26.validatorApplication.toastError');
		} finally {
			loading = false;
		}
	}

	function initials(name: string): string {
		return name
			.split(/\s+/)
			.map((p) => p[0]?.toUpperCase() ?? '')
			.join('')
			.slice(0, 2);
	}
</script>

<div class="rounded-2xl border border-border bg-surface-elevated p-4">
	<h3 class="text-sm font-semibold text-text-primary mb-3">{i18n.t('p26.slice.widgets.activeTitle')}</h3>
	{#if loading}
		<Skeleton class="h-10 w-full" rounded="lg" />
	{:else if error}
		<p class="text-xs text-text-muted">{error}</p>
	{:else if count === 0}
		<p class="text-xs text-text-muted">{i18n.t('p26.slice.widgets.activeEmpty')}</p>
	{:else}
		<p class="text-sm text-text-primary mb-3">
			{#if count > 1}
				{i18n.t('p26.slice.widgets.activeCountPlural', { n: count })}
			{:else}
				{i18n.t('p26.slice.widgets.activeCountSingular', { n: count })}
			{/if}
		</p>
		<div class="flex -space-x-2">
			{#each users.slice(0, 5) as u (u.user_id)}
				<a
					href={`/profile/${u.username}`}
					class="relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface-elevated bg-surface-overlay text-xs font-semibold text-text-primary hover:z-10 hover:scale-105 transition-transform overflow-hidden"
					title={u.display_name}
				>
					{#if u.avatar_url}
						<img src={u.avatar_url} alt={u.display_name} class="h-full w-full object-cover" />
					{:else}
						{initials(u.display_name || u.username)}
					{/if}
				</a>
			{/each}
			{#if count > 5}
				<span class="relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface-elevated bg-surface-overlay text-xs font-semibold text-text-muted">
					+{count - 5}
				</span>
			{/if}
		</div>
	{/if}
</div>
