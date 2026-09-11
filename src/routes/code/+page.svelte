<script lang="ts">
	/**
	 * The way in for somebody who has written no code here yet.
	 *
	 * The first-issues list is the one list on this platform that does not
	 * assume a record. Everything else — recommendations, matched projects,
	 * the craft score — reads what somebody has already done. This is for the
	 * person who has done nothing on Skilluv and is deciding whether to
	 * start, which is the moment that decides whether they ever have a record
	 * at all.
	 *
	 * It reads `GET /api/open-slices?domain=code&slice_type=github_issue`.
	 * `/api/code/first-issues` is the same query behind a route of its own and
	 * is deprecated upstream: it was never about code, it reads
	 * `project_slices` filtered to one surface, and every other trade has
	 * slices of the same shape. The language box filters on `tag`, which is
	 * what that endpoint calls the thing each domain tags its work with.
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
	import { codeDiscoveryApi, type Ecosystem, type LanguageCount } from '$api/code_discovery';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import { OnboardingCta } from '$components/onboarding';
	import { OpenSlicesList } from '$components/slices';

	// Typed from the client rather than a local bag of optional fields. The bag
	// is what let this page read `html_url`, `repository` and `count` — none of
	// which the backend sends — without a single compile error.

	let ecosystems = $state<Ecosystem[]>([]);
	let topLanguages = $state<LanguageCount[]>([]);
	let loading = $state(true);

	/**
	 * What is typed, and what is applied.
	 *
	 * Two variables rather than one, because the list refetches whenever its
	 * filter changes and a single bound value would fire a request per
	 * keystroke. `appliedLanguage` moves only when the button is pressed.
	 */
	let language = $state('');
	let appliedLanguage = $state('');

	async function load() {
		loading = true;
		const [e, t] = await Promise.allSettled([
			codeDiscoveryApi.ecosystems(),
			codeDiscoveryApi.topLanguages()
		]);
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
		<!-- The wizard sorts what gets recommended here. Offered rather
		     than imposed, and hidden from signed-out readers, for whom the
		     destination is a sign-in wall and not an invitation. -->
		<div class="pt-1">
			<OnboardingCta domain="code" />
		</div>
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
			<Button size="sm" variant="ghost" onclick={() => (appliedLanguage = language.trim())}>
				{i18n.t('codeDiscovery.filterCta')}
			</Button>
		</div>

		<!-- The pool, scoped to this trade and this surface. The rows were
		     rendered here by hand against a deprecated endpoint that returns
		     the same data under three different field names; one component
		     means this page and `/open-slices` cannot show it two ways. The
		     trade is not repeated per row: every row here is code. -->
		<OpenSlicesList
			domain="code"
			sliceType="github_issue"
			tag={appliedLanguage || undefined}
			showDomain={false}
			testId="code-first-issues-list"
		/>
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
