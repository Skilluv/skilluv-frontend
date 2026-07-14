<script lang="ts">
	import { enterpriseApi } from '$api/enterprise';
	import { SkilluError } from '$api/client';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Button from '$components/ui/Button.svelte';
	import { i18n } from '$lib/i18n';
	import { X } from '@lucide/svelte';

	let bookmarks = $state<{
		id: string; username: string; display_name: string; skill_domain: string;
		title: string; golden_stars: number; total_fragments: number;
		country: string | null; bookmarked_at: string;
	}[]>([]);
	let loading = $state(true);
	let error = $state('');

	const titleColors: Record<string, string> = {
		apprenti: 'text-text-muted', artisan: 'text-blue-400', maitre: 'text-accent', legende: 'text-yellow-400'
	};

	$effect(() => { loadBookmarks(); });

	async function loadBookmarks() {
		loading = true;
		try {
			const res = await enterpriseApi.listBookmarks();
			bookmarks = res.data;
		} catch (err) {
			if (err instanceof SkilluError) error = err.message;
			else error = i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	async function removeBookmark(id: string) {
		try {
			await enterpriseApi.removeBookmark(id);
			bookmarks = bookmarks.filter((b) => b.id !== id);
		} catch { /* silent */ }
	}
</script>

<svelte:head>
	<title>{i18n.t('enterprise.bookmarks.title')} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<h1 class="mb-2 text-2xl font-bold">{i18n.t('enterprise.bookmarks.title')}</h1>
	<p class="mb-6 text-text-muted">{i18n.t('enterprise.bookmarks.subtitle')}</p>

	{#if loading}
		<div class="flex flex-col gap-3">
			{#each Array(4) as _}
				<Skeleton class="h-16 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<p class="py-8 text-center text-text-muted">{error}</p>
	{:else if bookmarks.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-16 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-overlay text-text-muted">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
				</svg>
			</div>
			<p class="mb-5 text-base text-text-muted">{i18n.t('enterprise.bookmarks.empty')}</p>
			<Button variant="accent" href="/enterprise/talents">{i18n.t('enterprise.bookmarks.emptyAction')}</Button>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each bookmarks as bk}
				<div class="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-overlay font-bold text-text-muted">
						{bk.display_name.charAt(0).toUpperCase()}
					</div>
					<a href="/profile/{bk.username}" class="flex-1">
						<p class="font-medium hover:text-accent">{bk.display_name}</p>
						<div class="flex items-center gap-2 text-xs">
							<span class="capitalize {titleColors[bk.title]}">{bk.title}</span>
							<Badge variant={bk.skill_domain as any}>{bk.skill_domain}</Badge>
							<span class="text-accent">{bk.total_fragments} ◆</span>
						</div>
					</a>
					<button class="text-text-muted hover:text-error" onclick={() => removeBookmark(bk.id)} title={i18n.t('enterprise.bookmarks.remove')} aria-label={i18n.t('enterprise.bookmarks.remove')}>
						<X size={16} strokeWidth={2} />
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
