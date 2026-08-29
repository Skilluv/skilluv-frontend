<script lang="ts">
	/**
	 * The project catalogue: what Skilluv stands behind, what is asking for
	 * help, and what matches you.
	 *
	 * Thirteen endpoints served and two read. The objects every slice hangs off
	 * had no catalogue.
	 *
	 * ## Three lists, and keeping them apart is the point
	 *
	 * **Curated** is what Skilluv put its name behind. **Looking for
	 * contributors** is a flag the project's own owner set. Showing them as one
	 * list would let anybody into the first by ticking a box on the second, and
	 * the whole value of curation is that it cannot be self-applied.
	 *
	 * **Recommended** is matched against the reader's own record, and every row
	 * carries what earned the match — the domains and the weighted proof count
	 * behind them. A recommendation nobody can argue with is one nobody trusts,
	 * which is the same rule the challenge suggestions follow.
	 *
	 * ## Interest is not membership
	 *
	 * The star records that somebody wants to hear about a project. It does not
	 * put them on it: that is `contributors`, and only an owner adds to it. The
	 * copy says so, because a platform where interest looked like membership
	 * would be a platform where anybody claims to be on anything.
	 */
	import { onMount } from 'svelte';
	import { FolderGit2, Star, StarOff } from '@lucide/svelte';
	import { projectsApi, type Project, type ProjectRecommendation } from '$api/projects';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let curated = $state<Project[]>([]);
	let looking = $state<Project[]>([]);
	let recommended = $state<ProjectRecommendation[]>([]);
	let interested = $state<Set<string>>(new Set());
	let loading = $state(true);
	let tab = $state<'curated' | 'looking' | 'recommended'>('curated');
	let busy = $state<Record<string, boolean>>({});

	let tabs = $derived([
		{ value: 'curated', label: i18n.t('projects.tabCurated') },
		{ value: 'looking', label: i18n.t('projects.tabLooking') },
		...(auth.isAuthenticated
			? [{ value: 'recommended', label: i18n.t('projects.tabRecommended') }]
			: [])
	]);

	let rows = $derived(
		tab === 'curated' ? curated : tab === 'looking' ? looking : recommended.map((r) => r.project)
	);

	/** The reason a recommendation matched, by project id. */
	let reasonFor = $derived(new Map(recommended.map((r) => [r.project.id, r] as const)));

	async function load() {
		loading = true;
		const [c, l, r, i] = await Promise.allSettled([
			projectsApi.curated(),
			projectsApi.lookingForContributors(),
			auth.isAuthenticated ? projectsApi.recommendations() : Promise.resolve(null),
			auth.isAuthenticated ? projectsApi.myInterests() : Promise.resolve(null)
		]);
		if (c.status === 'fulfilled') curated = c.value.data?.projects ?? [];
		if (l.status === 'fulfilled') looking = l.value.data?.projects ?? [];
		if (r.status === 'fulfilled' && r.value) recommended = r.value.data?.recommendations ?? [];
		if (i.status === 'fulfilled' && i.value) {
			interested = new Set((i.value.data?.interests ?? []).map((x) => x.project.id));
		}
		loading = false;
	}

	async function toggleInterest(p: Project) {
		if (busy[p.id]) return;
		busy = { ...busy, [p.id]: true };
		const on = interested.has(p.id);
		try {
			if (on) await projectsApi.unmarkInterested(p.id);
			else await projectsApi.markInterested([p.id]);
			const next = new Set(interested);
			if (on) next.delete(p.id);
			else next.add(p.id);
			interested = next;
			toast.success(on ? i18n.t('projects.unstarred') : i18n.t('projects.starred'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [p.id]: false };
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('projects.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('projects.subtitle')} />
	<meta property="og:title" content={i18n.t('projects.title')} />
	<meta property="og:description" content={i18n.t('projects.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="projects-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<FolderGit2 size={22} />
			{i18n.t('projects.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('projects.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else}
		<SegmentedControl
			items={tabs}
			value={tab}
			onchange={(v) => (tab = v as 'curated' | 'looking' | 'recommended')}
		/>

		<!-- What each list actually is. Curation cannot be self-applied and the
		     other flag can, which is why they are never merged. -->
		<p class="text-sm text-text-muted">{i18n.t(`projects.hint.${tab}`)}</p>

		{#if rows.length === 0}
			<EmptyState title={i18n.t(`projects.empty.${tab}`)} size="sm" />
		{:else}
			<ul class="space-y-3">
				{#each rows as p (p.id)}
					{@const reco = reasonFor.get(p.id)}
					{@const starred = interested.has(p.id)}
					<li
						class="rounded-xl border border-border bg-surface-elevated p-4"
						data-testid="project-row"
					>
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div class="min-w-0 space-y-1">
								<h2 class="text-sm font-bold text-text">{p.name}</h2>
								{#if p.description}
									<p class="text-sm text-text-muted">{p.description}</p>
								{/if}
							</div>
							{#if auth.isAuthenticated}
								<Button
									size="sm"
									variant="ghost"
									loading={busy[p.id]}
									onclick={() => toggleInterest(p)}
									aria-label={i18n.t('projects.starCta')}
									data-testid="project-star"
								>
									{#if starred}<Star size={15} />{:else}<StarOff size={15} />{/if}
								</Button>
							{/if}
						</div>

						<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
							{#if p.curated_by_admin}
								<Badge size="sm" variant="accent">{i18n.t('projects.curatedBadge')}</Badge>
							{/if}
							{#if p.looking_for_contributors}
								<Badge size="sm">{i18n.t('projects.lookingBadge')}</Badge>
							{/if}
							{#if p.is_oss}
								<span>{i18n.t('projects.oss')}</span>
							{/if}
							{#each p.tech_stack.slice(0, 4) as t (t)}
								<span class="rounded-full border border-border bg-surface-overlay px-2 py-0.5">
									{t}
								</span>
							{/each}
							{#if p.repo_url}
								<a
									href={p.repo_url}
									target="_blank"
									rel="noopener noreferrer nofollow ugc"
									class="ml-auto text-accent hover:underline"
								>
									{i18n.t('projects.repo')}
								</a>
							{/if}
						</div>

						{#if reco}
							<!-- Why it matched, not just that it did. A recommendation
							     nobody can argue with is one nobody trusts. -->
							<p class="mt-2 border-t border-border pt-2 text-xs text-text-muted">
								{i18n.t('projects.matchedBecause', {
									domains: reco.matched_domains.join(', '),
									n: reco.user_wpc_on_matched_domains
								})}
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}

	<!-- Said once: starring is not joining. -->
	<p class="text-xs text-text-muted">{i18n.t('projects.interestIsNotMembership')}</p>
</div>
