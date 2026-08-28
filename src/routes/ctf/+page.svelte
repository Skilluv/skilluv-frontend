<script lang="ts">
	/**
	 * C-05 — the CTF landing.
	 *
	 * The scoreboard half works and is the half worth having: `first_solves` is
	 * what a CTF board is actually read for, and it is the column this page
	 * leads with rather than raw solve counts.
	 *
	 * The listing half works now too. `security_kind` is serialised on a
	 * challenge and `GET /challenges` takes `?security_kind=ctf_flag`, so this
	 * page asks for ranges rather than for every security challenge and hoping
	 * — which would have sent somebody to submit a flag on an exercise that has
	 * none. The field is read optionally, so a deployment that predates it
	 * yields an empty list rather than a wrong one.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { Flag } from '@lucide/svelte';
	import { challengesApi, type ChallengeListItem } from '$api/challenges';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { ws } from '$stores/websocket.svelte';
	import type { ScoreboardRow } from '$types';

	let rows = $state<ScoreboardRow[]>([]);
	let ranges = $state<ChallengeListItem[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' });
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			// Settled: a board with no solves and a catalogue with no range are
			// both normal, and a failure on one must not blank the other.
			const [board, list] = await Promise.allSettled([
				securityApi.scoreboard(),
				challengesApi.list({ security_kind: 'ctf_flag', per_page: 50 })
			]);
			rows = board.status === 'fulfilled' ? (board.value.data?.all_time ?? []) : [];
			ranges = list.status === 'fulfilled' ? (list.value.data ?? []) : [];
			if (board.status === 'rejected') {
				loadError =
					board.reason instanceof SkilluError ? board.reason.message : i18n.t('errors.generic');
			}
		} finally {
			loading = false;
		}
	}

	/**
	 * SKI-138 — the board updates itself.
	 *
	 * `security.first_solve` is the one event in this domain broadcast globally
	 * rather than kept between a reporter and a reviewer, which is exactly what
	 * a cross-challenge board needs: no room to join, and a first blood on any
	 * range is news here.
	 *
	 * It refetches rather than patching the row in place. The board is ranked
	 * server-side on solves and first-solves together, and a client that
	 * incremented a counter locally would render an order the server does not
	 * agree with — briefly right, then wrong, with nothing to say which.
	 *
	 * A dropped socket costs live updates and nothing else: the page already
	 * loaded once, and the store reconnects on its own.
	 */
	let stopListening: (() => void) | null = null;

	onMount(() => {
		load();
		ws.connect();
		stopListening = ws.on('security.first_solve', () => {
			refreshBoard();
		});
	});

	onDestroy(() => stopListening?.());

	/** The board alone — the range catalogue has not moved. */
	async function refreshBoard() {
		try {
			const board = await securityApi.scoreboard();
			rows = board.data?.all_time ?? [];
		} catch {
			// Keep what is on screen. A stale board beats an empty one, and the
			// next event or reload will correct it.
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('securityPractice.ctfTitle')} · Skilluv</title>
	<meta name="description" content={i18n.t('securityPractice.ctfSubtitle')} />
	<meta property="og:title" content={i18n.t('securityPractice.ctfTitle')} />
	<meta property="og:description" content={i18n.t('securityPractice.ctfSubtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="ctf-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Flag size={22} />
			{i18n.t('securityPractice.ctfTitle')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('securityPractice.ctfSubtitle')}</p>
	</header>

	<section class="space-y-3" data-testid="ctf-ranges">
		<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
			{i18n.t('securityPractice.listTitle')}
		</h2>

		{#if loading}
			<Skeleton class="h-40 w-full" rounded="xl" />
		{:else if ranges.length === 0}
			<EmptyState
				title={i18n.t('securityPractice.listEmpty')}
				body={i18n.t('securityPractice.listEmptyHint')}
				size="sm"
			/>
		{:else}
			<ul class="space-y-3">
				{#each ranges as row (row.challenge.id)}
					<li class="rounded-xl border border-border bg-surface-elevated p-4" data-testid="ctf-range">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div class="min-w-0 space-y-1">
								<h3 class="truncate text-sm font-bold text-text">{row.challenge.title}</h3>
								<p class="text-sm text-text-muted">{row.challenge.description}</p>
							</div>
							<Button href="/challenges/{row.challenge.id}" size="sm" variant="ghost">
								{row.locked
									? i18n.t('securityPractice.lockedChallenge')
									: i18n.t('securityPractice.openChallenge')}
							</Button>
						</div>
						<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
							{#if row.challenge.security_difficulty_tier}
								<Badge size="sm">{row.challenge.security_difficulty_tier}</Badge>
							{/if}
							{#if row.challenge.reward_fragments > 0}
								<span>
									{i18n.t('securityPractice.fragmentsAwarded', {
										n: row.challenge.reward_fragments
									})}
								</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="space-y-3" data-testid="ctf-scoreboard">
		<div class="flex flex-wrap items-center gap-2">
			<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('securityPractice.scoreboardTitle')}
			</h2>
			{#if ws.connected}
				<!-- Said only while it is true. A board that claims to be live
				     when the socket is down is worse than one that never
				     claimed it. -->
				<span class="text-xs text-success" data-testid="ctf-live">
					{i18n.t('securityPractice.liveNote')}
				</span>
			{/if}
		</div>

		{#if loading}
			<Skeleton class="h-64 w-full" rounded="xl" />
		{:else if loadError}
			<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
				{loadError}
			</p>
		{:else if rows.length === 0}
			<EmptyState title={i18n.t('securityPractice.scoreboardEmpty')} size="sm" />
		{:else}
			<ol class="space-y-2">
				{#each rows as row, index (row.username)}
					<li
						class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-4"
						data-testid="ctf-scoreboard-row"
					>
						<div class="flex min-w-0 items-center gap-3">
							<span class="w-6 shrink-0 text-center text-sm font-black text-text-muted">
								{index + 1}
							</span>
							{#if row.avatar_url}
								<img
									src={row.avatar_url}
									alt=""
									loading="lazy"
									class="h-9 w-9 rounded-full object-cover"
								/>
							{/if}
							<a href="/profile/{row.username}" class="truncate text-sm font-bold text-text hover:underline">
								{row.display_name ?? row.username}
							</a>
						</div>

						<div class="flex flex-wrap items-center gap-2 text-xs text-text-muted">
							<!-- First solves lead: it is what a board is read for. -->
							{#if row.first_solves > 0}
								<Badge variant="accent" size="sm">
									{i18n.t('securityPractice.firstSolves', { n: row.first_solves })}
								</Badge>
							{/if}
							<span>{i18n.t('securityPractice.solves', { n: row.solves })}</span>
							<span>{i18n.t('securityPractice.lastSolve', { date: fmtDate(row.last_solve_at) })}</span>
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	</section>

	<div class="flex flex-wrap gap-2">
		<Button href="/security" size="sm" variant="ghost">{i18n.t('securityScope.title')}</Button>
		<Button href="/security/hall-of-fame" size="sm" variant="ghost">
			{i18n.t('securityHallOfFame.title')}
		</Button>
		<Button href="/blue-lab" size="sm" variant="ghost">{i18n.t('blueLab.title')}</Button>
	</div>
</div>
