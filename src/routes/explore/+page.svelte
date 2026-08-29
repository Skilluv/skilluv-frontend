<script lang="ts">
	/**
	 * What is on Skilluv right now — and, for somebody who has a record, what
	 * matches them.
	 *
	 * ## Why explore comes first and the feed second
	 *
	 * `/feed/for-you` matches against the caller's verified work. A newcomer
	 * has none, so a page built on it alone would greet the exact person it
	 * most needs to convince with an empty screen. `/explore` is what exists,
	 * and it is what a first visit reads.
	 *
	 * So the personal feed is a second section that appears when it has
	 * something, not the page's spine.
	 *
	 * ## Sponsored placements are labelled
	 *
	 * `sponsored-challenges/active` is bought. Rendering one among ordinary
	 * challenges without saying so would sell the reader's attention without
	 * telling them — and it is also what makes the placement worth buying
	 * twice, since a sponsor whose name is invisible has not been seen.
	 */
	import { onMount } from 'svelte';
	import { Compass, Megaphone } from '@lucide/svelte';
	import { discoveryApi } from '$api/discovery';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	/** A row from any of these lists: named, and maybe addressable. */
	type Row = {
		id?: string;
		slug?: string;
		title?: string;
		name?: string;
		description?: string;
		[key: string]: unknown;
	};

	let explore = $state<Record<string, unknown> | null>(null);
	let forYou = $state<Row[]>([]);
	let sponsored = $state<Row[]>([]);
	let metrics = $state<Record<string, unknown> | null>(null);
	let loading = $state(true);

	/**
	 * The explore payload is a bag of named lists whose shape is the backend's.
	 * Rather than guess at it, render whichever arrays came back, under their
	 * own keys — a page that hardcoded three sections would go blank the day a
	 * fourth was added and silently drop it.
	 */
	let shelves = $derived(
		Object.entries(explore ?? {})
			.filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0)
			.map(([key, v]) => ({ key, rows: v as Row[] }))
	);

	let nothing = $derived(shelves.length === 0 && forYou.length === 0 && sponsored.length === 0);

	function label(row: Row): string {
		return row.title ?? row.name ?? row.slug ?? '';
	}

	/** A shelf's own word, or its key made readable. */
	function shelfTitle(key: string): string {
		const k = `explore.shelves.${key}`;
		const t = i18n.t(k);
		return t === k ? key.replaceAll('_', ' ') : t;
	}

	async function load() {
		loading = true;
		const [e, f, s, m] = await Promise.allSettled([
			discoveryApi.explore(),
			auth.isAuthenticated ? discoveryApi.forYou({ limit: 12 }) : Promise.resolve(null),
			discoveryApi.sponsoredChallenges(),
			discoveryApi.metrics()
		]);
		if (e.status === 'fulfilled') explore = e.value.data ?? null;
		if (f.status === 'fulfilled' && f.value) forYou = (f.value.data?.items as Row[]) ?? [];
		if (s.status === 'fulfilled') sponsored = (s.value.data?.challenges as Row[]) ?? [];
		if (m.status === 'fulfilled') metrics = m.value.data ?? null;
		loading = false;
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('explore.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('explore.subtitle')} />
	<meta property="og:title" content={i18n.t('explore.title')} />
	<meta property="og:description" content={i18n.t('explore.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 px-4 py-8" data-testid="explore-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Compass size={22} />
			{i18n.t('explore.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('explore.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else}
		{#if metrics}
			<dl
				class="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3"
				data-testid="explore-metrics"
			>
				{#each Object.entries(metrics).filter(([, v]) => typeof v === 'number') as [key, value] (key)}
					<div class="bg-surface-elevated p-4 text-center">
						<dt class="text-xs text-text-muted">{shelfTitle(key)}</dt>
						<dd class="mt-1 text-xl font-bold text-text">
							{(value as number).toLocaleString(i18n.locale)}
						</dd>
					</div>
				{/each}
			</dl>
		{/if}

		{#if sponsored.length > 0}
			<section class="space-y-3" data-testid="explore-sponsored">
				<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
					<Megaphone size={14} />
					{i18n.t('explore.sponsoredTitle')}
				</h2>
				<!-- Said, not implied. A placement whose sponsorship is invisible
				     sells attention without telling the reader. -->
				<p class="text-sm text-text-muted">{i18n.t('explore.sponsoredHint')}</p>
				<ul class="space-y-2">
					{#each sponsored as row (row.id ?? row.slug)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-center gap-2">
								<span class="text-sm font-bold text-text">{label(row)}</span>
								<Badge size="sm" variant="warning">{i18n.t('explore.sponsoredBadge')}</Badge>
							</div>
							{#if row.description}
								<p class="mt-1 text-sm text-text-muted">{row.description}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#each shelves as shelf (shelf.key)}
			<section class="space-y-3">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{shelfTitle(shelf.key)}
				</h2>
				<ul class="grid gap-3 sm:grid-cols-2">
					{#each shelf.rows.slice(0, 8) as row (row.id ?? row.slug ?? label(row))}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<p class="text-sm font-bold text-text">{label(row)}</p>
							{#if row.description}
								<p class="mt-1 text-sm text-text-muted">{row.description}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}

		{#if forYou.length > 0}
			<section class="space-y-3" data-testid="explore-for-you">
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('explore.forYouTitle')}
				</h2>
				<!-- Second, not first. It matches against a record, and somebody
				     arriving has none. -->
				<p class="text-sm text-text-muted">{i18n.t('explore.forYouHint')}</p>
				<ul class="space-y-2">
					{#each forYou as row (row.id ?? label(row))}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<p class="text-sm font-bold text-text">{label(row)}</p>
							{#if row.description}
								<p class="mt-1 text-sm text-text-muted">{row.description}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if nothing}
			<EmptyState title={i18n.t('explore.empty')} body={i18n.t('explore.emptyHint')} size="sm" />
		{/if}
	{/if}

	<div class="flex flex-wrap gap-2">
		<Button href="/challenges" size="sm" variant="ghost">{i18n.t('common.nav.challenges')}</Button>
		<Button href="/projects" size="sm" variant="ghost">{i18n.t('projects.title')}</Button>
		<Button href="/code" size="sm" variant="ghost">{i18n.t('codeDiscovery.title')}</Button>
	</div>
</div>
