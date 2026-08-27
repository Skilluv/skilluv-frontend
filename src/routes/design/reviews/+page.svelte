<script lang="ts">
	/**
	 * The reviewer's queue: versions waiting for a critique, oldest first.
	 *
	 * The endpoint returns an empty list rather than a refusal for somebody
	 * holding no review capability, because "nothing for you to do" is the
	 * honest answer and a 403 on a queue reads as a bug. The page cannot tell
	 * the two apart either, so the empty state says both out loud instead of
	 * guessing which one the reader is in.
	 *
	 * Also carries the design suggestion list, because a reviewer with an empty
	 * queue is exactly the person who should be handed something to work on.
	 */
	import { onMount } from 'svelte';
	import { ArrowRight } from '@lucide/svelte';
	import { designApi } from '$api/design';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import NextChallenges from '$components/design/NextChallenges.svelte';

	/**
	 * The queue rows are `json!({"slices": …})` server-side with no declared
	 * schema, so only the fields every row is known to carry are read, and each
	 * is read defensively.
	 */
	interface QueueRow {
		id?: string;
		title?: string;
		design_subtype?: string | null;
		orientation_slug?: string | null;
		updated_at?: string | null;
	}

	let rows = $state<QueueRow[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await designApi.reviewerQueue(25);
			const data = res.data as { slices?: QueueRow[] } | undefined;
			rows = data?.slices ?? [];
		} catch (err) {
			rows = [];
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('designWorkshop.queueTitle')} · Skilluv</title>
	<meta name="description" content={i18n.t('designWorkshop.queueSubtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold text-text">{i18n.t('designWorkshop.queueTitle')}</h1>
		<p class="text-sm text-text-muted">{i18n.t('designWorkshop.queueSubtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-40 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if rows.length === 0}
		<EmptyState
			title={i18n.t('designWorkshop.queueEmpty')}
			body={i18n.t('designWorkshop.queueEmptyHint')}
			size="sm"
		/>
	{:else}
		<ul class="space-y-3" data-testid="design-review-queue">
			{#each rows as row (row.id)}
				<li class="rounded-xl border border-border bg-surface-elevated p-4">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div class="min-w-0 space-y-1">
							<h2 class="truncate text-sm font-bold text-text">
								{row.title ?? row.id ?? ''}
							</h2>
							<div class="flex flex-wrap items-center gap-2 text-xs text-text-muted">
								{#if row.orientation_slug}<span>{row.orientation_slug}</span>{/if}
								{#if row.design_subtype}<span>{row.design_subtype}</span>{/if}
								{#if row.updated_at}<span>{fmtDate(row.updated_at)}</span>{/if}
							</div>
						</div>
						{#if row.id}
							<Button href="/slices/{row.id}" size="sm" variant="ghost">
								{i18n.t('designWorkshop.reviewCta')}
								<ArrowRight size={15} />
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	<NextChallenges />
</div>
