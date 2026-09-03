<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { i18n } from '$lib/i18n';
	import { auth } from '$stores/auth.svelte';
	import Button from '$components/ui/Button.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { tournamentApi } from '$api/tournament';
	import type { Tournament, TournamentParticipant } from '$types';
	import { toast } from '$stores/toast.svelte';
	import { SkilluError } from '$api/client';
	import { ws, tournamentRoom } from '$stores/websocket.svelte';

	let slug = $derived(page.params.slug ?? '');
	let tournament = $state<Tournament | null>(null);
	let leaderboard = $state<TournamentParticipant[]>([]);
	let loading = $state(true);
	let registering = $state(false);

	async function load() {
		loading = true;
		try {
			const [tRes, lRes] = await Promise.all([
				tournamentApi.get(slug),
				tournamentApi.leaderboard(slug).catch(() => null)
			]);
			tournament = tRes.data.tournament;
			if (lRes) leaderboard = lRes.data.leaderboard;
		} catch (e) {
			toast.error(e instanceof SkilluError ? e.message : 'Erreur');
		} finally {
			loading = false;
		}
	}

	/** An entrant's name, or its UUID when the account is gone. */
	function entrantName(e: TournamentParticipant): string {
		return e.display_name ?? e.username ?? e.participant_id;
	}

	/**
	 * SKI-149 — the standing updates itself.
	 *
	 * Room-scoped: `tournament:{id}`, joined once the tournament is loaded,
	 * because the id is what the room is keyed on and the URL only carries the
	 * slug.
	 *
	 * The events carry no score, deliberately, and that is the right shape: a
	 * tournament has a `scoring_direction`, so whether a smaller number just
	 * took the lead is the leaderboard's business and not a client's. So this
	 * refetches rather than patching.
	 */
	let joinedRoom: string | null = null;
	let stopListening: Array<() => void> = [];

	async function refreshLeaderboard() {
		try {
			const res = await tournamentApi.leaderboard(slug);
			leaderboard = res.data.leaderboard;
		} catch {
			// Keep the standing on screen rather than blanking it.
		}
	}

	$effect(() => {
		const id = tournament?.id;
		if (!id || joinedRoom === tournamentRoom(id)) return;
		if (joinedRoom) ws.leave(joinedRoom);
		joinedRoom = tournamentRoom(id);
		ws.connect();
		ws.join(joinedRoom);
	});

	onDestroy(() => {
		if (joinedRoom) ws.leave(joinedRoom);
		for (const off of stopListening) off();
	});

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

	/** Registration is not a field on the tournament; it is a row in the standing. */
	let isRegistered = $derived(
		!!auth.user && leaderboard.some((e) => e.participant_id === auth.user?.id)
	);

	onMount(() => {
		void load();
		stopListening = [
			ws.on('tournament.leaderboard_changed', () => refreshLeaderboard()),
			// A conclusion moves the ranking and the tournament's own status,
			// so this one reloads both rather than the standing alone.
			ws.on('tournament.concluded', () => void load())
		];
	});
</script>

<svelte:head>
	<title>{tournament?.name ?? 'Tournament'} | Skilluv</title>
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
					<!-- Counted from the standing rather than read from the tournament:
					     the model carries no participant counter, and the two former
					     fields here were never served. -->
					<p class="text-4xl font-black text-primary">{leaderboard.length}</p>
					{#if isRegistered}
						<Badge variant="success" size="sm">
							{i18n.locale === 'fr' ? 'Inscrit·e' : 'Registered'}
						</Badge>
					{:else if isActive || isUpcoming}
						<div class="mt-3">
							<Button variant="accent" loading={registering} onclick={register}>
								{i18n.locale === 'fr' ? 'S\'inscrire' : 'Register'}
							</Button>
						</div>
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
					<!-- SKI-302 — the standing names its entrants: `leaderboard_of`
					     COALESCEs the user and guild joins, so one pair of fields
					     covers both. A row whose account is gone keeps its rank
					     and falls back to its id, because dropping it would move
					     everybody below it. -->
					{#each leaderboard as e (e.participant_id)}
						{@const isMe = e.participant_id === auth.user?.id}
						<div
							class="flex items-center gap-4 p-4 {isMe ? 'bg-accent/5' : ''}"
							data-testid="leaderboard-row"
						>
							<div class="w-12 text-center shrink-0">
								<div class="text-2xl font-black {rankColor(e.rank ?? 0)}">
									{e.rank ? `#${e.rank}` : '—'}
								</div>
							</div>
							<div class="min-w-0 flex-1">
								{#if e.username}
									<a
										href="/profile/{e.username}"
										class="truncate font-semibold hover:underline"
										data-testid="leaderboard-name"
									>
										{entrantName(e)}
									</a>
								{:else}
									<div class="truncate font-mono text-xs text-text-muted">
										{entrantName(e)}
									</div>
								{/if}
								<div class="text-xs text-text-muted">
									{#if isMe}
										{i18n.locale === 'fr' ? 'Toi' : 'You'}
									{:else}
										{e.participant_type === 'guild'
											? (i18n.locale === 'fr' ? 'Guilde' : 'Guild')
											: (i18n.locale === 'fr' ? 'Participant' : 'Entrant')}
									{/if}
								</div>
								{#if e.prize_fragments_awarded > 0}
									<div class="text-xs text-text-muted">
										+{e.prize_fragments_awarded} {i18n.t('common.fragments')}
									</div>
								{/if}
							</div>
							<div class="text-right shrink-0">
								<div class="text-lg font-black text-primary">{e.score.toLocaleString()}</div>
								<div class="text-xs text-text-muted">
									{i18n.locale === 'fr' ? 'score' : 'score'}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>
