<script lang="ts">
	/**
	 * B-05 — the defensive labs.
	 *
	 * Listable at last: `security_kind` is serialised on a challenge and
	 * `GET /challenges` takes `?security_kind=defensive_lab`, so this page asks
	 * for labs rather than for every security challenge and hoping. Before that
	 * field existed a client could not tell a lab from a CTF target, which is
	 * why this page did not.
	 *
	 * The field is read optionally throughout, so against a deployment that
	 * predates it the list comes back empty and the page says so — rather than
	 * throwing, or worse, listing CTF targets as labs and sending somebody to
	 * answer questions that do not exist.
	 *
	 * The editorial line of a blue lab is that the analysis happens on the
	 * reader's own machine: the artefact is downloaded, opened in their own
	 * tools, and only the answers come back. The page says that where somebody
	 * is deciding whether to start.
	 */
	import { onMount } from 'svelte';
	import { ShieldCheck } from '@lucide/svelte';
	import { challengesApi, type ChallengeListItem } from '$api/challenges';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { DIFFICULTY_TIERS } from '$types';

	/** The `security_kind` this page is. */
	const KIND = 'defensive_lab';

	let rows = $state<ChallengeListItem[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let tier = $state('');

	let tierItems = $derived([
		{ value: '', label: i18n.t('blueLab.filterAll') },
		...DIFFICULTY_TIERS.map((d) => ({ value: d as string, label: i18n.t(`blueLab.tiers.${d}`) }))
	]);

	/**
	 * Narrowed here rather than server-side: the listing filters on
	 * `security_kind`, not on the cyber difficulty tier, and asking for a
	 * parameter the endpoint does not take would be refused.
	 */
	let visible = $derived(
		tier === '' ? rows : rows.filter((r) => r.challenge.security_difficulty_tier === tier)
	);

	function tierLabel(value: string | null | undefined): string {
		if (!value) return '';
		const key = `blueLab.tiers.${value}`;
		const translated = i18n.t(key);
		return translated === key ? value : translated;
	}

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await challengesApi.list({ security_kind: KIND, per_page: 50 });
			rows = res.data ?? [];
		} catch (err) {
			rows = [];
			// A deployment without the filter refuses the parameter rather than
			// ignoring it, which is the right call server-side and means an
			// empty page here rather than a wrong one.
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('blueLab.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('blueLab.subtitle')} />
	<meta property="og:title" content={i18n.t('blueLab.title')} />
	<meta property="og:description" content={i18n.t('blueLab.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 px-4 py-8" data-testid="blue-lab-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<ShieldCheck size={22} />
			{i18n.t('blueLab.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('blueLab.subtitle')}</p>
	</header>

	<!-- Said where somebody decides whether to start: the artefact is theirs to
	     open, on their machine, with their tools. Only the answers come back. -->
	<p
		class="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-text-muted"
		data-testid="blue-lab-offline-note"
	>
		{i18n.t('blueLab.offlineNote')}
	</p>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if rows.length === 0}
		<EmptyState title={i18n.t('blueLab.empty')} body={i18n.t('blueLab.emptyHint')} size="sm" />
	{:else}
		{#if tierItems.length > 2}
			<SegmentedControl items={tierItems} value={tier} onchange={(v) => (tier = v)} />
		{/if}

		<ul class="space-y-3">
			{#each visible as row (row.challenge.id)}
				<li
					class="rounded-xl border border-border bg-surface-elevated p-4"
					data-testid="blue-lab-row"
				>
					<div class="flex flex-wrap items-start justify-between gap-2">
						<div class="min-w-0 space-y-1">
							<h2 class="truncate text-sm font-bold text-text">{row.challenge.title}</h2>
							<p class="text-sm text-text-muted">{row.challenge.description}</p>
						</div>
						<Button href="/challenges/{row.challenge.id}" size="sm" variant="ghost">
							{row.locked ? i18n.t('blueLab.lockedCta') : i18n.t('blueLab.openCta')}
						</Button>
					</div>

					<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
						{#if row.challenge.security_difficulty_tier}
							<Badge size="sm">{tierLabel(row.challenge.security_difficulty_tier)}</Badge>
						{/if}
						{#if row.challenge.duration_minutes}
							<span>{i18n.t('blueLab.minutes', { n: row.challenge.duration_minutes })}</span>
						{/if}
						{#if row.challenge.reward_fragments > 0}
							<span>
								{i18n.t('securityPractice.fragmentsAwarded', {
									n: row.challenge.reward_fragments
								})}
							</span>
						{/if}
						{#if row.locked}
							<Badge variant="warning" size="sm">{i18n.t('blueLab.locked')}</Badge>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="flex flex-wrap gap-2">
		<Button href="/ctf" size="sm" variant="ghost">{i18n.t('securityPractice.ctfTitle')}</Button>
		<Button href="/security" size="sm" variant="ghost">{i18n.t('securityScope.title')}</Button>
		<Button href="/security/competitions" size="sm" variant="ghost">
			{i18n.t('securityCompetitions.title')}
		</Button>
	</div>
</div>
