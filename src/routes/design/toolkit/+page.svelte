<script lang="ts">
	/**
	 * G-03 and section T — what designers work with, and where to contribute.
	 *
	 * Two listings from `practice.rs`, both keyed on the domain. The backend's
	 * note on why they exist applies word for word to this page:
	 *
	 * > `terrain_proposals` — twenty rows across three domains — had no
	 * > endpoint at all: the seed migrations were written, the listing never
	 * > was, and nothing failed because nothing looked.
	 *
	 * The endpoints then existed and nothing on the front called them, which
	 * fails exactly as silently. This is the surface that looks.
	 *
	 * Two editorial points the page keeps:
	 *
	 * 1. **`access_note` is never dropped.** Recommending a tool somebody
	 *    cannot afford, or a course paywalled three lessons in, wastes the week
	 *    it was meant to save. It sits on every row, not in a tooltip.
	 * 2. **An unadopted terrain says it is unadopted.** A proposal is a
	 *    shortlist entry: nobody stewards it, nothing is ingested from it, and
	 *    presenting it as a live terrain would send somebody to contribute
	 *    somewhere Skilluv cannot credit them for it.
	 */
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { ExternalLink, Wrench } from '@lucide/svelte';
	import { practiceApi, groupByCategory } from '$api/practice';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { TerrainProposal, ToolkitRow } from '$types';

	const DOMAIN = 'design';

	let resources = $state<ToolkitRow[]>([]);
	let terrains = $state<TerrainProposal[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let category = $state('');

	let byCategory = $derived(groupByCategory(resources));

	/** Built from what came back, never hardcoded: the categories are whatever
	 * the table holds, and a fixed list would drop one added server-side. */
	let categoryItems = $derived([
		{ value: '', label: i18n.t('designPractice.filterAll') },
		...[...byCategory.keys()].map((c) => ({ value: c, label: c }))
	]);

	let visible = $derived(
		category === '' ? resources : resources.filter((r) => r.category === category)
	);

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
			// Settled: a domain with a toolkit and no terrain is the normal case
			// at launch, and a 404 on one must not blank the other.
			const [kit, land] = await Promise.allSettled([
				practiceApi.toolkit(DOMAIN),
				practiceApi.terrains(DOMAIN)
			]);
			resources = kit.status === 'fulfilled' ? (kit.value.data?.resources ?? []) : [];
			terrains = land.status === 'fulfilled' ? (land.value.data?.terrains ?? []) : [];
			if (kit.status === 'rejected' && land.status === 'rejected') {
				loadError =
					kit.reason instanceof SkilluError ? kit.reason.message : i18n.t('errors.generic');
			}
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('designPractice.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('designPractice.subtitle')} />
	<meta property="og:title" content={i18n.t('designPractice.title')} />
	<meta property="og:description" content={i18n.t('designPractice.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-4xl space-y-10 px-4 py-8" data-testid="design-practice-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Wrench size={22} />
			{i18n.t('designPractice.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('designPractice.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else}
		<section class="space-y-4" data-testid="design-toolkit">
			<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('designPractice.toolkitTitle')}
			</h2>

			{#if resources.length === 0}
				<EmptyState title={i18n.t('designPractice.toolkitEmpty')} size="sm" />
			{:else}
				{#if categoryItems.length > 2}
					<SegmentedControl
						items={categoryItems}
						value={category}
						onchange={(v) => (category = v)}
					/>
				{/if}

				<ul class="space-y-3">
					{#each visible as tool (tool.slug)}
						<li class="rounded-xl border border-border bg-surface-elevated p-4">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0 space-y-1">
									<h3 class="text-sm font-bold text-text">{tool.display_name}</h3>
									<p class="text-sm text-text-muted">{tool.summary}</p>
								</div>
								<Button
									href={tool.url}
									size="sm"
									variant="ghost"
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLink size={14} />
									{i18n.t('designPractice.openTool')}
								</Button>
							</div>

							<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
								<Badge size="sm">{tool.category}</Badge>
								<span>
									{i18n.t('designPractice.accessLabel')} · {tool.access_note}
								</span>
							</div>

							<div class="mt-2 flex flex-wrap gap-1.5">
								{#if tool.orientation_slugs.length === 0}
									<Badge size="sm" variant="default">
										{i18n.t('designPractice.allOrientations')}
									</Badge>
								{:else}
									{#each tool.orientation_slugs as slug (slug)}
										<Badge size="sm" variant="default">{slug}</Badge>
									{/each}
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="space-y-4" data-testid="design-terrains">
			<div>
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('designPractice.terrainsTitle')}
				</h2>
				<p class="mt-1 text-sm text-text-muted">{i18n.t('designPractice.terrainsSubtitle')}</p>
			</div>

			{#if terrains.length === 0}
				<EmptyState title={i18n.t('designPractice.terrainsEmpty')} size="sm" />
			{:else}
				<ul class="space-y-3">
					{#each terrains as terrain (terrain.slug)}
						<li
							class="rounded-xl border border-border bg-surface-elevated p-4"
							data-testid="design-terrain"
						>
							<div class="flex flex-wrap items-start justify-between gap-2">
								<h3 class="text-sm font-bold text-text">{terrain.name}</h3>
								<Badge variant={terrain.adopted ? 'success' : 'default'}>
									{terrain.adopted
										? i18n.t('designPractice.adopted')
										: i18n.t('designPractice.notAdopted')}
								</Badge>
							</div>

							{#if terrain.why_md}
								<div class="mt-2">
									<span class="text-xs font-bold uppercase tracking-wider text-text-muted">
										{i18n.t('designPractice.whyTitle')}
									</span>
									<p class="mt-1 whitespace-pre-line text-sm text-text-muted">
										{terrain.why_md}
									</p>
								</div>
							{/if}

							{#if !terrain.adopted}
								<!-- Said plainly: nobody stewards it, so nothing is ingested
								     from it, and sending somebody to contribute there would
								     be sending them somewhere we cannot credit them. -->
								<p class="mt-2 text-xs text-text-muted">
									{i18n.t('designPractice.notAdoptedHint')}
								</p>
							{/if}

							{#if terrain.declined_reason}
								<p class="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
									{i18n.t('designPractice.declinedReason', { reason: terrain.declined_reason })}
								</p>
							{/if}

							<div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
								<a
									href={terrain.upstream_url}
									target="_blank"
									rel="external noopener noreferrer"
									class="inline-flex items-center gap-1.5 text-text-muted hover:underline"
								>
									<ExternalLink size={14} />
									{i18n.t('designPractice.openUpstream')}
								</a>
								{#if terrain.adopted && terrain.project_slug}
									<!-- /projects has no detail route, so this pointed at a
									     404. Sends to the listing instead, which is where
									     the project can actually be found. -->
									<a
										href={resolve('/projects')}
										class="inline-flex items-center gap-1.5 text-accent hover:underline"
									>
										{i18n.t('designPractice.openProject')}
									</a>
								{/if}
								{#if terrain.adopted_at}
									<span class="text-xs text-text-muted">
										{i18n.t('designPractice.adoptedOn', { date: fmtDate(terrain.adopted_at) })}
									</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</div>
