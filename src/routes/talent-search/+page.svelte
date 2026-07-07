<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Select from '$components/ui/Select.svelte';
	import Pagination from '$components/ui/Pagination.svelte';
	import { talentSearchV2Api, type TalentV2, type SortByV2, type LookingFor } from '$api/talent_search_v2';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import type { SkillDomain, Title } from '$lib/types';

	let talents = $state<TalentV2[]>([]);
	let total = $state(0);
	let loading = $state(false);
	let page = $state(1);
	const perPage = 20;

	// 9 filters
	let q = $state('');
	let skillDomain = $state<SkillDomain | ''>('');
	let title = $state<Title | ''>('');
	let countryIso2 = $state('');
	let minFragments = $state<number | ''>('');
	let minStreak = $state<number | ''>('');
	let tag = $state('');
	let badge = $state('');
	let lookingFor = $state<LookingFor | ''>('');
	let availableOnly = $state(false);
	let languageSpoken = $state('');
	let hasProjects = $state(false);
	let minGithubRepos = $state<number | ''>('');
	let sortBy = $state<SortByV2>('fragments');

	async function search() {
		loading = true;
		try {
			const params: Record<string, string | number | boolean | undefined> = {
				page,
				per_page: perPage,
				sort_by: sortBy
			};
			if (q.trim()) params.q = q.trim();
			if (skillDomain) params.skill_domain = skillDomain;
			if (title) params.title = title;
			if (countryIso2) params.country_iso2 = countryIso2.toUpperCase();
			if (typeof minFragments === 'number' && minFragments > 0) params.min_fragments = minFragments;
			if (typeof minStreak === 'number' && minStreak > 0) params.min_streak = minStreak;
			if (tag.trim()) params.tag = tag.trim();
			if (badge.trim()) params.badge = badge.trim();
			if (lookingFor) params.looking_for = lookingFor;
			if (availableOnly) params.available_only = true;
			if (languageSpoken.trim()) params.language_spoken = languageSpoken.trim().toLowerCase();
			if (hasProjects) params.has_projects = true;
			if (typeof minGithubRepos === 'number' && minGithubRepos > 0) params.min_github_repos = minGithubRepos;

			const res = await talentSearchV2Api.search(params);
			talents = res.data;
			total = (res as any).pagination?.total ?? talents.length;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	function reset() {
		q = ''; skillDomain = ''; title = ''; countryIso2 = '';
		minFragments = ''; minStreak = ''; tag = ''; badge = '';
		lookingFor = ''; availableOnly = false; languageSpoken = '';
		hasProjects = false; minGithubRepos = '';
		sortBy = 'fragments'; page = 1;
		void search();
	}

	function fmtActivity(iso: string | null): string {
		if (!iso) return '—';
		const d = new Date(iso);
		const diff = Math.floor((Date.now() - d.getTime()) / 1000);
		if (diff < 3600) return i18n.locale === 'fr' ? 'à l\'instant' : 'just now';
		if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
		if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' }).format(d);
	}

	onMount(() => void search());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Recherche avancée talents — Skilluv' : 'Advanced talent search — Skilluv'}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-10 sm:py-14">
	<div class="mb-8 sm:mb-12">
		<h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
			{i18n.locale === 'fr' ? 'Recherche' : 'Advanced'}<br />
			<span class="text-primary">{i18n.locale === 'fr' ? '9 dimensions.' : 'search.'}</span>
		</h1>
		<p class="mt-5 max-w-xl text-base text-text-muted">
			{i18n.locale === 'fr'
				? 'Filtres croisés compétence, disponibilité, streak, langue, projets, badges, GitHub, tags, pays.'
				: 'Cross filters on skill, availability, streak, language, projects, badges, GitHub, tags, country.'}
		</p>
	</div>

	<div class="grid gap-8 lg:grid-cols-[300px_1fr]">
		<!-- Filters sidebar -->
		<aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
			<div class="rounded-2xl border border-border bg-surface-elevated p-5 space-y-3">
				<div>
					<label for="q" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Recherche libre' : 'Free text'}
					</label>
					<input id="q" bind:value={q} placeholder="python react..." class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
				</div>

				<div>
					<label for="sd" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Domaine' : 'Domain'}
					</label>
					<Select
						items={[
							{ value: '', label: i18n.locale === 'fr' ? 'Tous' : 'All' },
							{ value: 'code', label: 'Code' },
							{ value: 'design', label: 'Design' },
							{ value: 'game', label: 'Game' },
							{ value: 'security', label: 'Security' }
						]}
						bind:value={skillDomain}
						class="w-full"
					/>
				</div>

				<div>
					<label for="tt" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Titre min.' : 'Min title'}
					</label>
					<Select
						items={[
							{ value: '', label: i18n.locale === 'fr' ? 'Peu importe' : 'Any' },
							{ value: 'apprenti', label: 'Apprenti' },
							{ value: 'artisan', label: 'Artisan' },
							{ value: 'maitre', label: 'Maître' },
							{ value: 'legende', label: 'Légende' }
						]}
						bind:value={title}
						class="w-full"
					/>
				</div>

				<div>
					<label for="cc" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Pays (ISO2)' : 'Country (ISO2)'}
					</label>
					<input id="cc" bind:value={countryIso2} maxlength="2" placeholder="FR" class="w-24 rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm uppercase focus:border-primary focus:outline-none" />
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div>
						<label for="mf" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Min frag.' : 'Min frag.'}
						</label>
						<input id="mf" type="number" bind:value={minFragments} min="0" class="no-spinner w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
					</div>
					<div>
						<label for="ms" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Min streak' : 'Min streak'}
						</label>
						<input id="ms" type="number" bind:value={minStreak} min="0" class="no-spinner w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div>
						<label for="tag" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">Tag</label>
						<input id="tag" bind:value={tag} placeholder="rust" class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
					</div>
					<div>
						<label for="bd" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">Badge</label>
						<input id="bd" bind:value={badge} placeholder="early" class="w-full rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
					</div>
				</div>

				<div>
					<label for="lf" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Cherche' : 'Looking for'}
					</label>
					<Select
						items={[
							{ value: '', label: i18n.locale === 'fr' ? 'Peu importe' : 'Any' },
							{ value: 'cdi', label: 'CDI' },
							{ value: 'cdd', label: 'CDD' },
							{ value: 'freelance', label: 'Freelance' },
							{ value: 'internship', label: i18n.locale === 'fr' ? 'Stage' : 'Internship' },
							{ value: 'contract', label: 'Contract' }
						]}
						bind:value={lookingFor}
						class="w-full"
					/>
				</div>

				<div>
					<label for="lang" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Langue parlée (min B2)' : 'Spoken language (min B2)'}
					</label>
					<input id="lang" bind:value={languageSpoken} placeholder="fr, en, ar..." maxlength="2" class="w-24 rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm lowercase focus:border-primary focus:outline-none" />
				</div>

				<div>
					<label for="mgr" class="block mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'GitHub repos min.' : 'Min GitHub repos'}
					</label>
					<input id="mgr" type="number" bind:value={minGithubRepos} min="0" class="no-spinner w-24 rounded-full border border-border bg-surface-overlay px-4 py-2 text-sm focus:border-primary focus:outline-none" />
				</div>

				<div class="pt-2 space-y-2 border-t border-border">
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" bind:checked={availableOnly} class="h-4 w-4 accent-primary" />
						<span>{i18n.locale === 'fr' ? 'Disponibles uniquement' : 'Available only'}</span>
					</label>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input type="checkbox" bind:checked={hasProjects} class="h-4 w-4 accent-primary" />
						<span>{i18n.locale === 'fr' ? 'A des projets' : 'Has projects'}</span>
					</label>
				</div>
			</div>

			<div class="flex gap-2">
				<Button variant="accent" loading={loading} onclick={() => { page = 1; void search(); }} class="flex-1">
					{i18n.locale === 'fr' ? 'Rechercher' : 'Search'}
				</Button>
				<Button variant="ghost" onclick={reset}>↺</Button>
			</div>
		</aside>

		<!-- Results -->
		<main>
			<div class="mb-4 flex items-center justify-between">
				<p class="text-sm text-text-muted">
					<span class="font-bold text-text-primary">{total}</span>
					{i18n.locale === 'fr' ? 'talents' : 'talents'}
				</p>
				<Select
					size="sm"
					items={[
						{ value: 'fragments', label: i18n.locale === 'fr' ? 'Fragments' : 'Fragments' },
						{ value: 'recent', label: i18n.locale === 'fr' ? 'Récent' : 'Recent' },
						{ value: 'most_active_recently', label: i18n.locale === 'fr' ? 'Plus actifs' : 'Most active' },
						{ value: 'top_in_domain', label: i18n.locale === 'fr' ? 'Top domaine' : 'Top in domain' }
					]}
					bind:value={sortBy}
					onchange={() => void search()}
				/>
			</div>

			{#if loading}
				<div class="grid gap-4 sm:grid-cols-2">
					{#each Array(6) as _}
						<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-48"></div>
					{/each}
				</div>
			{:else if talents.length === 0}
				<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
					<div class="mb-3 text-4xl text-text-muted">◎</div>
					<p class="text-text-muted">
						{i18n.locale === 'fr' ? 'Aucun talent ne correspond.' : 'No talent matches.'}
					</p>
				</div>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2">
					{#each talents as t}
						<a href={`/profile/${t.username}`} class="group flex flex-col rounded-2xl border border-border bg-surface-elevated p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
							<div class="mb-3 flex items-start gap-3">
								<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-black text-primary">
									{t.display_name.charAt(0)}
								</div>
								<div class="min-w-0 flex-1">
									<h3 class="font-bold group-hover:text-primary transition-colors truncate">{t.display_name}</h3>
									<p class="font-mono text-xs text-text-muted truncate">@{t.username}</p>
									<div class="mt-1 flex flex-wrap gap-1">
										<Badge variant="primary" size="sm">{t.skill_domain}</Badge>
										<Badge variant="default" size="sm">{t.title}</Badge>
										{#if t.country_iso2}<Badge variant="default" size="sm">{t.country_iso2}</Badge>{/if}
										{#if t.available_for_hire}
											<Badge variant="success" size="sm">
												● {i18n.locale === 'fr' ? 'Dispo' : 'Available'}
											</Badge>
										{/if}
									</div>
								</div>
							</div>

							<div class="mb-3 grid grid-cols-3 gap-2 rounded-xl border border-border bg-surface-overlay p-3 text-center">
								<div>
									<div class="text-lg font-black text-primary">{t.total_fragments.toLocaleString()}</div>
									<div class="text-[10px] uppercase tracking-wider text-text-muted">frag.</div>
								</div>
								<div>
									<div class="text-lg font-black">{t.streak_current}</div>
									<div class="text-[10px] uppercase tracking-wider text-text-muted">streak</div>
								</div>
								<div>
									<div class="text-lg font-black text-accent">{t.badge_count}</div>
									<div class="text-[10px] uppercase tracking-wider text-text-muted">badges</div>
								</div>
							</div>

							{#if t.top_skills.length}
								<div class="mb-3 flex flex-wrap gap-1.5">
									{#each t.top_skills.slice(0, 3) as s}
										<Badge variant="default" size="sm">{s.sub_skill}</Badge>
									{/each}
								</div>
							{/if}

							<div class="mt-auto flex items-center justify-between text-xs text-text-muted">
								<span>{i18n.locale === 'fr' ? 'Actif' : 'Active'} {fmtActivity(t.last_activity_at)}</span>
								<span class="font-mono">{t.project_count} projects</span>
							</div>
						</a>
					{/each}
				</div>

				<Pagination
					current={page}
					total={Math.ceil(total / perPage)}
					onchange={(p) => { page = p; void search(); }}
				/>
			{/if}
		</main>
	</div>
</div>
