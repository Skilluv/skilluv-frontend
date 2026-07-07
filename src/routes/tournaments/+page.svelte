<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import FilterBar from '$components/ui/FilterBar.svelte';
	import { tournamentApi, type Tournament, type Season } from '$api/tournament';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let tournaments = $state<Tournament[]>([]);
	let currentSeason = $state<Season | null>(null);
	let loading = $state(true);
	let domainFilter = $state<string>('all');

	async function load() {
		loading = true;
		try {
			const [seRes, tRes] = await Promise.all([
				tournamentApi.currentSeason().catch(() => null),
				tournamentApi.list()
			]);
			if (seRes) currentSeason = seRes.data;
			tournaments = tRes.data.tournaments;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit', month: 'short', year: 'numeric'
		}).format(new Date(iso));
	}

	function isActive(t: Tournament): boolean {
		const now = new Date();
		return new Date(t.starts_at) <= now && new Date(t.ends_at) > now;
	}

	let filtered = $derived.by(() => {
		if (domainFilter === 'all') return tournaments;
		return tournaments.filter((t) => t.skill_domain === domainFilter);
	});

	let domains = $derived.by(() => {
		const s = new Set<string>();
		for (const t of tournaments) if (t.skill_domain) s.add(t.skill_domain);
		return ['all', ...s];
	});

	onMount(() => void load());
</script>

<svelte:head>
	<title>{i18n.locale === 'fr' ? 'Tournois — Skilluv' : 'Tournaments — Skilluv'}</title>
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden border-b border-border">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 -top-20 h-[100vh] opacity-[0.04]"
		style="background-image: linear-gradient(var(--sk-text) 1px, transparent 1px), linear-gradient(90deg, var(--sk-text) 1px, transparent 1px); background-size: 60px 60px; mask-image: linear-gradient(to bottom, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);"
	></div>
	<div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
		<p class="mb-4 text-xs font-bold uppercase tracking-widest text-accent">Compétition</p>
		<h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
			{#if i18n.locale === 'fr'}
				Tournois<br />
				<span class="text-primary">chronométrés.</span>
			{:else}
				Timed<br />
				<span class="text-primary">tournaments.</span>
			{/if}
		</h1>
		<p class="mt-8 max-w-2xl text-lg text-text-muted">
			{i18n.locale === 'fr'
				? 'Compétitions mensuelles par domaine. Fenêtre courte, challenges dédiés, classement live. Les 3 premiers gagnent des fragments, des badges, la reconnaissance.'
				: 'Monthly competitions by domain. Short window, dedicated challenges, live ranking. Top 3 win fragments, badges, recognition.'}
		</p>
		{#if currentSeason}
			<div class="mt-8 inline-flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-5 py-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-lg text-accent">◈</div>
				<div>
					<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Saison en cours' : 'Current season'}
					</p>
					<p class="font-semibold">{currentSeason.name}</p>
				</div>
			</div>
		{/if}
	</div>
</section>

<!-- Filters -->
{#if domains.length > 2}
	<section class="border-b border-border bg-surface-elevated/40">
		<div class="mx-auto max-w-6xl px-4 py-6">
			<FilterBar label={i18n.locale === 'fr' ? 'Domaine :' : 'Domain:'}>
				<SegmentedControl
					size="sm"
					items={domains.map((d) => ({
						value: d,
						label: d === 'all' ? (i18n.locale === 'fr' ? 'Tous' : 'All') : d
					}))}
					bind:value={domainFilter}
				/>
			</FilterBar>
		</div>
	</section>
{/if}

<!-- Grid -->
<section class="mx-auto max-w-6xl px-4 py-14">
	{#if loading}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="animate-pulse rounded-2xl border border-border bg-surface-elevated h-64"></div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
			<div class="mb-3 text-4xl text-text-muted">★</div>
			<p class="text-text-muted">
				{i18n.locale === 'fr' ? 'Aucun tournoi ne correspond.' : 'No tournament matches.'}
			</p>
		</div>
	{:else}
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each filtered as t}
				<a
					href={`/tournaments/${t.slug}`}
					class="flex flex-col rounded-2xl border {isActive(t) ? 'border-accent bg-surface-elevated' : 'border-border bg-surface-elevated'} p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
				>
					<div class="mb-3 flex items-start justify-between gap-2">
						<div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary">★</div>
						{#if isActive(t)}
							<Badge variant="accent" size="sm">
								● {i18n.locale === 'fr' ? 'En cours' : 'Live'}
							</Badge>
						{:else if new Date(t.ends_at) < new Date()}
							<Badge variant="default" size="sm">{i18n.locale === 'fr' ? 'Terminé' : 'Ended'}</Badge>
						{:else}
							<Badge variant="primary" size="sm">{i18n.locale === 'fr' ? 'Bientôt' : 'Upcoming'}</Badge>
						{/if}
					</div>
					<h2 class="text-lg font-bold leading-snug">{t.name}</h2>
					{#if t.description}
						<p class="mt-1 line-clamp-2 text-sm text-text-muted">{t.description}</p>
					{/if}

					<div class="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-overlay p-3 text-center">
						<div>
							<div class="text-xs font-bold uppercase tracking-wider text-text-muted">Start</div>
							<div class="text-sm font-mono">{fmtDate(t.starts_at)}</div>
						</div>
						<div>
							<div class="text-xs font-bold uppercase tracking-wider text-text-muted">End</div>
							<div class="text-sm font-mono">{fmtDate(t.ends_at)}</div>
						</div>
					</div>

					<div class="mt-4 flex items-baseline justify-between border-t border-border pt-4">
						<div>
							<div class="text-2xl font-black text-primary">{t.participants_count}</div>
							<div class="text-xs text-text-muted">
								{i18n.locale === 'fr' ? 'participants' : 'participants'}
							</div>
						</div>
						{#if t.skill_domain}
							<Badge variant="accent" size="sm">{t.skill_domain}</Badge>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</section>
