<script lang="ts">
	/**
	 * The way in for somebody who has written no code here yet.
	 *
	 * `first-issues` is the one list on this platform that does not assume a
	 * record. Everything else — recommendations, matched projects, the craft
	 * score — reads what somebody has already done. This is for the person who
	 * has done nothing on Skilluv and is deciding whether to start, which is
	 * the moment that decides whether they ever have a record at all.
	 *
	 * So it is public, it leads, and it is never sorted by anything that
	 * rewards existing standing. A "good first issue" list ranked by
	 * contributor reputation would be a first-issue list for people who are not
	 * beginners.
	 *
	 * ## Two kinds of language figure, kept apart
	 *
	 * `languages/top` is counted from synced repositories — what people
	 * actually ship in. The languages somebody types on their profile are a
	 * declaration. They use the same word and mean different things, so they
	 * never appear in one list.
	 */
	import { onMount } from 'svelte';
	import { Code2, ExternalLink } from '@lucide/svelte';
	import {
		codeDiscoveryApi,
		type Ecosystem,
		type FirstIssue,
		type LanguageCount
	} from '$api/code_discovery';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	// Typed from the client rather than a local bag of optional fields. The bag
	// is what let this page read `html_url`, `repository` and `count` — none of
	// which the backend sends — without a single compile error.

	let issues = $state<FirstIssue[]>([]);
	let ecosystems = $state<Ecosystem[]>([]);
	let topLanguages = $state<LanguageCount[]>([]);
	let loading = $state(true);
	let language = $state('');

	/**
	 * Where the work is actually done.
	 *
	 * The row carries `slice_id`: these issues are served as project slices, so
	 * the slice page is where one is claimed, delivered and — through the
	 * deliverables pipeline — paid its `fragments_reward`. Linking only to
	 * GitHub sent people out of the platform at the exact moment they were
	 * ready to start.
	 */
	function sliceHref(issue: FirstIssue): string {
		return `/slices/${issue.slice_id}`;
	}

	async function load() {
		loading = true;
		const [i, e, t] = await Promise.allSettled([
			codeDiscoveryApi.firstIssues(language.trim() ? { language: language.trim() } : undefined),
			codeDiscoveryApi.ecosystems(),
			codeDiscoveryApi.topLanguages()
		]);
		if (i.status === 'fulfilled') issues = i.value.data?.issues ?? [];
		if (e.status === 'fulfilled') ecosystems = e.value.data?.ecosystems ?? [];
		if (t.status === 'fulfilled') topLanguages = t.value.data?.languages ?? [];
		loading = false;
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('codeDiscovery.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('codeDiscovery.subtitle')} />
	<meta property="og:title" content={i18n.t('codeDiscovery.title')} />
	<meta property="og:description" content={i18n.t('codeDiscovery.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="code-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Code2 size={22} />
			{i18n.t('codeDiscovery.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('codeDiscovery.subtitle')}</p>
	</header>

	<section class="space-y-3" data-testid="code-first-issues">
		<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
			{i18n.t('codeDiscovery.firstIssuesTitle')}
		</h2>
		<!-- The one list here that assumes nothing about the reader. -->
		<p class="text-sm text-text-muted">{i18n.t('codeDiscovery.firstIssuesHint')}</p>

		<div class="flex flex-wrap items-end gap-2">
			<div class="w-40">
				<Input placeholder={i18n.t('codeDiscovery.languagePlaceholder')} bind:value={language} />
			</div>
			<Button size="sm" variant="ghost" onclick={load}>{i18n.t('codeDiscovery.filterCta')}</Button>
		</div>

		{#if loading}
			<Skeleton class="h-48 w-full" rounded="xl" />
		{:else if issues.length === 0}
			<EmptyState
				title={i18n.t('codeDiscovery.noIssues')}
				body={i18n.t('codeDiscovery.noIssuesHint')}
				size="sm"
			/>
		{:else}
			<ul class="space-y-2">
				{#each issues as issue (issue.slice_id)}
					<li class="rounded-xl border border-border bg-surface-elevated p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<!-- The title leads to the slice, not to GitHub: this is where
							     the issue is claimed and where the reward is paid. -->
							<a
								href={sliceHref(issue)}
								class="min-w-0 flex-1 text-sm font-medium text-text-primary hover:text-accent"
							>
								{issue.title}
							</a>
							{#if issue.issue_url}
								<a
									href={issue.issue_url}
									target="_blank"
									rel="noopener noreferrer nofollow ugc"
									class="inline-flex shrink-0 items-center gap-1 text-xs text-accent hover:underline"
								>
									{i18n.t('codeDiscovery.openIssue')}
									<ExternalLink size={11} />
								</a>
							{/if}
						</div>
						<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
							<a href="/projects" class="hover:text-text-primary">{issue.project_name}</a>
							<span aria-hidden="true">·</span>
							<span>{i18n.t(`common.difficulty.${issue.difficulty}`)}</span>
							<!-- Shown because it is the answer to "why would I take this
							     one", and the backend sends it on every row. -->
							<span class="font-semibold text-accent">
								{i18n.t('codeDiscovery.reward', { n: issue.fragments_reward })}
							</span>
							{#each issue.languages.slice(0, 3) as lang (lang)}
								<Badge size="sm">{lang}</Badge>
							{/each}
							{#if issue.orientation_name}
								<span class="text-text-muted">{issue.orientation_name}</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if !loading && ecosystems.length > 0}
		<section class="space-y-3" data-testid="code-ecosystems">
			<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('codeDiscovery.ecosystemsTitle')}
			</h2>
			<div class="flex flex-wrap gap-2">
				{#each ecosystems as eco (eco.language)}
					<!-- `community_url` is the point of the row: the ecosystem entry
					     exists to send somebody where that community actually is. -->
					<a
						href={eco.community_url}
						target="_blank"
						rel="noopener noreferrer nofollow ugc"
						title={eco.summary}
						class="inline-flex items-center gap-1 rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs text-text-primary transition-colors hover:border-accent hover:text-accent"
					>
						{eco.display_name}
						<ExternalLink size={10} />
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if !loading && topLanguages.length > 0}
		<section class="space-y-3" data-testid="code-top-languages">
			<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('codeDiscovery.topLanguagesTitle')}
			</h2>
			<!-- Counted from synced repositories, not from what anybody typed.
			     The distinction is the reason this is worth showing. -->
			<p class="text-sm text-text-muted">{i18n.t('codeDiscovery.topLanguagesHint')}</p>
			<div class="flex flex-wrap gap-2">
				{#each topLanguages as lang (lang.language)}
					<span
						class="rounded-full border border-border bg-surface-overlay px-3 py-1 text-xs text-text-primary"
					>
						{lang.language}
						<span class="ml-1 text-text-muted">
							{i18n.t('codeDiscovery.artifacts', { n: lang.artifacts })}
						</span>
					</span>
				{/each}
			</div>
		</section>
	{/if}
</div>
