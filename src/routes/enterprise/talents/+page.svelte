<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Select from '$components/ui/Select.svelte';
	import MultiSelect from '$components/ui/MultiSelect.svelte';
	import CountrySelect from '$components/ui/CountrySelect.svelte';
	import Pagination from '$components/ui/Pagination.svelte';
	import { geo } from '$stores/geo.svelte';
	import { talentSearchV2Api, type TalentV2, type SortByV2, type LookingFor } from '$api/talent_search_v2';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import type { SkillDomain, Title } from '$lib/types';
	import { RotateCcw, Inbox, Search, SlidersHorizontal, Flame, Trophy, Award } from '@lucide/svelte';

	let talents = $state<TalentV2[]>([]);
	let total = $state(0);
	let loading = $state(false);
	let page = $state(1);
	const perPage = 20;

	// 13 filtres
	let q = $state('');
	let skillDomain = $state<SkillDomain | ''>('');
	let title = $state<Title | ''>('');
	// Le CountrySelect renvoie l'ISO3 ; l'API talent search attend l'ISO2, on
	// convertit au moment de la soumission via `geo.find(iso3)?.iso2`.
	let countryIso3 = $state<string | null>(null);
	let minFragments = $state<number | ''>('');
	let minStreak = $state<number | ''>('');
	let tag = $state('');
	let badge = $state('');
	let lookingFor = $state<LookingFor | ''>('');
	let availableOnly = $state(false);
	// Multi-langues : l'entreprise peut exiger que le talent maîtrise plusieurs
	// langues (FR + EN + JA par exemple). Envoyé au backend en CSV via le
	// param `language_spoken` — convention "any of" ou "all of" selon le
	// backend (v2 accepte CSV).
	let languagesSpoken = $state<string[]>([]);
	let hasProjects = $state(false);
	let minGithubRepos = $state<number | ''>('');
	let sortBy = $state<SortByV2>('fragments');

	// Sur mobile / tablet, les filtres avancés sont pliés par défaut pour ne
	// pas noyer la page. Sur desktop (lg+), ils sont toujours visibles dans
	// la sidebar de gauche.
	let advancedOpen = $state(false);

	// Liste large de langues : internationales majeures + francophonie
	// africaine + langues nationales/régionales (Bénin d'abord, puis Afrique
	// de l'Ouest, Centrale, Est, Australe, Nord). Les codes sont ISO 639-1
	// (2 lettres) quand ils existent, ISO 639-3 (3 lettres) pour les langues
	// qui n'ont pas de code 639-1 (fon, dendi, kabiye, etc.). Le backend
	// stocke le code brut — libre à lui de rapprocher les deux normes.
	const LANGUAGE_OPTIONS = [
		// ── Langues nationales du Bénin (marché prioritaire) ─────────────
		{ value: 'fon', fr: 'Fon', en: 'Fon' },
		{ value: 'yo', fr: 'Yoruba', en: 'Yoruba' },
		{ value: 'bba', fr: 'Bariba', en: 'Bariba' },
		{ value: 'dnd', fr: 'Dendi', en: 'Dendi' },
		{ value: 'ee', fr: 'Éwé', en: 'Ewe' },
		{ value: 'mfe', fr: 'Mina', en: 'Mina' },
		{ value: 'ff', fr: 'Peul (Fulfulde)', en: 'Fula (Fulfulde)' },
		{ value: 'aja', fr: 'Adja', en: 'Aja' },

		// ── Afrique de l'Ouest ───────────────────────────────────────────
		{ value: 'wo', fr: 'Wolof', en: 'Wolof' },
		{ value: 'bm', fr: 'Bambara', en: 'Bambara' },
		{ value: 'ak', fr: 'Akan / Twi', en: 'Akan / Twi' },
		{ value: 'ha', fr: 'Haoussa', en: 'Hausa' },
		{ value: 'ig', fr: 'Igbo', en: 'Igbo' },
		{ value: 'mnk', fr: 'Mandinka', en: 'Mandinka' },
		{ value: 'son', fr: 'Songhaï', en: 'Songhai' },
		{ value: 'moo', fr: 'Mooré', en: 'Mooré' },

		// ── Afrique Centrale ─────────────────────────────────────────────
		{ value: 'ln', fr: 'Lingala', en: 'Lingala' },
		{ value: 'kg', fr: 'Kikongo', en: 'Kikongo' },
		{ value: 'sg', fr: 'Sango', en: 'Sango' },

		// ── Afrique de l'Est ─────────────────────────────────────────────
		{ value: 'sw', fr: 'Swahili', en: 'Swahili' },
		{ value: 'am', fr: 'Amharique', en: 'Amharic' },
		{ value: 'so', fr: 'Somali', en: 'Somali' },
		{ value: 'rw', fr: 'Kinyarwanda', en: 'Kinyarwanda' },
		{ value: 'rn', fr: 'Kirundi', en: 'Kirundi' },
		{ value: 'lg', fr: 'Luganda', en: 'Luganda' },

		// ── Afrique Australe ─────────────────────────────────────────────
		{ value: 'af', fr: 'Afrikaans', en: 'Afrikaans' },
		{ value: 'zu', fr: 'Zoulou', en: 'Zulu' },
		{ value: 'xh', fr: 'Xhosa', en: 'Xhosa' },
		{ value: 'st', fr: 'Sesotho', en: 'Sesotho' },
		{ value: 'tn', fr: 'Setswana', en: 'Setswana' },
		{ value: 'sn', fr: 'Shona', en: 'Shona' },

		// ── Afrique du Nord & Sahel ──────────────────────────────────────
		{ value: 'ar', fr: 'Arabe', en: 'Arabic' },
		{ value: 'ber', fr: 'Berbère (Amazigh)', en: 'Berber (Amazigh)' },

		// ── Langues internationales majeures ─────────────────────────────
		{ value: 'en', fr: 'Anglais', en: 'English' },
		{ value: 'fr', fr: 'Français', en: 'French' },
		{ value: 'es', fr: 'Espagnol', en: 'Spanish' },
		{ value: 'pt', fr: 'Portugais', en: 'Portuguese' },
		{ value: 'de', fr: 'Allemand', en: 'German' },
		{ value: 'it', fr: 'Italien', en: 'Italian' },
		{ value: 'nl', fr: 'Néerlandais', en: 'Dutch' },
		{ value: 'pl', fr: 'Polonais', en: 'Polish' },
		{ value: 'uk', fr: 'Ukrainien', en: 'Ukrainian' },
		{ value: 'ru', fr: 'Russe', en: 'Russian' },
		{ value: 'ro', fr: 'Roumain', en: 'Romanian' },
		{ value: 'el', fr: 'Grec', en: 'Greek' },
		{ value: 'sv', fr: 'Suédois', en: 'Swedish' },
		{ value: 'no', fr: 'Norvégien', en: 'Norwegian' },
		{ value: 'da', fr: 'Danois', en: 'Danish' },
		{ value: 'fi', fr: 'Finnois', en: 'Finnish' },
		{ value: 'he', fr: 'Hébreu', en: 'Hebrew' },
		{ value: 'tr', fr: 'Turc', en: 'Turkish' },
		{ value: 'fa', fr: 'Persan (Farsi)', en: 'Persian (Farsi)' },

		// ── Asie ─────────────────────────────────────────────────────────
		{ value: 'zh', fr: 'Chinois (Mandarin)', en: 'Chinese (Mandarin)' },
		{ value: 'ja', fr: 'Japonais', en: 'Japanese' },
		{ value: 'ko', fr: 'Coréen', en: 'Korean' },
		{ value: 'vi', fr: 'Vietnamien', en: 'Vietnamese' },
		{ value: 'th', fr: 'Thaï', en: 'Thai' },
		{ value: 'id', fr: 'Indonésien', en: 'Indonesian' },
		{ value: 'ms', fr: 'Malais', en: 'Malay' },
		{ value: 'hi', fr: 'Hindi', en: 'Hindi' },
		{ value: 'bn', fr: 'Bengali', en: 'Bengali' },
		{ value: 'ur', fr: 'Ourdou', en: 'Urdu' },
		{ value: 'ta', fr: 'Tamoul', en: 'Tamil' },
		{ value: 'te', fr: 'Télougou', en: 'Telugu' },
		{ value: 'mr', fr: 'Marathi', en: 'Marathi' },
		{ value: 'pa', fr: 'Pendjabi', en: 'Punjabi' }
	];

	let languageItems = $derived(
		LANGUAGE_OPTIONS.map((it) => ({
			value: it.value,
			label: i18n.locale === 'fr' ? it.fr : it.en
		}))
	);

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
			if (countryIso3) {
				const iso2 = geo.find(countryIso3)?.iso2;
				if (iso2) params.country_iso2 = iso2;
			}
			if (typeof minFragments === 'number' && minFragments > 0) params.min_fragments = minFragments;
			if (typeof minStreak === 'number' && minStreak > 0) params.min_streak = minStreak;
			if (tag.trim()) params.tag = tag.trim();
			if (badge.trim()) params.badge = badge.trim();
			if (lookingFor) params.looking_for = lookingFor;
			if (availableOnly) params.available_only = true;
			if (languagesSpoken.length > 0) {
				params.language_spoken = languagesSpoken.join(',');
			}
			if (hasProjects) params.has_projects = true;
			if (typeof minGithubRepos === 'number' && minGithubRepos > 0) params.min_github_repos = minGithubRepos;

			const res = await talentSearchV2Api.search(params);
			talents = res.data;
			total = (res as { pagination?: { total?: number } }).pagination?.total ?? talents.length;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : i18n.t('errors.generic'));
		} finally {
			loading = false;
		}
	}

	function submitSearch() {
		page = 1;
		void search();
	}

	function reset() {
		q = '';
		skillDomain = '';
		title = '';
		countryIso3 = null;
		minFragments = '';
		minStreak = '';
		tag = '';
		badge = '';
		lookingFor = '';
		availableOnly = false;
		languagesSpoken = [];
		hasProjects = false;
		minGithubRepos = '';
		sortBy = 'fragments';
		page = 1;
		void search();
	}

	function fmtActivity(iso: string | null): string {
		if (!iso) return '—';
		const d = new Date(iso);
		const diff = Math.floor((Date.now() - d.getTime()) / 1000);
		if (diff < 3600) return i18n.locale === 'fr' ? "à l'instant" : 'just now';
		if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
		if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit',
			month: 'short'
		}).format(d);
	}

	onMount(() => void search());

	// Compte le nombre de filtres actifs pour afficher un badge sur le bouton
	// "Filtres" mobile — feedback visuel utile quand la sidebar est pliée.
	let activeFilterCount = $derived.by(() => {
		let n = 0;
		if (skillDomain) n++;
		if (title) n++;
		if (countryIso3) n++;
		if (typeof minFragments === 'number' && minFragments > 0) n++;
		if (typeof minStreak === 'number' && minStreak > 0) n++;
		if (tag.trim()) n++;
		if (badge.trim()) n++;
		if (lookingFor) n++;
		if (availableOnly) n++;
		if (languagesSpoken.length > 0) n++;
		if (hasProjects) n++;
		if (typeof minGithubRepos === 'number' && minGithubRepos > 0) n++;
		return n;
	});
</script>

<svelte:head>
	<title>{i18n.t('enterprise.nav.talents')} — Skilluv</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<!-- Header — style dashboard : titre modeste + subtitle. -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold">{i18n.t('enterprise.nav.talents')}</h1>
		<p class="text-sm text-text-muted">
			{i18n.locale === 'fr'
				? 'Recherchez parmi les talents Skilluv — 13 filtres croisés.'
				: 'Search across Skilluv talents — 13 cross filters.'}
		</p>
	</div>

	<!-- Toolbar : barre de recherche unique + tri + toggle filtres mobile.
	     Sur mobile, la barre de recherche prend tout la ligne ; les filtres
	     avancés basculent en dessous. -->
	<form
		class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"
		onsubmit={(e) => {
			e.preventDefault();
			submitSearch();
		}}
	>
		<div class="relative flex-1">
			<Search
				size={16}
				strokeWidth={2}
				class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
			/>
			<input
				type="text"
				bind:value={q}
				placeholder={i18n.locale === 'fr'
					? 'Rechercher — pseudo, langage, techno…'
					: 'Search — username, language, tech…'}
				class="h-10 w-full rounded-xl border border-border bg-surface-elevated pl-9 pr-4 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
			/>
		</div>

		<div class="flex items-center gap-2">
			<Button variant="accent" type="submit" loading={loading}>
				{i18n.locale === 'fr' ? 'Rechercher' : 'Search'}
			</Button>
			<button
				type="button"
				onclick={() => (advancedOpen = !advancedOpen)}
				class="relative flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 text-sm font-medium text-text-muted transition-colors hover:border-primary/40 hover:text-text-primary lg:hidden"
			>
				<SlidersHorizontal size={16} strokeWidth={2} />
				{i18n.locale === 'fr' ? 'Filtres' : 'Filters'}
				{#if activeFilterCount > 0}
					<span
						class="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-fg"
					>
						{activeFilterCount}
					</span>
				{/if}
			</button>
		</div>
	</form>

	<div class="grid gap-6 lg:grid-cols-[240px_1fr]">
		<!-- ═══════════ Sidebar filtres avancés ═══════════ -->
		<aside class="{advancedOpen ? 'block' : 'hidden'} lg:block">
			<div class="rounded-xl border border-border bg-surface-elevated">
				<!-- Header sidebar : compteur + reset -->
				<div class="flex items-center justify-between border-b border-border px-4 py-3">
					<div class="flex items-center gap-2">
						<SlidersHorizontal size={14} strokeWidth={2} class="text-text-muted" />
						<p class="text-xs font-semibold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Filtres' : 'Filters'}
						</p>
						{#if activeFilterCount > 0}
							<span
								class="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent"
							>
								{activeFilterCount}
							</span>
						{/if}
					</div>
					{#if activeFilterCount > 0}
						<button
							type="button"
							onclick={reset}
							class="text-xs text-text-muted hover:text-text-primary"
						>
							{i18n.locale === 'fr' ? 'Effacer' : 'Clear'}
						</button>
					{/if}
				</div>

				<!-- Contenu — un seul bloc, groupés par thème. -->
				<div class="flex flex-col gap-4 p-4">
					<!-- Groupe : Persona -->
					<div class="flex flex-col gap-3">
						<div>
							<label for="sd" class="mb-1 block text-[11px] font-semibold text-text-muted">
								{i18n.locale === 'fr' ? 'Domaine' : 'Domain'}
							</label>
							<Select
								size="md"
								shape="rounded"
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
							<label for="tt" class="mb-1 block text-[11px] font-semibold text-text-muted">
								{i18n.locale === 'fr' ? 'Niveau min.' : 'Min level'}
							</label>
							<Select
								size="md"
								shape="rounded"
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
							<label for="lf" class="mb-1 block text-[11px] font-semibold text-text-muted">
								{i18n.locale === 'fr' ? 'Recherche' : 'Looking for'}
							</label>
							<Select
								size="md"
								shape="rounded"
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
					</div>

					<!-- Séparateur -->
					<div class="h-px bg-border"></div>

					<!-- Groupe : Localisation & langue -->
					<div class="flex flex-col gap-3">
						<div>
							<label class="mb-1 block text-[11px] font-semibold text-text-muted">
								{i18n.locale === 'fr' ? 'Pays' : 'Country'}
							</label>
							<CountrySelect
								bind:value={countryIso3}
								placeholder={i18n.locale === 'fr' ? 'Tous les pays' : 'All countries'}
								clearable
							/>
						</div>
						<div>
							<label class="mb-1 block text-[11px] font-semibold text-text-muted">
								{i18n.locale === 'fr' ? 'Langues (min B2)' : 'Languages (min B2)'}
							</label>
							<MultiSelect
								size="md"
								shape="rounded"
								searchable
								searchPlaceholder={i18n.locale === 'fr' ? 'Rechercher…' : 'Search…'}
								placeholder={i18n.locale === 'fr' ? 'Toutes' : 'Any'}
								items={languageItems}
								bind:value={languagesSpoken}
								maxChips={2}
								class="w-full"
							/>
						</div>
					</div>

					<div class="h-px bg-border"></div>

					<!-- Groupe : Métriques minimales -->
					<div class="flex flex-col gap-3">
						<div class="grid grid-cols-2 gap-2">
							<div>
								<label for="mf" class="mb-1 block text-[11px] font-semibold text-text-muted">
									{i18n.locale === 'fr' ? 'Min frag.' : 'Min frag.'}
								</label>
								<input
									id="mf"
									type="number"
									bind:value={minFragments}
									min="0"
									placeholder="0"
									class="no-spinner h-10 w-full rounded-xl border border-border bg-surface-elevated px-3 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
								/>
							</div>
							<div>
								<label for="ms" class="mb-1 block text-[11px] font-semibold text-text-muted">
									{i18n.locale === 'fr' ? 'Min streak' : 'Min streak'}
								</label>
								<input
									id="ms"
									type="number"
									bind:value={minStreak}
									min="0"
									placeholder="0"
									class="no-spinner h-10 w-full rounded-xl border border-border bg-surface-elevated px-3 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
								/>
							</div>
						</div>
						<div>
							<label for="mgr" class="mb-1 block text-[11px] font-semibold text-text-muted">
								{i18n.locale === 'fr' ? 'GitHub repos min.' : 'Min GitHub repos'}
							</label>
							<input
								id="mgr"
								type="number"
								bind:value={minGithubRepos}
								min="0"
								placeholder="0"
								class="no-spinner h-10 w-full rounded-xl border border-border bg-surface-elevated px-3 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
							/>
						</div>
					</div>

					<div class="h-px bg-border"></div>

					<!-- Groupe : Tag + badge -->
					<div class="flex flex-col gap-3">
						<div class="grid grid-cols-2 gap-2">
							<div>
								<label for="tag" class="mb-1 block text-[11px] font-semibold text-text-muted">
									Tag
								</label>
								<input
									id="tag"
									bind:value={tag}
									placeholder="rust"
									class="h-10 w-full rounded-xl border border-border bg-surface-elevated px-3 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
								/>
							</div>
							<div>
								<label for="bd" class="mb-1 block text-[11px] font-semibold text-text-muted">
									Badge
								</label>
								<input
									id="bd"
									bind:value={badge}
									placeholder="early"
									class="h-10 w-full rounded-xl border border-border bg-surface-elevated px-3 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
								/>
							</div>
						</div>
					</div>

					<div class="h-px bg-border"></div>

					<!-- Groupe : Toggles -->
					<div class="flex flex-col gap-2">
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="checkbox"
								bind:checked={availableOnly}
								class="h-4 w-4 rounded accent-primary"
							/>
							<span>{i18n.locale === 'fr' ? 'Disponibles uniquement' : 'Available only'}</span>
						</label>
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<input
								type="checkbox"
								bind:checked={hasProjects}
								class="h-4 w-4 rounded accent-primary"
							/>
							<span>{i18n.locale === 'fr' ? 'Avec projets' : 'With projects'}</span>
						</label>
					</div>
				</div>

				<!-- Footer sidebar : Reset + apply mobile-only -->
				<div class="flex gap-2 border-t border-border p-3 lg:hidden">
					<Button variant="ghost" onclick={reset} class="flex-1">
						<RotateCcw size={14} strokeWidth={2} />
						{i18n.locale === 'fr' ? 'Réinitialiser' : 'Reset'}
					</Button>
					<Button
						variant="accent"
						onclick={() => {
							advancedOpen = false;
							submitSearch();
						}}
						class="flex-1"
					>
						{i18n.locale === 'fr' ? 'Appliquer' : 'Apply'}
					</Button>
				</div>
			</div>
		</aside>

		<!-- ═══════════ Résultats ═══════════ -->
		<div>
			<!-- Résumé + tri -->
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
				<p class="text-sm text-text-muted">
					<span class="font-bold text-text-primary tabular-nums">{total.toLocaleString()}</span>
					{i18n.locale === 'fr' ? (total === 1 ? 'talent' : 'talents') : total === 1 ? 'talent' : 'talents'}
				</p>
				<Select
					size="sm"
					shape="rounded"
					items={[
						{ value: 'fragments', label: i18n.locale === 'fr' ? 'Tri : Fragments' : 'Sort: Fragments' },
						{ value: 'recent', label: i18n.locale === 'fr' ? 'Tri : Récent' : 'Sort: Recent' },
						{ value: 'most_active_recently', label: i18n.locale === 'fr' ? 'Tri : Plus actifs' : 'Sort: Most active' },
						{ value: 'top_in_domain', label: i18n.locale === 'fr' ? 'Tri : Top domaine' : 'Sort: Top in domain' }
					]}
					bind:value={sortBy}
					onchange={() => void search()}
				/>
			</div>

			<!-- Grille de résultats -->
			{#if loading}
				<div class="grid gap-3 xl:grid-cols-2">
					{#each Array(6) as _}
						<div class="h-36 animate-pulse rounded-xl border border-border bg-surface-elevated"></div>
					{/each}
				</div>
			{:else if talents.length === 0}
				<div class="rounded-xl border border-border bg-surface-elevated p-10 text-center">
					<div class="mb-3 inline-flex justify-center text-text-muted">
						<Inbox size={40} strokeWidth={1.5} />
					</div>
					<p class="mb-1 text-sm font-medium">
						{i18n.locale === 'fr' ? 'Aucun talent ne correspond' : 'No talent matches'}
					</p>
					<p class="text-xs text-text-muted">
						{i18n.locale === 'fr' ? 'Essayez d\'assouplir vos filtres.' : 'Try loosening your filters.'}
					</p>
					{#if activeFilterCount > 0}
						<div class="mt-4">
							<Button variant="ghost" onclick={reset}>
								<RotateCcw size={14} strokeWidth={2} />
								{i18n.locale === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
							</Button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="grid gap-3 xl:grid-cols-2">
					{#each talents as t (t.username)}
						<a
							href={`/profile/${t.username}`}
							class="group flex flex-col gap-3 rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-primary/40"
						>
							<!-- Header — avatar + name + status -->
							<div class="flex items-start gap-3">
								<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
									{t.display_name.charAt(0).toUpperCase()}
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<h3 class="truncate text-sm font-semibold group-hover:text-primary">
											{t.display_name}
										</h3>
										{#if t.available_for_hire}
											<Badge variant="success" size="sm">
												<span class="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-success"></span>
												{i18n.locale === 'fr' ? 'Dispo' : 'Available'}
											</Badge>
										{/if}
									</div>
									<p class="truncate font-mono text-xs text-text-muted">@{t.username}</p>
								</div>
								<div class="shrink-0 text-right text-[10px] text-text-muted">
									{i18n.locale === 'fr' ? 'Actif' : 'Active'}
									<div class="font-mono tabular-nums text-text-primary">{fmtActivity(t.last_activity_at)}</div>
								</div>
							</div>

							<!-- Meta : domain + title + country -->
							<div class="flex flex-wrap items-center gap-1.5">
								<Badge variant="primary" size="sm">{t.skill_domain}</Badge>
								<Badge variant="default" size="sm">{t.title}</Badge>
								{#if t.country_iso2}
									<Badge variant="default" size="sm">{t.country_iso2}</Badge>
								{/if}
								{#if t.top_skills.length}
									{#each t.top_skills.slice(0, 3) as s}
										<Badge variant="default" size="sm">{s.sub_skill}</Badge>
									{/each}
								{/if}
							</div>

							<!-- Stats row — dense, dashboard-style. -->
							<div class="flex items-center gap-4 border-t border-border pt-3 text-xs">
								<div class="flex items-center gap-1.5">
									<Trophy size={12} strokeWidth={2} class="text-primary" />
									<span class="font-bold tabular-nums">{t.total_fragments.toLocaleString()}</span>
									<span class="text-text-muted">frag</span>
								</div>
								<div class="flex items-center gap-1.5">
									<Flame size={12} strokeWidth={2} class="text-accent" />
									<span class="font-bold tabular-nums">{t.streak_current}</span>
									<span class="text-text-muted">streak</span>
								</div>
								<div class="flex items-center gap-1.5">
									<Award size={12} strokeWidth={2} class="text-warning" />
									<span class="font-bold tabular-nums">{t.badge_count}</span>
									<span class="text-text-muted">badges</span>
								</div>
								<span class="ml-auto text-text-muted">
									{t.project_count} {i18n.locale === 'fr' ? 'projets' : 'projects'}
								</span>
							</div>
						</a>
					{/each}
				</div>

				{#if Math.ceil(total / perPage) > 1}
					<Pagination
						current={page}
						total={Math.ceil(total / perPage)}
						onchange={(p) => {
							page = p;
							void search();
						}}
					/>
				{/if}
			{/if}
		</div>
	</div>
</div>
