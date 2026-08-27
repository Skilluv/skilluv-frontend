<script lang="ts">
	/**
	 * C-05 — the CTF landing.
	 *
	 * The scoreboard half works and is the half worth having: `first_solves` is
	 * what a CTF board is actually read for, and it is the column this page
	 * leads with rather than raw solve counts.
	 *
	 * **The listing half cannot be built yet, and the page says so.** CTF
	 * challenges live on `challenge_templates` under `security_kind`, and that
	 * column is serialised on no public response — only `admin_security` selects
	 * it, and `GET /challenges` neither returns nor filters on it. So a client
	 * cannot tell a hosted range from a defensive lab from an audit exercise.
	 *
	 * The alternative was to list every security-domain challenge and call them
	 * all CTFs, which would send somebody to submit a flag on an exercise that
	 * has no flag. A stated absence beats a confident mislabel. Tracked
	 * backend-side.
	 */
	import { onMount } from 'svelte';
	import { Flag, Info } from '@lucide/svelte';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { ScoreboardRow } from '$types';

	let rows = $state<ScoreboardRow[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' });
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await securityApi.scoreboard();
			rows = res.data?.all_time ?? [];
		} catch (err) {
			rows = [];
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
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

	<!-- Said out loud rather than papered over: the platform does not yet
	     distinguish a hosted range from a defensive lab on any public
	     response, so this page cannot list them apart. -->
	<p
		class="flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted"
		data-testid="ctf-listing-unavailable"
	>
		<Info size={15} class="mt-0.5 shrink-0" />
		<span>
			{i18n.t('securityPractice.listingUnavailable')}
			<a href="/challenges?domain=security" class="ml-1 text-accent hover:underline">
				{i18n.t('common.nav.challenges')}
			</a>
		</span>
	</p>

	<section class="space-y-3" data-testid="ctf-scoreboard">
		<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
			{i18n.t('securityPractice.scoreboardTitle')}
		</h2>

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
	</div>
</div>
