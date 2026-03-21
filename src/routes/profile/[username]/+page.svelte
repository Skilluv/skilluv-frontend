<script lang="ts">
	import { page } from '$app/stores';
	import { profileApi } from '$api/profile';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import SkillTree from '$components/profile/SkillTree.svelte';
	import Heatmap from '$components/profile/Heatmap.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import JsonLd from '$lib/components/seo/JsonLd.svelte';
	import { profileJsonLd } from '$lib/utils/jsonld';
	import type { UserPublic, SkillNode, HeatmapEntry } from '$types';

	let username = $derived($page.params.username ?? '');

	let user = $state<UserPublic | null>(null);
	let stats = $state<{ challenges_completed: number; total_fragments: number; streak_current: number; trust_score: number } | null>(null);
	let skillTree = $state<SkillNode[]>([]);
	let heatmap = $state<HeatmapEntry[]>([]);
	let badges = $state<{ slug: string; name: string; icon: string; category: string; earned_at: string }[]>([]);
	let loading = $state(true);
	let error = $state('');

	const titleColors: Record<string, string> = {
		apprenti: 'text-text-muted',
		artisan: 'text-blue-400',
		maitre: 'text-accent',
		legende: 'text-yellow-400'
	};

	$effect(() => {
		if (username) loadProfile(username);
	});

	async function loadProfile(name: string) {
		loading = true;
		error = '';
		try {
			const res = await profileApi.getPublic(name);
			user = res.data.user;
			stats = res.data.stats;
			skillTree = res.data.skill_tree ?? [];
			heatmap = res.data.heatmap_summary ?? [];
			badges = res.data.badges ?? [];
		} catch (err) {
			if (err instanceof SkilluError) {
				error = err.code === 'RESOURCE_NOT_FOUND' ? i18n.t('profile.notFound') : err.message;
			} else {
				error = i18n.t('errors.generic');
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{user ? `${user.display_name} — Skilluv` : `${i18n.t('profile.title')} — Skilluv`}</title>
	{#if user}
		<meta property="og:title" content="{user.display_name} — Skilluv" />
		<meta property="og:description" content="{i18n.t(`common.titles.${user.title}`)} · {stats?.total_fragments ?? 0} {i18n.t('common.fragments')} · Skilluv" />
	{/if}
</svelte:head>

{#if user && stats}
	<JsonLd data={profileJsonLd(user, stats, `/profile/${username}`)} />
{/if}

<div class="mx-auto max-w-4xl px-4 py-8">
	{#if loading}
		<div class="flex flex-col gap-6">
			<div class="flex items-center gap-4">
				<Skeleton class="h-20 w-20" rounded="full" />
				<div class="flex flex-col gap-2">
					<Skeleton class="h-7 w-48" />
					<Skeleton class="h-5 w-32" />
				</div>
			</div>
			<Skeleton class="h-40 w-full" rounded="xl" />
			<Skeleton class="h-60 w-full" rounded="xl" />
		</div>
	{:else if error}
		<div class="py-12 text-center">
			<p class="text-5xl mb-4">👤</p>
			<p class="text-text-muted">{error}</p>
		</div>
	{:else if user && stats}
		<div class="animate-[fade-in_300ms_ease-out]">
			<!-- Header -->
			<div class="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
				<!-- Avatar -->
				<div class="flex h-20 w-20 items-center justify-center rounded-full bg-surface-overlay text-3xl font-bold text-text-muted">
					{#if user.avatar_url}
						<img src={user.avatar_url} alt={user.display_name} class="h-20 w-20 rounded-full object-cover" />
					{:else}
						{user.display_name.charAt(0).toUpperCase()}
					{/if}
				</div>

				<div class="flex-1">
					<h1 class="text-2xl font-bold">{user.display_name}</h1>
					<div class="mt-1 flex flex-wrap items-center gap-2">
						<span class="text-sm font-semibold capitalize {titleColors[user.title]}">{i18n.t(`common.titles.${user.title}`)}</span>
						{#if user.golden_stars > 0}
							<span class="text-yellow-400">{'★'.repeat(user.golden_stars)}</span>
						{/if}
						<Badge variant={user.skill_domain}>{i18n.t(`common.domains.${user.skill_domain}`)}</Badge>
						{#if user.country}
							<span class="text-xs text-text-muted">{user.country}</span>
						{/if}
					</div>
					{#if user.bio}
						<p class="mt-2 text-sm text-text-muted">{user.bio}</p>
					{/if}
				</div>
			</div>

			<!-- Stats -->
			<div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div class="rounded-xl border border-border bg-surface-elevated p-4 text-center">
					<p class="text-2xl font-bold text-accent">{stats.total_fragments}</p>
					<p class="text-xs text-text-muted">{i18n.t('profile.stats.fragments')}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4 text-center">
					<p class="text-2xl font-bold">{stats.challenges_completed}</p>
					<p class="text-xs text-text-muted">{i18n.t('profile.stats.challenges')}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4 text-center">
					<p class="text-2xl font-bold">{stats.streak_current}j</p>
					<p class="text-xs text-text-muted">{i18n.t('profile.stats.streak')}</p>
				</div>
				<div class="rounded-xl border border-border bg-surface-elevated p-4 text-center">
					<p class="text-2xl font-bold">{stats.trust_score}%</p>
					<p class="text-xs text-text-muted">{i18n.t('profile.stats.trust')}</p>
				</div>
			</div>

			<!-- Heatmap -->
			{#if heatmap.length > 0}
				<div class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6">
					<h2 class="mb-4 text-sm font-semibold text-text-muted uppercase tracking-wider">{i18n.t('profile.sections.activity')}</h2>
					<Heatmap data={heatmap} />
				</div>
			{/if}

			<!-- Arbre de compétences -->
			{#if skillTree.length > 0}
				<div class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6">
					<h2 class="mb-4 text-sm font-semibold text-text-muted uppercase tracking-wider">{i18n.t('profile.sections.skills')}</h2>
					<SkillTree tree={skillTree} />
				</div>
			{/if}

			<!-- Badges -->
			{#if badges.length > 0}
				<div class="rounded-2xl border border-border bg-surface-elevated p-6">
					<h2 class="mb-4 text-sm font-semibold text-text-muted uppercase tracking-wider">{i18n.t('profile.sections.badges')}</h2>
					<div class="flex flex-wrap gap-3">
						{#each badges as badge}
							<div class="flex items-center gap-2 rounded-xl bg-surface-overlay px-3 py-2" title={badge.name}>
								<span class="text-lg">{badge.icon}</span>
								<span class="text-sm font-medium">{badge.name}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Liens sociaux -->
			{#if user.github || user.linkedin || user.website || user.twitter}
				<div class="mt-6 flex flex-wrap gap-3">
					{#if user.github}
						<a href="https://github.com/{user.github}" target="_blank" rel="noopener" class="text-sm text-text-muted hover:text-text-primary">{i18n.t('profile.links.github')}</a>
					{/if}
					{#if user.linkedin}
						<a href="https://linkedin.com/in/{user.linkedin}" target="_blank" rel="noopener" class="text-sm text-text-muted hover:text-text-primary">{i18n.t('profile.links.linkedin')}</a>
					{/if}
					{#if user.twitter}
						<a href="https://x.com/{user.twitter}" target="_blank" rel="noopener" class="text-sm text-text-muted hover:text-text-primary">{i18n.t('profile.links.twitter')}</a>
					{/if}
					{#if user.website}
						<a href={user.website} target="_blank" rel="noopener" class="text-sm text-text-muted hover:text-text-primary">{i18n.t('profile.links.website')}</a>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
