<script lang="ts">
	/**
	 * The guides, toolkits and templates, for every discipline.
	 *
	 * `content_guides` has carried a `skill_domain` since migration 0199 and
	 * the backend now honours it on one endpoint — there is no `/code/guides`
	 * any more, and there is no `/ai/guides` to write. So there is one page,
	 * with a domain filter, rather than eleven pages that would drift.
	 *
	 * `brief_template` is off by default. It is written by whoever commissions
	 * the work, not by whoever does it, and this listing is read by
	 * contributors — the filter is there for the company that comes looking.
	 */
	import { onMount } from 'svelte';
	import { BookOpen, Wrench, FileText, ClipboardList } from '@lucide/svelte';
	import { guidesApi } from '$lib/api/guides';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { PUBLIC_DOMAINS, domainStyle } from '$lib/utils/domains';
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { GUIDE_KINDS, type GuideKind, type GuideSummary } from '$types';

	let guides = $state<GuideSummary[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let domain = $state<string>('');
	let kind = $state<GuideKind | ''>('');

	const kindIcons: Record<GuideKind, typeof BookOpen> = {
		onboarding: BookOpen,
		toolkit: Wrench,
		writeup_template: FileText,
		brief_template: ClipboardList
	};

	/**
	 * Briefs are hidden until asked for. Every other kind is what a
	 * contributor came here to read.
	 */
	let visible = $derived(
		guides.filter((g) => (kind ? g.kind === kind : g.kind !== 'brief_template'))
	);

	/** Grouped by discipline, in the order the public pages present them. */
	let grouped = $derived.by(() => {
		const byDomain = new Map<string, GuideSummary[]>();
		for (const guide of visible) {
			const list = byDomain.get(guide.skill_domain) ?? [];
			list.push(guide);
			byDomain.set(guide.skill_domain, list);
		}
		const known = PUBLIC_DOMAINS.filter((d) => byDomain.has(d)).map(
			(d) => [d as string, byDomain.get(d)!] as const
		);
		// A discipline the backend serves and this build does not know about
		// still gets a section rather than vanishing.
		const rest = [...byDomain.entries()]
			.filter(([d]) => !(PUBLIC_DOMAINS as readonly string[]).includes(d))
			.map(([d, list]) => [d, list] as const);
		return [...known, ...rest];
	});

	async function load() {
		loading = true;
		loadError = '';
		try {
			// The kind is filtered client-side: the whole catalogue is a few
			// dozen rows, and refetching on every chip would be slower than
			// the filter it replaces.
			const res = await guidesApi.list(i18n.locale, domain ? { domain } : undefined);
			guides = res.data ?? [];
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function selectDomain(next: string) {
		if (next === domain) return;
		domain = next;
		void load();
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('guides.title')} — Skilluv</title>
	<meta name="description" content={i18n.t('guides.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('guides.title')}</h1>
		<p class="mt-2 max-w-2xl text-text-muted">{i18n.t('guides.subtitle')}</p>
	</header>

	<div class="mb-4 flex flex-wrap gap-2" data-testid="guides-domain-filter">
		<button
			type="button"
			onclick={() => selectDomain('')}
			aria-pressed={domain === ''}
			class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {domain === ''
				? 'border-accent bg-accent/10 text-accent'
				: 'border-border text-text-muted hover:text-text-primary'}"
		>
			{i18n.t('guides.allDomains')}
		</button>
		{#each PUBLIC_DOMAINS as candidate (candidate)}
			<button
				type="button"
				onclick={() => selectDomain(candidate)}
				aria-pressed={domain === candidate}
				class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {domain ===
				candidate
					? 'border-accent bg-accent/10 text-accent'
					: 'border-border text-text-muted hover:text-text-primary'}"
			>
				<span class="h-1.5 w-1.5 rounded-full {domainStyle(candidate).dot}"></span>
				{i18n.t(`common.domains.${candidate}`)}
			</button>
		{/each}
	</div>

	<div class="mb-8 flex flex-wrap gap-2" data-testid="guides-kind-filter">
		<button
			type="button"
			onclick={() => (kind = '')}
			aria-pressed={kind === ''}
			class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {kind === ''
				? 'border-accent bg-accent/10 text-accent'
				: 'border-border text-text-muted hover:text-text-primary'}"
		>
			{i18n.t('guides.allKinds')}
		</button>
		{#each GUIDE_KINDS as candidate (candidate)}
			<button
				type="button"
				onclick={() => (kind = candidate)}
				aria-pressed={kind === candidate}
				class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {kind ===
				candidate
					? 'border-accent bg-accent/10 text-accent'
					: 'border-border text-text-muted hover:text-text-primary'}"
			>
				{i18n.t(`guides.kinds.${candidate}`)}
			</button>
		{/each}
	</div>

	{#if kind === 'brief_template'}
		<p class="mb-6 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-text-muted">
			{i18n.t('guides.briefNotice')}
		</p>
	{/if}

	{#if loading}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each Array(6) as _}
				<Skeleton class="h-28 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if visible.length === 0}
		<EmptyState variant="scroll" title={i18n.t('guides.empty')} body={i18n.t('guides.emptyBody')} />
	{:else}
		<div class="space-y-10" data-testid="guides-list">
			{#each grouped as [group, rows] (group)}
				<section>
					<h2 class="mb-3 flex items-center gap-2 text-lg font-bold text-text-primary">
						<span class="h-2 w-2 rounded-full {domainStyle(group).dot}"></span>
						{i18n.t(`common.domains.${group}`)}
					</h2>
					<ul class="grid gap-3 sm:grid-cols-2" role="list">
						{#each rows as guide (guide.slug)}
							{@const Icon = kindIcons[guide.kind]}
							<li>
								<a
									href="/guides/{guide.slug}"
									class="block h-full rounded-xl border border-border bg-surface-elevated p-4 transition-colors {domainStyle(
										group
									).hoverBorder}"
								>
									<div class="mb-2 flex flex-wrap items-center gap-2">
										<Badge variant="default" size="sm">
											<span class="inline-flex items-center gap-1">
												{#if Icon}<Icon size={11} strokeWidth={2} />{/if}
												{i18n.t(`guides.kinds.${guide.kind}`)}
											</span>
										</Badge>
										{#if guide.reviewer_group}
											<span class="text-xs text-text-muted">{guide.reviewer_group}</span>
										{/if}
										<!-- The locale served is not always the one asked for: a
										     guide with no row in yours arrives in the next best
										     one rather than disappearing. Saying so beats
										     letting a reader wonder. -->
										{#if guide.locale !== i18n.locale}
											<span class="ml-auto font-mono text-[0.65rem] uppercase text-text-muted">
												{guide.locale}
											</span>
										{/if}
									</div>
									<p class="text-sm font-semibold text-text-primary">{guide.title}</p>
									<p class="mt-1 text-xs text-text-muted">{guide.summary}</p>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</div>
