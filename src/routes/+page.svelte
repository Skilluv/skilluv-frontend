<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import JsonLd from '$lib/components/seo/JsonLd.svelte';
	import { websiteJsonLd } from '$lib/utils/jsonld';
</script>

<JsonLd data={websiteJsonLd()} />

<svelte:head>
	<title>Skilluv — {i18n.t('landing.title')}</title>
	<meta property="og:title" content="Skilluv — {i18n.t('landing.title')} {i18n.t('landing.titleAccent')}" />
	<meta property="og:description" content={i18n.t('landing.subtitle')} />
	<meta property="og:image" content="/og-image.svg" />
</svelte:head>

{#if auth.isAuthenticated}
	<!-- Dashboard utilisateur connecté -->
	<div class="mx-auto max-w-5xl px-4 py-8">
		<h1 class="mb-2 text-3xl font-bold">
			{@html i18n.t('dashboard.greeting', { name: `<span class="text-accent">${auth.displayName}</span>` })}
		</h1>
		<p class="mb-8 text-text-muted">
			<span class="capitalize">{i18n.t(`common.titles.${auth.title}`)}</span>
			{#if auth.user?.golden_stars}
				{'★'.repeat(auth.user.golden_stars)}
			{/if}
			· {auth.user?.total_fragments ?? 0} {i18n.t('common.fragments')} · {i18n.t('common.streak')} {auth.user?.streak_current ?? 0}j
		</p>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<a
				href="/challenges"
				class="group rounded-2xl border border-border bg-surface-elevated p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
			>
				<h2 class="mb-2 text-lg font-semibold group-hover:text-accent">{i18n.t('dashboard.cardChallenges')}</h2>
				<p class="text-sm text-text-muted">{i18n.t('dashboard.cardChallengesDesc')}</p>
			</a>

			<a
				href="/profile/{auth.user?.username}"
				class="group rounded-2xl border border-border bg-surface-elevated p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
			>
				<h2 class="mb-2 text-lg font-semibold group-hover:text-accent">{i18n.t('dashboard.cardProfile')}</h2>
				<p class="text-sm text-text-muted">{i18n.t('dashboard.cardProfileDesc')}</p>
			</a>

			<a
				href="/leaderboards"
				class="group rounded-2xl border border-border bg-surface-elevated p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
			>
				<h2 class="mb-2 text-lg font-semibold group-hover:text-accent">{i18n.t('dashboard.cardLeaderboards')}</h2>
				<p class="text-sm text-text-muted">{i18n.t('dashboard.cardLeaderboardsDesc')}</p>
			</a>
		</div>
	</div>
{:else}
	<!-- Landing page visiteur -->
	<div class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
		<h1 class="mb-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
			{i18n.t('landing.title')}<br />
			<span class="text-accent">{i18n.t('landing.titleAccent')}</span>
		</h1>

		<p class="mx-auto mb-8 max-w-2xl text-lg text-text-muted">
			{i18n.t('landing.subtitle')}
		</p>

		<div class="flex flex-col gap-3 sm:flex-row">
			<a
				href="/auth/register"
				class="rounded-2xl bg-accent px-8 py-3 text-lg font-bold text-white transition-all hover:scale-[1.02] hover:bg-accent-hover hover:shadow-lg"
			>
				{i18n.t('landing.cta')}
			</a>
			<a
				href="/challenges"
				class="rounded-2xl border border-border bg-surface-elevated px-8 py-3 text-lg font-semibold text-text-primary transition-all hover:border-text-muted"
			>
				{i18n.t('landing.ctaSecondary')}
			</a>
		</div>

		<!-- Stats -->
		<div class="mt-16 flex gap-8 text-center sm:gap-16">
			<div>
				<p class="text-3xl font-bold text-primary">4</p>
				<p class="text-sm text-text-muted">{i18n.t('landing.statDomains')}</p>
			</div>
			<div>
				<p class="text-3xl font-bold text-primary">20+</p>
				<p class="text-sm text-text-muted">{i18n.t('landing.statLanguages')}</p>
			</div>
			<div>
				<p class="text-3xl font-bold text-primary">100%</p>
				<p class="text-sm text-text-muted">{i18n.t('landing.statFree')}</p>
			</div>
		</div>
	</div>
{/if}
