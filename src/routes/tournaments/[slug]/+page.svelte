<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { tournamentApi, type Tournament, type TournamentEntry } from '$api/tournament';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';

	let slug = $derived(page.params.slug ?? '');
	let tournament = $state<Tournament | null>(null);
	let leaderboard = $state<TournamentEntry[]>([]);
	let loading = $state(true);
	let registering = $state(false);

	async function load() {
		loading = true;
		try {
			const [tRes, lRes] = await Promise.all([
				tournamentApi.get(slug),
				tournamentApi.leaderboard(slug).catch(() => null)
			]);
			tournament = tRes.data;
			if (lRes) leaderboard = lRes.data.entries;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	async function register() {
		if (!auth.isAuthenticated) {
			window.location.href = `/auth/login?redirect=/tournaments/${slug}`;
			return;
		}
		registering = true;
		try {
			await tournamentApi.register(slug);
			toast.success(i18n.locale === 'fr' ? 'Inscrit·e au tournoi !' : 'Registered for the tournament!');
			await load();
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			registering = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', {
			day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
		}).format(new Date(iso));
	}

	function rankColor(rank: number): string {
		return rank === 1 ? 'text-warning'
			: rank === 2 ? 'text-text-muted'
			: rank === 3 ? 'text-accent'
			: 'text-text-muted';
	}

	let isActive = $derived.by(() => {
		if (!tournament) return false;
		const now = new Date();
		return new Date(tournament.starts_at) <= now && new Date(tournament.ends_at) > now;
	});

	let isUpcoming = $derived.by(() => {
		if (!tournament) return false;
		return new Date(tournament.starts_at) > new Date();
	});

	onMount(() => void load());
</script>

<svelte:head>
	<title>{tournament?.name ?? 'Tournament'} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
	<nav class="mb-6 flex items-center gap-2 text-sm text-text-muted">
		<a href="/tournaments" class="hover:text-text-primary">Tournaments</a>
		<span>›</span>
		<span class="text-text-primary truncate">{tournament?.name ?? '...'}</span>
	</nav>

	{#if loading}
		<div class="animate-pulse space-y-4">
			<div class="h-32 rounded bg-surface-elevated"></div>
			<div class="h-64 rounded bg-surface-elevated"></div>
		</div>
	{:else if tournament}
		<!-- Header -->
		<header class="mb-8">
			<div class="mb-3 flex items-center gap-2 flex-wrap">
				{#if isActive}
					<Badge variant="accent" size="sm">● {i18n.locale === 'fr' ? 'En cours' : 'Live'}</Badge>
				{:else if isUpcoming}
					<Badge variant="primary" size="sm">{i18n.locale === 'fr' ? 'Bientôt' : 'Upcoming'}</Badge>
				{:else}
					<Badge variant="default" size="sm">{i18n.locale === 'fr' ? 'Terminé' : 'Ended'}</Badge>
				{/if}
				{#if tournament.skill_domain}
					<Badge variant="primary" size="sm">{tournament.skill_domain}</Badge>
				{/if}
			</div>
			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">{tournament.name}</h1>
			{#if tournament.description}
				<p class="mt-4 text-lg text-text-muted">{tournament.description}</p>
			{/if}
		</header>

		<!-- Timing + register -->
		<div class="mb-10 rounded-2xl border border-border bg-surface-elevated p-6">
			<div class="grid gap-4 sm:grid-cols-2 items-end">
				<div>
					<div class="mb-3">
						<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Début' : 'Starts'}
						</p>
						<p class="font-mono text-sm">{fmtDate(tournament.starts_at)}</p>
					</div>
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-text-muted">
							{i18n.locale === 'fr' ? 'Fin' : 'Ends'}
						</p>
						<p class="font-mono text-sm">{fmtDate(tournament.ends_at)}</p>
					</div>
				</div>
				<div class="text-right">
					<p class="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.locale === 'fr' ? 'Participants' : 'Participants'}
					</p>
					<p class="text-4xl font-black text-primary">
						{tournament.participants_count}{#if tournament.max_participants}<span class="text-lg text-text-muted"> / {tournament.max_participants}</span>{/if}
					</p>
					{#if !tournament.registered && (isActive || isUpcoming)}
						<div class="mt-3">
							<Button variant="accent" loading={registering} onclick={register}>
								{i18n.locale === 'fr' ? 'S\'inscrire' : 'Register'}
							</Button>
						</div>
					{:else if tournament.registered}
						<Badge variant="success" size="sm">✓ {i18n.locale === 'fr' ? 'Inscrit·e' : 'Registered'}</Badge>
					{/if}
				</div>
			</div>
		</div>

		<!-- Leaderboard -->
		{#if leaderboard.length}
			<section>
				<h2 class="mb-4 text-xs font-bold uppercase tracking-wider text-accent">
					{i18n.locale === 'fr' ? 'Classement' : 'Leaderboard'}
				</h2>
				<div class="divide-y divide-border rounded-2xl border border-border bg-surface-elevated overflow-hidden">
					{#each leaderboard as e}
						<a
							href={`/profile/${e.username}`}
							class="flex items-center gap-4 p-4 hover:bg-surface-overlay transition-colors"
						>
							<div class="w-12 text-center shrink-0">
								<div class="text-2xl font-black {rankColor(e.rank)}">
									#{e.rank}
								</div>
							</div>
							<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg font-black text-primary shrink-0">
								{e.display_name.charAt(0)}
							</div>
							<div class="min-w-0 flex-1">
								<div class="font-semibold truncate">{e.display_name}</div>
								<div class="font-mono text-xs text-text-muted">@{e.username}</div>
							</div>
							<div class="text-right shrink-0">
								<div class="text-lg font-black text-primary">{e.score.toLocaleString()}</div>
								<div class="text-xs text-text-muted">
									{i18n.locale === 'fr' ? 'score' : 'score'}
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>
