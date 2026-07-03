<script lang="ts">
	import { page } from '$app/stores';
	import { profileApi } from '$api/profile';
	import { auth } from '$stores/auth.svelte';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import SkillTree from '$components/profile/SkillTree.svelte';
	import Heatmap from '$components/profile/Heatmap.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Button from '$components/ui/Button.svelte';
	import JsonLd from '$lib/components/seo/JsonLd.svelte';
	import { profileJsonLd } from '$lib/utils/jsonld';
	import { geo } from '$stores/geo.svelte';
	import { onMount } from 'svelte';
	import type { UserPublic, SkillNode, HeatmapEntry } from '$types';

	onMount(() => {
		void geo.ensureCountries();
	});

	let username = $derived($page.params.username ?? '');

	let user = $state<UserPublic | null>(null);
	let stats = $state<{ challenges_completed: number; total_fragments: number; streak_current: number; trust_score: number } | null>(null);
	let skillTree = $state<SkillNode[]>([]);
	let heatmap = $state<HeatmapEntry[]>([]);
	let badges = $state<{ slug: string; name: string; icon: string; category: string; earned_at: string }[]>([]);
	let loading = $state(true);
	let error = $state('');

	let isOwnProfile = $derived(auth.user?.username === username);

	const titleColors: Record<string, string> = {
		apprenti: 'text-text-muted',
		artisan: 'text-blue-400',
		maitre: 'text-purple-400',
		legende: 'text-amber-400'
	};

	const domainDot: Record<string, string> = {
		code: 'bg-blue-500',
		design: 'bg-pink-500',
		game: 'bg-green-500',
		security: 'bg-red-500'
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

<div class="mx-auto max-w-5xl px-4 py-8">

	{#if loading}
		<!-- Skeleton: profile header -->
		<div class="rounded-xl border border-border bg-surface-elevated overflow-hidden mb-6">
			<div class="p-6">
				<div class="flex items-center gap-5">
					<Skeleton class="h-16 w-16" rounded="full" />
					<div class="flex-1 space-y-2">
						<Skeleton class="h-6 w-40" />
						<Skeleton class="h-4 w-24" />
					</div>
				</div>
			</div>
			<div class="grid grid-cols-4 divide-x divide-border border-t border-border">
				{#each Array(4) as _}
					<div class="p-4 text-center">
						<Skeleton class="h-7 w-12 mx-auto mb-1" />
						<Skeleton class="h-3 w-16 mx-auto" />
					</div>
				{/each}
			</div>
		</div>
		<!-- Skeleton: content blocks -->
		<div class="grid lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-6">
				<Skeleton class="h-40 w-full" rounded="xl" />
				<Skeleton class="h-48 w-full" rounded="xl" />
			</div>
			<div class="space-y-6">
				<Skeleton class="h-32 w-full" rounded="xl" />
				<Skeleton class="h-24 w-full" rounded="xl" />
			</div>
		</div>

	{:else if error}
		<div class="py-16 text-center">
			<p class="text-4xl font-bold text-text-muted mb-2">404</p>
			<p class="text-text-muted mb-6">{error}</p>
			<Button variant="secondary" href="/leaderboards">{i18n.t('errors.backHome')}</Button>
		</div>

	{:else if user && stats}
		<!-- Profile card -->
		<div class="rounded-xl border border-border bg-surface-elevated overflow-hidden mb-6">
			<!-- Header row -->
			<div class="p-6">
				<div class="flex items-start gap-5">
					<!-- Avatar -->
					<div class="shrink-0 h-16 w-16 rounded-full bg-surface-overlay flex items-center justify-center text-2xl font-bold {titleColors[user.title]}">
						{#if user.avatar_url}
							<img src={user.avatar_url} alt={user.display_name} class="h-16 w-16 rounded-full object-cover" />
						{:else}
							{user.display_name.charAt(0).toUpperCase()}
						{/if}
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-3 flex-wrap">
							<h1 class="text-xl font-bold">{user.display_name}</h1>
							<span class="text-xs text-text-muted font-mono">@{user.username}</span>
						</div>
						<div class="mt-1 flex items-center gap-2 flex-wrap">
							<span class="text-sm font-semibold capitalize {titleColors[user.title]}">{i18n.t(`common.titles.${user.title}`)}</span>
							{#if user.golden_stars > 0}
								<span class="text-amber-400 text-sm">{'★'.repeat(user.golden_stars)}</span>
							{/if}
							<div class="flex items-center gap-1.5">
								<div class="h-2 w-2 rounded-full {domainDot[user.skill_domain]}"></div>
								<span class="text-xs text-text-muted">{i18n.t(`common.domains.${user.skill_domain}`)}</span>
							</div>
							{#if user.country || user.city}
								<span class="text-xs text-text-muted">
									{#if user.city}{user.city}{/if}{#if user.city && user.country}, {/if}{#if user.country}{geo.label(user.country)}{/if}
								</span>
							{/if}
						</div>
						{#if user.bio}
							<p class="mt-3 text-sm text-text-muted leading-relaxed">{user.bio}</p>
						{/if}
					</div>

					<!-- Actions -->
					{#if isOwnProfile}
						<Button variant="secondary" href="/settings" class="shrink-0">
							{i18n.locale === 'fr' ? 'Modifier' : 'Edit'}
						</Button>
					{/if}
				</div>

				<!-- Social links -->
				{#if user.github || user.linkedin || user.website || user.twitter}
					<div class="mt-4 pt-4 border-t border-border flex flex-wrap gap-4">
						{#if user.github}
							<a href="https://github.com/{user.github}" target="_blank" rel="noopener" class="flex items-center gap-1.5 text-xs text-text-muted transition-colors duration-200 hover:text-text-primary">
								<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
								{user.github}
							</a>
						{/if}
						{#if user.linkedin}
							<a href="https://linkedin.com/in/{user.linkedin}" target="_blank" rel="noopener" class="flex items-center gap-1.5 text-xs text-text-muted transition-colors duration-200 hover:text-text-primary">
								<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
								{user.linkedin}
							</a>
						{/if}
						{#if user.twitter}
							<a href="https://x.com/{user.twitter}" target="_blank" rel="noopener" class="flex items-center gap-1.5 text-xs text-text-muted transition-colors duration-200 hover:text-text-primary">
								<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
								@{user.twitter}
							</a>
						{/if}
						{#if user.website}
							<a href={user.website} target="_blank" rel="noopener" class="flex items-center gap-1.5 text-xs text-text-muted transition-colors duration-200 hover:text-text-primary">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
								{user.website.replace(/^https?:\/\//, '')}
							</a>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Stats bar -->
			<div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-t border-border">
				<div class="p-4 text-center">
					<p class="text-2xl font-bold text-accent">{stats.total_fragments.toLocaleString()}</p>
					<p class="text-[11px] text-text-muted">{i18n.t('profile.stats.fragments')}</p>
				</div>
				<div class="p-4 text-center">
					<p class="text-2xl font-bold">{stats.challenges_completed}</p>
					<p class="text-[11px] text-text-muted">{i18n.t('profile.stats.challenges')}</p>
				</div>
				<div class="p-4 text-center">
					<p class="text-2xl font-bold">{stats.streak_current}<span class="text-sm text-text-muted font-normal">j</span></p>
					<p class="text-[11px] text-text-muted">{i18n.t('profile.stats.streak')}</p>
				</div>
				<div class="p-4 text-center">
					<p class="text-2xl font-bold">{stats.trust_score}<span class="text-sm text-text-muted font-normal">%</span></p>
					<p class="text-[11px] text-text-muted">{i18n.t('profile.stats.trust')}</p>
				</div>
			</div>
		</div>

		<!-- Content grid: main + sidebar -->
		<div class="grid lg:grid-cols-3 gap-6">

			<!-- Main content -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Heatmap -->
				{#if heatmap.length > 0}
					<div class="rounded-xl border border-border bg-surface-elevated overflow-hidden">
						<div class="px-5 py-3 border-b border-border">
							<span class="text-xs font-bold uppercase tracking-wider text-text-muted">{i18n.t('profile.sections.activity')}</span>
						</div>
						<div class="p-5">
							<Heatmap data={heatmap} />
						</div>
					</div>
				{/if}

				<!-- Skill tree -->
				{#if skillTree.length > 0}
					<div class="rounded-xl border border-border bg-surface-elevated overflow-hidden">
						<div class="px-5 py-3 border-b border-border">
							<span class="text-xs font-bold uppercase tracking-wider text-text-muted">{i18n.t('profile.sections.skills')}</span>
						</div>
						<div class="p-5">
							<SkillTree tree={skillTree} />
						</div>
					</div>
				{:else}
					<div class="rounded-xl border border-border bg-surface-elevated p-8 text-center">
						<p class="text-sm text-text-muted">{i18n.t('profile.noSkills')}</p>
					</div>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Badges -->
				{#if badges.length > 0}
					<div class="rounded-xl border border-border bg-surface-elevated overflow-hidden">
						<div class="px-5 py-3 border-b border-border">
							<span class="text-xs font-bold uppercase tracking-wider text-text-muted">{i18n.t('profile.sections.badges')}</span>
						</div>
						<div class="p-4">
							<div class="grid grid-cols-2 gap-2">
								{#each badges as badge}
									<div class="flex items-center gap-2 rounded-lg bg-surface-overlay px-3 py-2" title={badge.name}>
										<span class="text-base">{badge.icon}</span>
										<span class="text-xs font-medium truncate">{badge.name}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Member since -->
				<div class="rounded-xl border border-border bg-surface-elevated p-5">
					<p class="text-xs text-text-muted mb-1">{i18n.locale === 'fr' ? 'Membre depuis' : 'Member since'}</p>
					<p class="text-sm font-medium">{new Date(user.member_since).toLocaleDateString(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}</p>
				</div>
			</div>
		</div>
	{/if}
</div>
