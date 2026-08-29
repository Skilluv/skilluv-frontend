<script lang="ts">
	/**
	 * SKI-149 [P-02] — the cyber competitions board.
	 *
	 * The last surface in this domain with a backend and no page. Migration
	 * 0554 did not create a competitions table: it seeded five rows into
	 * `tournament_kinds`, so a cyber competition *is* a tournament and already
	 * has registration, scoring, prizes, a leaderboard and — since SKI-141 — a
	 * room publishing `tournament.leaderboard_changed` and `.concluded`.
	 *
	 * So this page lists and routes; it does not reimplement any of that.
	 * `/tournaments/[slug]` is the detail, the registration and the live
	 * standing, and it names its entrants now (SKI-302). A second detail page
	 * here would be a second definition of what a competition is.
	 *
	 * ## Three shelves, not a filter
	 *
	 * Live, upcoming, past — because those are three different questions. "Can
	 * I still join?" is not "what is happening right now", and a status
	 * dropdown makes the reader do the sorting the page should have done.
	 *
	 * Read from the dates rather than from `status` alone: a window is the only
	 * thing that says a competition is running, and the status vocabulary grows
	 * server-side.
	 *
	 * ## Why it asks for a domain and not a kind
	 *
	 * `GET /tournaments` takes one `kind` and there are five. A `skill_domain`
	 * filter also returns the contests open to every domain, which a bug bash
	 * or a purple exercise often is — narrowing on kind would have dropped
	 * exactly the ones that most want a wide field. Grouping by kind afterwards
	 * is presentation; nothing falls out of the list on the way, and a kind
	 * this build has not heard of still renders under its own slug.
	 */
	import { onMount } from 'svelte';
	import { Swords } from '@lucide/svelte';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import type { Tournament } from '$types';

	let rows = $state<Tournament[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	/** Now, read once per load rather than per row. */
	let now = $state(Date.now());

	function started(t: Tournament): boolean {
		return new Date(t.starts_at).getTime() <= now;
	}
	function ended(t: Tournament): boolean {
		return new Date(t.ends_at).getTime() <= now;
	}

	let live = $derived(rows.filter((t) => started(t) && !ended(t)));
	let upcoming = $derived(rows.filter((t) => !started(t)));
	let past = $derived(rows.filter((t) => ended(t)));

	function kindLabel(kind: string): string {
		const key = `securityCompetitions.kinds.${kind}`;
		const translated = i18n.t(key);
		return translated === key ? kind : translated;
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/**
	 * Whether registration is still open, when the backend said so.
	 *
	 * `registration_opens_at` null means it was never gated, which is not the
	 * same as closed — so the absence opens rather than shuts.
	 */
	function registrationOpen(t: Tournament): boolean {
		if (started(t)) return false;
		if (!t.registration_opens_at) return true;
		return new Date(t.registration_opens_at).getTime() <= now;
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await securityApi.competitions({ limit: 100 });
			rows = res.data?.tournaments ?? [];
			now = Date.now();
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
	<title>{i18n.t('securityCompetitions.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('securityCompetitions.subtitle')} />
	<meta property="og:title" content={i18n.t('securityCompetitions.title')} />
	<meta property="og:description" content={i18n.t('securityCompetitions.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="security-competitions-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Swords size={22} />
			{i18n.t('securityCompetitions.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('securityCompetitions.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if rows.length === 0}
		<EmptyState
			title={i18n.t('securityCompetitions.empty')}
			body={i18n.t('securityCompetitions.emptyHint')}
			size="sm"
		/>
	{:else}
		{#each [{ rows: live, title: i18n.t('securityCompetitions.liveTitle'), accent: true }, { rows: upcoming, title: i18n.t('securityCompetitions.upcomingTitle'), accent: false }, { rows: past, title: i18n.t('securityCompetitions.pastTitle'), accent: false }] as shelf (shelf.title)}
			{#if shelf.rows.length > 0}
				<section class="space-y-3">
					<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
						{shelf.title}
					</h2>
					<ul class="space-y-3">
						{#each shelf.rows as row (row.slug)}
							<li
								class="rounded-xl border border-border bg-surface-elevated p-4"
								data-testid="security-competition-row"
							>
								<div class="flex flex-wrap items-start justify-between gap-2">
									<div class="min-w-0 space-y-1">
										<h3 class="truncate text-sm font-bold text-text">{row.name}</h3>
										{#if row.description}
											<p class="text-sm text-text-muted">{row.description}</p>
										{/if}
									</div>
									<!-- Straight to the tournament page: it is the detail, the
									     registration and the live standing already. -->
									<Button href="/tournaments/{row.slug}" size="sm" variant="ghost">
										{registrationOpen(row)
											? i18n.t('securityCompetitions.registerCta')
											: i18n.t('securityCompetitions.openCta')}
									</Button>
								</div>

								<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
									<Badge size="sm" variant={shelf.accent ? 'accent' : 'default'}>
										{kindLabel(row.kind)}
									</Badge>
									<span>{fmtDate(row.starts_at)} → {fmtDate(row.ends_at)}</span>
									{#if row.skill_domain === null}
										<!-- Open to everybody, which is why narrowing on kind
										     would have hidden it. -->
										<span>{i18n.t('securityCompetitions.everyDomain')}</span>
									{/if}
									{#if row.prize_pool_fragments > 0}
										<span>
											{i18n.t('securityCompetitions.prizePool', {
												n: row.prize_pool_fragments
											})}
										</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		{/each}
	{/if}

	<div class="flex flex-wrap gap-2">
		<Button href="/ctf" size="sm" variant="ghost">{i18n.t('securityPractice.ctfTitle')}</Button>
		<Button href="/security" size="sm" variant="ghost">{i18n.t('securityScope.title')}</Button>
	</div>
</div>
