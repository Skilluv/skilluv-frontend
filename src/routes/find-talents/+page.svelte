<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import { createApiClient, SkilluError } from '$api/client';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import CountrySelect from '$components/ui/CountrySelect.svelte';
	import { geo } from '$stores/geo.svelte';
	import type { TalentCard, SkillDomain, Title, ApiPaginatedResponse } from '$lib/types';

	const api = createApiClient();

	let talents = $state<TalentCard[]>([]);
	let loading = $state(true);
	let error = $state('');
	let restricted = $state(false);
	let total = $state(0);
	let currentPage = $state(1);
	let totalPages = $state(1);

	// Filtres
	let query = $state('');
	let queryDebounced = $state('');
	let queryTimer: ReturnType<typeof setTimeout> | undefined;
	let filterDomain = $state<SkillDomain | ''>('');
	let filterTitle = $state<Title | ''>('');
	let filterCountry = $state<string | null>(null);
	let sortBy = $state<'fragments' | 'recent' | 'relevance'>('fragments');

	const domains: { value: SkillDomain | ''; fr: string; en: string }[] = [
		{ value: '', fr: 'Tous', en: 'All' },
		{ value: 'code', fr: 'Code', en: 'Code' },
		{ value: 'design', fr: 'Design', en: 'Design' },
		{ value: 'game', fr: 'Game', en: 'Game' },
		{ value: 'security', fr: 'Sécurité', en: 'Security' }
	];

	const titles: { value: Title | ''; fr: string; en: string }[] = [
		{ value: '', fr: 'Tous niveaux', en: 'All levels' },
		{ value: 'apprenti', fr: 'Apprenti', en: 'Apprentice' },
		{ value: 'artisan', fr: 'Artisan', en: 'Artisan' },
		{ value: 'maitre', fr: 'Maître', en: 'Master' },
		{ value: 'legende', fr: 'Légende', en: 'Legend' }
	];

	const titleColors: Record<string, string> = {
		apprenti: 'text-text-muted',
		artisan: 'text-blue-400',
		maitre: 'text-accent',
		legende: 'text-yellow-400'
	};

	function debounceQuery() {
		clearTimeout(queryTimer);
		queryTimer = setTimeout(() => {
			queryDebounced = query.trim();
			currentPage = 1;
		}, 350);
	}

	$effect(() => {
		// Re-fetch dès qu'un filtre change
		void queryDebounced;
		void filterDomain;
		void filterTitle;
		void filterCountry;
		void sortBy;
		void currentPage;
		searchTalents();
	});

	async function searchTalents() {
		loading = true;
		error = '';
		restricted = false;
		try {
			const res = await api.get<ApiPaginatedResponse<TalentCard>>('/talents/search', {
				q: queryDebounced || undefined,
				skill_domain: filterDomain || undefined,
				title: filterTitle || undefined,
				country: filterCountry || undefined,
				sort_by: queryDebounced && sortBy === 'relevance' ? 'relevance' : sortBy,
				page: currentPage,
				per_page: 20
			});
			talents = res.data;
			total = res.pagination.total;
			totalPages = res.pagination.total_pages;
		} catch (err) {
			if (err instanceof SkilluError && (err.status === 401 || err.status === 403)) {
				restricted = true;
				talents = [];
			} else if (err instanceof SkilluError) {
				error = err.message;
			} else {
				error = i18n.t('errors.generic');
			}
		} finally {
			loading = false;
		}
	}

	function resetFilters() {
		query = '';
		queryDebounced = '';
		filterDomain = '';
		filterTitle = '';
		filterCountry = null;
		sortBy = 'fragments';
		currentPage = 1;
	}

	let activeFilterCount = $derived(
		(queryDebounced ? 1 : 0) +
			(filterDomain ? 1 : 0) +
			(filterTitle ? 1 : 0) +
			(filterCountry ? 1 : 0)
	);

	let ctaHref = $derived(auth.isAuthenticated ? '/enterprise/talents' : '/enterprise/register');
	let ctaLabel = $derived(
		auth.isAuthenticated
			? i18n.locale === 'fr'
				? 'Ouvrir la recherche complète'
				: 'Open the full search'
			: i18n.locale === 'fr'
				? "Créer mon espace pour contacter"
				: 'Create my space to contact'
	);

	const filterCards = [
		{ icon: '◎', fr: { t: 'Par domaine', d: 'Code, design, game, security.' }, en: { t: 'By domain', d: 'Code, design, game, security.' } },
		{ icon: '⌬', fr: { t: 'Par niveau', d: 'Apprenti, artisan, maître, légende.' }, en: { t: 'By level', d: 'Apprentice, artisan, master, legend.' } },
		{ icon: '◬', fr: { t: 'Par recherche libre', d: 'Pseudonyme, pays, bio, langage.' }, en: { t: 'By free search', d: 'Username, country, bio, language.' } },
		{ icon: '⬚', fr: { t: 'Par pays', d: 'France, Bénin, Côte d\'Ivoire, Sénégal, etc.' }, en: { t: 'By country', d: 'France, Benin, Ivory Coast, Senegal, etc.' } },
		{ icon: '◇', fr: { t: 'Par récence', d: 'Talents les plus actifs en premier.' }, en: { t: 'By recency', d: 'Most recently active talents first.' } },
		{ icon: '◆', fr: { t: 'Par fragments', d: 'Tri par puissance accumulée sur la plateforme.' }, en: { t: 'By fragments', d: 'Sort by total power accumulated on the platform.' } }
	];
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Trouver des talents — Skilluv' : 'Find talents — Skilluv'}</title>
	<meta
		name="description"
		content={i18n.locale === 'fr'
			? 'Trouvez des talents tech sur Skilluv : sourcing par compétences prouvées, filtres avancés.'
			: 'Find tech talents on Skilluv: source by proven skills, advanced filters.'}
	/>
</svelte:head>

<!-- Hero -->
<section class="border-b border-border">
	<div class="mx-auto max-w-6xl px-4 py-16 sm:py-20">
		<div class="max-w-4xl">
			<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
				{#if i18n.locale === 'fr'}
					Cherchez ce qui se prouve.<br />
					<span class="text-accent">Pas ce qui se déclare.</span>
				{:else}
					Search what's proven.<br />
					<span class="text-accent">Not what's declared.</span>
				{/if}
			</h1>
			<p class="mt-8 max-w-2xl text-base text-text-muted sm:text-lg">
				{i18n.locale === 'fr'
					? "Explorez la base publique des talents. Filtres avancés, données réelles. Pour les contacter, créez votre espace entreprise."
					: 'Browse the public talents directory. Advanced filters, real data. To contact them, create your enterprise space.'}
			</p>
		</div>
	</div>
</section>

<!-- Search panel (functional) -->
<section class="mx-auto max-w-6xl px-4 py-10">
	<!-- Filters bar -->
	<div class="rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5">
		<div class="flex flex-col gap-4">
			<!-- Search input + country + reset -->
			<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
				<div class="flex-1">
					<Input
						placeholder={i18n.locale === 'fr'
							? 'Rechercher un pseudo, un nom…'
							: 'Search a username, name…'}
						bind:value={query}
						oninput={debounceQuery}
					/>
				</div>
				<div class="sm:w-56">
					<CountrySelect
						placeholder={i18n.locale === 'fr' ? 'Tous les pays' : 'All countries'}
						bind:value={filterCountry}
						clearable
						onchange={() => { currentPage = 1; }}
					/>
				</div>
				{#if activeFilterCount > 0}
					<Button variant="ghost" size="sm" onclick={resetFilters}>
						{i18n.locale === 'fr' ? 'Réinitialiser' : 'Reset'} ({activeFilterCount})
					</Button>
				{/if}
			</div>

			<!-- Domain pills + selects -->
			<div class="flex flex-wrap items-center gap-3">
				<div class="flex flex-wrap gap-1">
					{#each domains as d}
						<button
							type="button"
							class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors
								{filterDomain === d.value
									? 'bg-primary text-primary-fg'
									: 'bg-surface-overlay text-text-muted hover:text-text-primary'}"
							onclick={() => { filterDomain = d.value; currentPage = 1; }}
						>
							{i18n.locale === 'fr' ? d.fr : d.en}
						</button>
					{/each}
				</div>

				<select
					bind:value={filterTitle}
					onchange={() => { currentPage = 1; }}
					class="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary"
				>
					{#each titles as t}
						<option value={t.value}>{i18n.locale === 'fr' ? t.fr : t.en}</option>
					{/each}
				</select>

				<select
					bind:value={sortBy}
					onchange={() => { currentPage = 1; }}
					class="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary"
				>
					<option value="fragments">{i18n.locale === 'fr' ? 'Tri : fragments' : 'Sort: fragments'}</option>
					<option value="recent">{i18n.locale === 'fr' ? 'Tri : récents' : 'Sort: recent'}</option>
					{#if queryDebounced}
						<option value="relevance">{i18n.locale === 'fr' ? 'Tri : pertinence' : 'Sort: relevance'}</option>
					{/if}
				</select>

				<span class="ml-auto text-xs text-text-muted">
					{#if loading}
						{i18n.locale === 'fr' ? 'Recherche…' : 'Searching…'}
					{:else if !restricted && !error}
						{total} {i18n.locale === 'fr' ? 'talent(s)' : 'talent(s)'}
					{/if}
				</span>
			</div>
		</div>
	</div>

	<!-- Results -->
	<div class="mt-5">
		{#if restricted}
			<div class="rounded-2xl border border-accent/30 bg-surface-elevated p-8 text-center">
				<p class="text-base font-semibold text-text-primary">
					{i18n.locale === 'fr'
						? 'La recherche complète nécessite un espace entreprise'
						: 'Full search requires an enterprise space'}
				</p>
				<p class="mx-auto mt-2 max-w-md text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Créez votre compte entreprise gratuitement pour accéder à la base complète et contacter les talents.'
						: 'Create your enterprise account for free to access the full directory and contact talents.'}
				</p>
				<div class="mt-5">
					<Button variant="accent" href="/enterprise/register">
						{i18n.locale === 'fr' ? 'Créer mon espace' : 'Create my space'}
					</Button>
				</div>
			</div>
		{:else if error}
			<div class="rounded-2xl border border-error/30 bg-error/5 p-6 text-center text-sm text-error">
				{error}
			</div>
		{:else if loading}
			<div class="flex flex-col gap-3">
				{#each Array(6) as _}
					<div
						class="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4"
						aria-busy="true"
						aria-label={i18n.locale === 'fr' ? 'Chargement' : 'Loading'}
					>
						<!-- Avatar (h-12 w-12) -->
						<div class="h-12 w-12 shrink-0 rounded-full bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>

						<!-- Info -->
						<div class="min-w-0 flex-1">
							<!-- name (font-medium ~text-base) -->
							<div class="h-4 w-32 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
							<!-- meta line (text-xs) -->
							<div class="mt-2 flex flex-wrap items-center gap-2">
								<div class="h-3 w-16 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
								<div class="h-3 w-12 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
								<div class="hidden h-3 w-20 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite] sm:block"></div>
							</div>
						</div>

						<!-- Stats sm:flex -->
						<div class="hidden items-center gap-5 sm:flex">
							{#each Array(3) as _}
								<div class="text-center">
									<div class="mx-auto h-5 w-10 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
									<div class="mx-auto mt-1 h-2 w-12 rounded bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
								</div>
							{/each}
						</div>

						<!-- Action btn ("Voir le profil") -->
						<div class="h-7 w-24 shrink-0 rounded-full border border-border bg-surface-overlay animate-[skeleton-pulse_1.5s_ease-in-out_infinite]"></div>
					</div>
				{/each}
			</div>
		{:else if talents.length === 0}
			<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
				<p class="text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Aucun talent ne correspond à ces filtres.'
						: 'No talent matches these filters.'}
				</p>
				<Button variant="ghost" size="sm" onclick={resetFilters} class="mt-4">
					{i18n.locale === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
				</Button>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each talents as t (t.id)}
					<article class="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4 transition-all hover:border-primary/30">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-lg font-bold text-primary">
							{t.display_name.charAt(0).toUpperCase()}
						</div>

						<a href="/profile/{t.username}" class="min-w-0 flex-1">
							<p class="truncate font-medium text-text-primary hover:text-accent">{t.display_name}</p>
							<div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
								<span class="capitalize {titleColors[t.title] ?? 'text-text-muted'}">{t.title}</span>
								{#if t.golden_stars > 0}
									<span class="text-yellow-400">{'★'.repeat(Math.min(t.golden_stars, 5))}</span>
								{/if}
								<Badge variant={t.skill_domain}>{t.skill_domain}</Badge>
								{#if t.country}<span>· {geo.label(t.country)}</span>{/if}
								{#if t.top_skills && t.top_skills.length > 0}
									<span class="hidden sm:inline">·</span>
									<div class="hidden gap-1 sm:flex">
										{#each t.top_skills.slice(0, 3) as skill}
											<span class="rounded-md bg-surface-overlay px-1.5 py-0.5 text-[10px] font-medium text-text-muted">{skill.name}</span>
										{/each}
									</div>
								{/if}
							</div>
						</a>

						<div class="hidden items-center gap-5 text-sm sm:flex">
							<div class="text-center">
								<p class="font-bold text-accent">{t.total_fragments.toLocaleString()}</p>
								<p class="text-[10px] uppercase tracking-wider text-text-muted">{i18n.t('common.fragments')}</p>
							</div>
							<div class="text-center">
								<p class="font-bold text-text-primary">{t.streak_current}j</p>
								<p class="text-[10px] uppercase tracking-wider text-text-muted">{i18n.t('common.streak')}</p>
							</div>
							{#if t.badge_count !== undefined && t.badge_count > 0}
								<div class="text-center">
									<p class="font-bold text-text-primary">{t.badge_count}</p>
									<p class="text-[10px] uppercase tracking-wider text-text-muted">{i18n.locale === 'fr' ? 'badges' : 'badges'}</p>
								</div>
							{/if}
						</div>

						<a
							href="/profile/{t.username}"
							class="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-text-muted transition-colors duration-200 hover:border-primary hover:text-primary"
						>
							{i18n.locale === 'fr' ? 'Voir le profil' : 'View profile'}
						</a>
					</article>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-6 flex items-center justify-center gap-4">
					<Button variant="ghost" size="sm" disabled={currentPage <= 1} onclick={() => { currentPage--; }}>
						← {i18n.t('common.actions.previous')}
					</Button>
					<span class="text-sm text-text-muted">
						{i18n.t('common.page')} {currentPage} / {totalPages}
					</span>
					<Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onclick={() => { currentPage++; }}>
						{i18n.t('common.actions.next')} →
					</Button>
				</div>
			{/if}

			<!-- Soft CTA below results -->
			<div class="mt-8 rounded-2xl border border-dashed border-border bg-surface-elevated/60 p-5 text-center">
				<p class="text-sm text-text-muted">
					{i18n.locale === 'fr'
						? 'Pour contacter un talent, ajouter à des listes ou suivre vos favoris, créez votre espace entreprise.'
						: 'To contact a talent, build lists or follow favourites, create your enterprise space.'}
				</p>
				<div class="mt-4">
					<Button variant="accent" size="sm" href={ctaHref}>{ctaLabel}</Button>
				</div>
			</div>
		{/if}
	</div>
</section>

<!-- Filters explainer -->
<section class="border-t border-border bg-surface-elevated/40 py-20 sm:py-24">
	<div class="mx-auto max-w-6xl px-4">
		<h2 class="mb-5 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight text-text-primary">
			{i18n.locale === 'fr' ? 'Vos critères,' : 'Your criteria,'}<br />
			<span class="text-accent">{i18n.locale === 'fr' ? 'pas les nôtres.' : 'not ours.'}</span>
		</h2>
		<p class="mb-10 max-w-2xl text-lg text-text-muted">
			{i18n.locale === 'fr'
				? 'Chaque filtre s\'appuie sur des données générées par l\'activité réelle des talents.'
				: 'Each filter is backed by data generated by the talents’ real activity.'}
		</p>
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each filterCards as f}
				{@const t = i18n.locale === 'fr' ? f.fr : f.en}
				<article class="rounded-2xl border border-border bg-surface-elevated p-6">
					<div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-xl text-accent">{f.icon}</div>
					<h3 class="text-base font-semibold text-text-primary">{t.t}</h3>
					<p class="mt-2 text-sm leading-relaxed text-text-muted">{t.d}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- Privacy reassurance -->
<section class="mx-auto max-w-6xl px-4 py-16">
	<div class="rounded-3xl border border-border bg-surface-elevated p-8 sm:p-10">
		<h2 class="mb-4 text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
			{i18n.locale === 'fr' ? 'Confidentialité des talents respectée' : 'Talent privacy respected'}<span class="text-accent">.</span>
		</h2>
		<p class="text-sm leading-relaxed text-text-muted">
			{i18n.locale === 'fr'
				? "Aucun talent n'est exposé sans son accord. Chaque profil utilisateur contrôle sa visibilité et peut désactiver les manifestations d'intérêt. Le traitement des données suit le RGPD et la loi béninoise n° 2017-20."
				: 'No talent is exposed without consent. Each user profile controls their visibility and can opt out of expressions of interest. Data processing follows the GDPR and Beninese Act No. 2017-20.'}
		</p>
		<div class="mt-4 flex flex-wrap gap-3">
			<Button variant="ghost" size="sm" href="/legal/privacy">
				{i18n.locale === 'fr' ? 'Politique de confidentialité' : 'Privacy policy'}
			</Button>
			<Button variant="ghost" size="sm" href="/legal/gdpr">
				{i18n.locale === 'fr' ? 'Droits RGPD' : 'GDPR rights'}
			</Button>
		</div>
	</div>
</section>

<!-- CTA -->
<section class="py-20 sm:py-28">
	<div class="mx-auto max-w-6xl px-4">
		<div class="rounded-3xl border border-border bg-surface-elevated p-12 sm:p-16 lg:p-20 text-center">
			<h2 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight text-text-primary">
				{i18n.locale === 'fr' ? 'Commencez à sourcer' : 'Start sourcing'}<br />
				<span class="text-accent">{i18n.locale === 'fr' ? "aujourd'hui." : 'today.'}</span>
			</h2>
			<p class="mx-auto mt-5 max-w-xl text-lg text-text-muted">
				{i18n.locale === 'fr'
					? 'Créez votre espace entreprise et engagez la conversation avec les talents qui vous intéressent.'
					: 'Create your enterprise space and start conversations with the talents you care about.'}
			</p>
			<div class="mt-8 flex flex-wrap justify-center gap-3">
				<Button variant="accent" size="lg" href={ctaHref}>{ctaLabel}</Button>
			</div>
		</div>
	</div>
</section>
