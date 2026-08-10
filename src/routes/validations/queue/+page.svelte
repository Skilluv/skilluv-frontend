<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { validationApi, type ValidationQueueItem } from '$api/validation';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { toast } from '$stores/toast.svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import { ExternalLink } from '@lucide/svelte';

	type Filter = 'all' | 'mine';

	type QueueState =
		| { status: 'loading' }
		| { status: 'ready'; items: ValidationQueueItem[] }
		| { status: 'no-caps' }
		| { status: 'error'; message: string };

	let view: QueueState = $state({ status: 'loading' });

	let filter: Filter = $state('all');
	let pickingId: string | null = $state(null);

	const DOMAIN_BADGE: Record<string, 'code' | 'design' | 'game' | 'security' | 'default'> = {
		code: 'code',
		design: 'design',
		game: 'game',
		security: 'security'
	};

	function domainVariant(domain: string) {
		return DOMAIN_BADGE[domain?.toLowerCase()] ?? 'default';
	}

	function domainFromLabels(item: ValidationQueueItem): string {
		return item.slice.labels.find((l) => DOMAIN_BADGE[l.toLowerCase()]) ?? 'code';
	}

	function shortRepo(url: string): string {
		try {
			const u = new URL(url);
			return `${u.hostname}${u.pathname}`.replace(/^github\.com/, '');
		} catch {
			return url;
		}
	}

	async function load() {
		view = { status: 'loading' };
		if (!auth.isAuthenticated) {
			await goto('/auth/login?next=/validations/queue');
			return;
		}
		try {
			const res = await validationApi.queue();
			view = { status: 'ready', items: res.data.items };
		} catch (err) {
			if (err instanceof SkilluError && err.status === 403) {
				view = { status: 'no-caps' };
				return;
			}
			view = {
				status: 'error',
				message: err instanceof SkilluError ? err.message : i18n.t('p26.validation.toastLoadError')
			};
		}
	}

	onMount(load);

	async function pickup(item: ValidationQueueItem) {
		pickingId = item.slice.id;
		try {
			await validationApi.pickup(item.slice.id);
			if (view.status === 'ready') {
				view = {
					status: 'ready',
					items: view.items.map((it) =>
						it.slice.id === item.slice.id
							? { ...it, picked_up_by_me: true, picked_up_at: new Date().toISOString() }
							: it
					)
				};
			}
			toast.success(i18n.t('p26.validation.toastPickedUp'));
		} catch (err) {
			if (err instanceof SkilluError && err.status === 400) {
				toast.error(i18n.t('p26.validation.toastTakenByOther'));
			} else {
				toast.error(err instanceof SkilluError ? err.message : i18n.t('p26.validation.toastPickupError'));
			}
			// Refetch pour resynchroniser la file (le back est source de verite).
			await load();
		} finally {
			pickingId = null;
		}
	}

	let visibleItems = $derived.by(() => {
		if (view.status !== 'ready') return [];
		return filter === 'mine' ? view.items.filter((i) => i.picked_up_by_me) : view.items;
	});
</script>

<svelte:head>
	<title>{i18n.t('p26.validation.queueSeoTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="font-heading text-3xl font-bold" style:font-family="'Fraunces Variable', Georgia, serif">
				{i18n.t('p26.validation.queueTitle')}
			</h1>
			<p class="mt-1 text-sm text-text-muted">
				{i18n.t('p26.validation.queueSubtitle')}
			</p>
		</div>

		{#if view.status === 'ready' && view.items.length > 0}
			<SegmentedControl
				items={[
					{ value: 'all', label: i18n.t('p26.validation.filterAll') },
					{ value: 'mine', label: i18n.t('p26.validation.filterMine') }
				]}
				bind:value={filter}
				size="sm"
			/>
		{/if}
	</header>

	{#if view.status === 'loading'}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{#each Array(4) as _}
				<Skeleton class="h-48 w-full rounded-2xl" />
			{/each}
		</div>
	{:else if view.status === 'no-caps'}
		<EmptyState
			variant="lantern"
			title={i18n.t('p26.validation.notValidatorTitle')}
			body={i18n.t('p26.validation.notValidatorBody')}
		>
			{#snippet action()}
				<Button variant="primary" href="/settings/validator-application/new">{i18n.t('p26.validation.applyCta')}</Button>
			{/snippet}
		</EmptyState>
	{:else if view.status === 'error'}
		<div class="rounded-2xl border border-error/30 bg-error/5 p-6 text-sm text-error">
			{view.message}
			<div class="mt-3">
				<Button variant="secondary" size="sm" onclick={load}>{i18n.t('p26.validation.retryBtn')}</Button>
			</div>
		</div>
	{:else if visibleItems.length === 0}
		<EmptyState
			variant="search"
			title={i18n.t('p26.validation.emptyTitle')}
			body={i18n.t('p26.validation.emptyBody')}
		/>
	{:else}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{#each visibleItems as item (item.slice.id)}
				{@const domain = domainFromLabels(item)}
				<article class="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-5">
					<div class="flex items-start justify-between gap-3">
						<a
							href={`/slices/${item.slice.id}`}
							class="font-heading text-lg font-semibold leading-tight hover:text-primary"
							style:font-family="'Fraunces Variable', Georgia, serif"
						>
							{item.slice.title}
						</a>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<Badge>{shortRepo(item.repo_url)}</Badge>
						<Badge variant={domainVariant(domain)}>{domain}</Badge>
						<Badge variant="accent">{i18n.t('p26.validation.difficultyBadge', { n: item.slice.difficulty })}</Badge>
					</div>

					<div class="flex items-center gap-3 border-t border-border pt-3">
						{#if item.claimer_avatar_url}
							<img
								src={item.claimer_avatar_url}
								alt=""
								class="h-8 w-8 rounded-full object-cover"
							/>
						{:else}
							<div class="h-8 w-8 rounded-full bg-surface-overlay"></div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{item.claimer_display_name}</p>
							<p class="truncate text-xs text-text-muted">@{item.claimer_username}</p>
						</div>
					</div>

					<div class="mt-1 flex flex-wrap items-center gap-2">
						<Button variant="secondary" size="sm" href={item.pr_url} target="_blank" rel="noopener">
							<ExternalLink size={14} strokeWidth={2} />
							{i18n.t('p26.validation.viewPr')}
						</Button>

						{#if item.picked_up_by_me}
							<Button variant="primary" size="sm" href={`/validations/${item.slice.id}/review`}>
								{i18n.t('p26.validation.reviewBtn')}
							</Button>
						{:else}
							<Button
								variant="primary"
								size="sm"
								loading={pickingId === item.slice.id}
								onclick={() => pickup(item)}
							>
								{i18n.t('p26.validation.pickupBtn')}
							</Button>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
