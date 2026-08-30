<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { slicesApi, type Slice, type SliceStatus } from '$api/slices';
	import { SkilluError } from '$api/client';
	import { toast } from '$stores/toast.svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Pagination from '$components/ui/Pagination.svelte';

	interface Props {
		data: {
			mine: Slice[];
			mineError: string | null;
			reco: Slice[];
			recoMeta: { user_rank_ord?: number; median_difficulty?: number } | null;
			recoError: string | null;
		};
	}

	let { data }: Props = $props();

	function statusLabel(s: SliceStatus): string {
		return i18n.t(`p26.slice.status.${s}`);
	}

	const STATUS_VARIANT: Record<SliceStatus, 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error'> = {
		open: 'primary',
		claimed: 'accent',
		in_progress: 'warning',
		submitted: 'accent',
		ci_green: 'success',
		pending_validation: 'accent',
		validated: 'success',
		merged: 'success',
		closed: 'default',
		expired: 'error'
	};

	type Tab = 'active' | 'done' | 'archived';
	const ACTIVE: SliceStatus[] = ['claimed', 'in_progress', 'submitted', 'ci_green', 'pending_validation'];
	const DONE: SliceStatus[] = ['validated', 'merged'];
	const ARCHIVED: SliceStatus[] = ['expired', 'closed'];

	let tab = $state<Tab>('active');
	let page = $state(1);
	const perPage = 12;

	let filtered = $derived.by(() => {
		const set = tab === 'active' ? ACTIVE : tab === 'done' ? DONE : ARCHIVED;
		return data.mine.filter((s) => set.includes(s.status));
	});
	let totalPages = $derived(Math.max(1, Math.ceil(filtered.length / perPage)));
	let pageItems = $derived(filtered.slice((page - 1) * perPage, page * perPage));

	$effect(() => {
		void tab;
		page = 1;
	});

	let recoRef: HTMLElement | null = $state(null);
	function scrollToReco() {
		recoRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	// --- Claim from reco ---
	let claimingId = $state<string | null>(null);
	async function quickClaim(s: Slice) {
		claimingId = s.id;
		try {
			await slicesApi.claim(s.id);
			toast.success(i18n.t('p26.dashboardSlices.toastReserved'));
			await goto(resolve(`/slices/${s.id}`));
		} catch (err) {
			if (err instanceof SkilluError && err.status === 403) {
				toast.warning(i18n.t('p26.dashboardSlices.toastGateBlocked'));
			} else {
				toast.error(err instanceof SkilluError ? err.message : i18n.t('p26.dashboardSlices.toastReserveError'));
			}
		} finally {
			claimingId = null;
		}
	}

	function daysLeft(iso: string | null): string | null {
		if (!iso) return null;
		const diff = new Date(iso).getTime() - Date.now();
		if (diff <= 0) return i18n.t('p26.slice.expired');
		return i18n.t('p26.slice.daysLeft', { n: Math.ceil(diff / 86400000) });
	}

	const tabs = $derived([
		{ value: 'active' as const, label: i18n.t('p26.dashboardSlices.tabActive') },
		{ value: 'done' as const, label: i18n.t('p26.dashboardSlices.tabDone') },
		{ value: 'archived' as const, label: i18n.t('p26.dashboardSlices.tabArchived') }
	]);
</script>

<svelte:head>
	<title>{i18n.t('p26.dashboardSlices.seoTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<!-- Section 1 : Mes challenges -->
	<section class="mb-16">
		<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="font-heading text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
					{i18n.t('p26.dashboardSlices.title')}
				</h1>
				<p class="mt-2 text-sm text-text-muted">
					{i18n.t('p26.dashboardSlices.subtitle')}
				</p>
			</div>
			<SegmentedControl items={tabs} bind:value={tab} />
		</div>

		{#if data.mineError}
			<div class="rounded-xl border border-error/30 bg-error/10 p-6 text-center">
				<p class="text-sm text-error">{data.mineError}</p>
			</div>
		{:else if filtered.length === 0}
			{#if tab === 'active'}
				<EmptyState
					variant="scroll"
					title={i18n.t('p26.dashboardSlices.emptyActiveTitle')}
					body={i18n.t('p26.dashboardSlices.emptyActiveBody')}
				>
					{#snippet action()}
						<Button variant="accent" onclick={scrollToReco}>{i18n.t('p26.dashboardSlices.emptyActiveCta')}</Button>
					{/snippet}
				</EmptyState>
			{:else if tab === 'done'}
				<EmptyState variant="seal-intact" title={i18n.t('p26.dashboardSlices.emptyDoneTitle')} />
			{:else}
				<EmptyState variant="bookmark" title={i18n.t('p26.dashboardSlices.emptyArchivedTitle')} />
			{/if}
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each pageItems as s (s.id)}
					<article class="rounded-2xl border border-border bg-surface-elevated p-5 flex flex-col gap-3 hover:border-accent/40 transition-colors">
						<div class="flex flex-wrap items-center gap-2">
							<Badge variant={STATUS_VARIANT[s.status]}>{statusLabel(s.status)}</Badge>
							<Badge variant="default">{i18n.t('p26.dashboardSlices.difficultyBadge', { n: s.difficulty })}</Badge>
							{#if s.claim_expires_at && (s.status === 'claimed' || s.status === 'in_progress')}
								{@const dl = daysLeft(s.claim_expires_at)}
								{#if dl}<Badge variant="warning">{dl}</Badge>{/if}
							{/if}
						</div>
						<h3 class="font-heading text-lg font-semibold text-text-primary line-clamp-2">
							{s.title}
						</h3>
						<p class="text-sm text-text-muted line-clamp-2 flex-1">{s.description}</p>
						<div class="pt-2">
							<Button variant="ghost" size="sm" href={`/slices/${s.id}`}>{i18n.t('p26.dashboardSlices.viewBtn')}</Button>
						</div>
					</article>
				{/each}
			</div>

			<Pagination current={page} total={totalPages} onchange={(p) => (page = p)} />
		{/if}
	</section>

	<!-- Section 2 : Recommandes -->
	<section bind:this={recoRef}>
		<div class="mb-6">
			<h2 class="font-heading text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
				{i18n.t('p26.dashboardSlices.recoTitle')}
			</h2>
			{#if data.recoMeta}
				<p class="mt-2 text-sm text-text-muted">
					{i18n.t('p26.dashboardSlices.recoBasedOnRank')}
					{#if data.recoMeta.user_rank_ord != null}
						(<span class="font-mono">{data.recoMeta.user_rank_ord}</span>)
					{/if}
					{#if data.recoMeta.median_difficulty != null}
						{i18n.t('p26.dashboardSlices.recoMedian', { n: data.recoMeta.median_difficulty })}
					{/if}
				</p>
			{/if}
		</div>

		{#if data.recoError}
			<div class="rounded-xl border border-error/30 bg-error/10 p-6 text-center">
				<p class="text-sm text-error">{data.recoError}</p>
			</div>
		{:else if data.reco.length === 0}
			<EmptyState
				variant="search"
				title={i18n.t('p26.dashboardSlices.recoEmptyTitle')}
				body={i18n.t('p26.dashboardSlices.recoEmptyBody')}
			/>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.reco as s (s.id)}
					<article class="rounded-2xl border border-border bg-surface-elevated p-5 flex flex-col gap-3 hover:border-accent/40 transition-colors">
						<div class="flex flex-wrap items-center gap-2">
							<Badge variant={STATUS_VARIANT[s.status]}>{statusLabel(s.status)}</Badge>
							<Badge variant="default">{i18n.t('p26.dashboardSlices.difficultyBadge', { n: s.difficulty })}</Badge>
							{#if s.min_rank}<Badge variant="default">{i18n.t('p26.dashboardSlices.rankBadge', { rank: s.min_rank })}</Badge>{/if}
						</div>
						<h3 class="font-heading text-lg font-semibold text-text-primary line-clamp-2">
							{s.title}
						</h3>
						<p class="text-sm text-text-muted line-clamp-2 flex-1">{s.description}</p>
						<div class="flex gap-2 pt-2">
							<Button
								variant="primary"
								size="sm"
								loading={claimingId === s.id}
								disabled={claimingId !== null}
								onclick={() => quickClaim(s)}
							>
								{i18n.t('p26.dashboardSlices.claimBtn')}
							</Button>
							<Button variant="ghost" size="sm" href={`/slices/${s.id}`}>{i18n.t('p26.dashboardSlices.detailBtn')}</Button>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>
</div>
