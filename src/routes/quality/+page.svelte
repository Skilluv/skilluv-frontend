<script lang="ts">
	/**
	 * The quality workbench: defects you filed, defects you may judge, and the
	 * test runs behind them.
	 *
	 * Eleven endpoints were served and one was read — the profile record. So a
	 * quality practitioner could be *seen* to have done the work and had
	 * nowhere to do it.
	 *
	 * ## The review tab is not gated on a role
	 *
	 * `review-queue` answers with what this caller may judge, derived from the
	 * trade on each slice. That answer is the authority. A client deciding from
	 * "is an admin" would offer the action on trades the server refuses — and
	 * the backend is explicit that administrators come through
	 * `quality_reviewer:all` like anybody else, so the record says which trade
	 * decided rather than "an admin decided".
	 *
	 * So the tab appears when the queue is non-empty and not before.
	 *
	 * ## Two severities, both kept
	 *
	 * A reviewer may accept a report and still disagree about how bad it is.
	 * The row keeps `severity` and `severity_adjusted_to`, and this page shows
	 * the adjustment *next to* the original rather than replacing it. Showing
	 * only the final number would hide that somebody disagreed, which is the
	 * whole reason both are stored.
	 *
	 * ## An unverified run is a claim
	 *
	 * `verified_at` null means nobody checked. Anybody can point at a green
	 * badge on a repository they control, so a run is labelled until it is
	 * verified rather than after.
	 */
	import { onMount } from 'svelte';
	import { Bug } from '@lucide/svelte';
	import { qualityApi, effectiveSeverity, type BugReport } from '$api/quality';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	let mine = $state<BugReport[]>([]);
	let queue = $state<BugReport[]>([]);
	let published = $state<BugReport[]>([]);
	let severities = $state<string[]>([]);
	let loading = $state(true);
	let tab = $state<'mine' | 'queue' | 'published'>('mine');
	let busy = $state<Record<string, boolean>>({});

	/** The reviewer tab exists only if the server says this caller may judge. */
	let canReview = $derived(queue.length > 0);

	let tabs = $derived([
		{ value: 'mine', label: i18n.t('quality.tabMine') },
		...(canReview ? [{ value: 'queue', label: i18n.t('quality.tabQueue') }] : []),
		{ value: 'published', label: i18n.t('quality.tabPublished') }
	]);

	let rows = $derived(tab === 'mine' ? mine : tab === 'queue' ? queue : published);

	const severityVariant: Record<string, 'error' | 'warning' | 'default'> = {
		critical: 'error',
		high: 'error',
		medium: 'warning',
		low: 'default',
		trivial: 'default'
	};

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function load() {
		loading = true;
		// Four independent reads. A caller who may not review gets a 403 on the
		// queue, and that must not blank the reports they filed themselves.
		const [m, q, p, r] = await Promise.allSettled([
			qualityApi.myBugs(),
			qualityApi.reviewQueue(),
			qualityApi.reports({ limit: 50 }),
			qualityApi.reference()
		]);
		if (m.status === 'fulfilled') mine = m.value.data?.reports ?? [];
		if (q.status === 'fulfilled') queue = q.value.data?.reports ?? [];
		if (p.status === 'fulfilled') published = p.value.data?.reports ?? [];
		if (r.status === 'fulfilled') severities = r.value.data?.severities ?? [];
		loading = false;
	}

	async function act(key: string, run: () => Promise<unknown>, done: string) {
		if (busy[key]) return;
		busy = { ...busy, [key]: true };
		try {
			await run();
			toast.success(done);
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = { ...busy, [key]: false };
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('quality.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('quality.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8" data-testid="quality-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Bug size={22} />
			{i18n.t('quality.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('quality.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else}
		<SegmentedControl
			items={tabs}
			value={tab}
			onchange={(v) => (tab = v as 'mine' | 'queue' | 'published')}
		/>

		{#if tab === 'queue'}
			<!-- Said where the judging happens: the trade decides, not the badge. -->
			<p class="text-sm text-text-muted">{i18n.t('quality.queueHint')}</p>
		{/if}

		{#if rows.length === 0}
			<EmptyState
				title={i18n.t(`quality.empty.${tab}`)}
				body={i18n.t('quality.emptyHint')}
				size="sm"
			/>
		{:else}
			<ul class="space-y-3">
				{#each rows as row (row.id)}
					{@const adjusted = row.severity_adjusted_to !== null}
					<li
						class="rounded-xl border border-border bg-surface-elevated p-4"
						data-testid="quality-report"
					>
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div class="min-w-0 space-y-1">
								<h2 class="text-sm font-bold text-text">{row.title}</h2>
								<p class="text-xs text-text-muted">
									{row.reproducibility} · {fmtDate(row.created_at)}
								</p>
							</div>
							<div class="flex flex-wrap items-center gap-2">
								<Badge size="sm" variant={severityVariant[effectiveSeverity(row)] ?? 'default'}>
									{effectiveSeverity(row)}
								</Badge>
								<!-- The reporter's own reading, kept beside the reviewer's.
								     Replacing it would hide that somebody disagreed. -->
								{#if adjusted}
									<span class="text-xs text-text-muted">
										{i18n.t('quality.wasFiledAs', { severity: row.severity })}
									</span>
								{/if}
							</div>
						</div>

						{#if row.rejected_reason}
							<p class="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-muted">
								{row.rejected_reason}
							</p>
						{/if}

						<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
							{#if row.fix_url}
								<a
									href={row.fix_url}
									target="_blank"
									rel="external noopener noreferrer nofollow ugc"
									class="text-accent hover:underline"
								>
									{i18n.t('quality.seeTheFix')}
								</a>
							{/if}
							{#if row.fix_confirmed_at}
								<Badge size="sm" variant="success">{i18n.t('quality.fixConfirmed')}</Badge>
							{:else if row.fix_url}
								<Badge size="sm" variant="warning">{i18n.t('quality.fixUnconfirmed')}</Badge>
							{/if}
							{#if !row.reviewed_at}
								<span>{i18n.t('quality.awaitingReview')}</span>
							{/if}
						</div>

						{#if tab === 'queue'}
							<div class="mt-3 flex flex-wrap gap-2">
								<Button
									size="sm"
									loading={busy[row.id]}
									onclick={() =>
										act(
											row.id,
											() => qualityApi.review(row.id, { decision: 'accepted' }),
											i18n.t('quality.reviewed')
										)}
								>
									{i18n.t('quality.acceptCta')}
								</Button>
								{#each severities.filter((s) => s !== row.severity) as s (s)}
									<!-- Accepting and re-grading in one gesture, because that is
									     what a reviewer actually does: the report is real and
									     the severity was off. -->
									<Button
										size="sm"
										variant="ghost"
										loading={busy[row.id]}
										onclick={() =>
											act(
												row.id,
												() =>
													qualityApi.review(row.id, {
														decision: 'accepted',
														severity_adjusted_to: s
													}),
												i18n.t('quality.reviewed')
											)}
									>
										{i18n.t('quality.regradeTo', { severity: s })}
									</Button>
								{/each}
							</div>
						{:else if tab === 'mine' && row.fix_url && !row.fix_confirmed_at}
							<div class="mt-3">
								<Button
									size="sm"
									variant="ghost"
									loading={busy[row.id]}
									onclick={() =>
										act(
											row.id,
											() => qualityApi.confirmFix(row.id),
											i18n.t('quality.fixConfirmed')
										)}
								>
									{i18n.t('quality.confirmFixCta')}
								</Button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}

	<!-- Test runs are not here on purpose. A run belongs to a slice — it is
	     read at `/quality/slices/{id}/test-runs` and imported against one — so
	     it lives on the slice, next to the work it is evidence about, rather
	     than in a list of runs detached from what they ran on. -->
	<p class="text-xs text-text-muted">{i18n.t('quality.testRunsLiveOnSlices')}</p>
</div>
