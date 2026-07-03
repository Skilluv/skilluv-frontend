<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import JsonLd from '$lib/components/seo/JsonLd.svelte';
	import { websiteJsonLd } from '$lib/utils/jsonld';
	import RecommendationsWidget from '$components/ai/RecommendationsWidget.svelte';

	// Landing sections
	import HeroSection from '$lib/components/landing/HeroSection.svelte';
	import DomainsSection from '$lib/components/landing/DomainsSection.svelte';
	import HowItWorks from '$lib/components/landing/HowItWorks.svelte';
	import TrendingChallenges from '$lib/components/landing/TrendingChallenges.svelte';
	import RecentActivity from '$lib/components/landing/RecentActivity.svelte';
	import LeaderboardPreview from '$lib/components/landing/LeaderboardPreview.svelte';
	import StatsSection from '$lib/components/landing/StatsSection.svelte';
	import LevelUpSection from '$lib/components/landing/LevelUpSection.svelte';
	import OpportunitiesSection from '$lib/components/landing/OpportunitiesSection.svelte';
	import EnterpriseSection from '$lib/components/landing/EnterpriseSection.svelte';
	import CtaSection from '$lib/components/landing/CtaSection.svelte';
</script>

<JsonLd data={websiteJsonLd()} />

<svelte:head>
	<title>Skilluv — {i18n.t('landing.title')}</title>
	<meta property="og:title" content="Skilluv — {i18n.t('landing.title')} {i18n.t('landing.titleAccent')}" />
	<meta property="og:description" content={i18n.t('landing.subtitle')} />
	<meta property="og:image" content="/og-image.svg" />
</svelte:head>

{#if auth.isAuthenticated}
	<!-- Dashboard utilisateur connecte -->
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
				class="group rounded-2xl border border-border bg-surface-elevated p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-accent/30"
			>
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent mb-4 transition-transform duration-300 group-hover:scale-110">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
					</svg>
				</div>
				<h2 class="mb-2 text-lg font-semibold group-hover:text-accent transition-colors">{i18n.t('dashboard.cardChallenges')}</h2>
				<p class="text-sm text-text-muted">{i18n.t('dashboard.cardChallengesDesc')}</p>
			</a>

			<a
				href="/profile/{auth.user?.username}"
				class="group rounded-2xl border border-border bg-surface-elevated p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
			>
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-transform duration-300 group-hover:scale-110">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
					</svg>
				</div>
				<h2 class="mb-2 text-lg font-semibold group-hover:text-primary transition-colors">{i18n.t('dashboard.cardProfile')}</h2>
				<p class="text-sm text-text-muted">{i18n.t('dashboard.cardProfileDesc')}</p>
			</a>

			<a
				href="/leaderboards"
				class="group rounded-2xl border border-border bg-surface-elevated p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-warning/30"
			>
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning mb-4 transition-transform duration-300 group-hover:scale-110">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
					</svg>
				</div>
				<h2 class="mb-2 text-lg font-semibold group-hover:text-warning transition-colors">{i18n.t('dashboard.cardLeaderboards')}</h2>
				<p class="text-sm text-text-muted">{i18n.t('dashboard.cardLeaderboardsDesc')}</p>
			</a>
		</div>

		<!-- Community shortcuts -->
		<div class="mt-8 grid gap-3 sm:grid-cols-4">
			{#each [
				{ href: '/feed', icon: '◎', fr: 'Fil', en: 'Feed' },
				{ href: '/forum', icon: '◈', fr: 'Forum', en: 'Forum' },
				{ href: '/guilds', icon: '⬢', fr: 'Guildes', en: 'Guilds' },
				{ href: '/messages', icon: '◎', fr: 'Messages', en: 'Messages' }
			] as short}
				<a href={short.href} class="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated p-4 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
					<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{short.icon}</div>
					<span class="font-semibold">{i18n.locale === 'fr' ? short.fr : short.en}</span>
				</a>
			{/each}
		</div>

		<!-- IA Recommendations -->
		<div class="mt-10">
			<RecommendationsWidget limit={5} />
		</div>
	</div>
{:else}
	<!-- Landing page visiteur -->
	<div class="relative">
		<!-- Background grid extending from above the header down through the hero -->
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-x-0 -top-20 h-[110vh] opacity-[0.04]"
			style="background-image: linear-gradient(var(--sk-text) 1px, transparent 1px), linear-gradient(90deg, var(--sk-text) 1px, transparent 1px); background-size: 60px 60px; mask-image: linear-gradient(to bottom, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);"
		></div>
		<HeroSection />
	</div>
	<DomainsSection />
	<HowItWorks />
	<TrendingChallenges />
	<RecentActivity />
	<LeaderboardPreview />
	<StatsSection />
	<LevelUpSection />
	<OpportunitiesSection />
	<EnterpriseSection />
	<CtaSection />
{/if}
