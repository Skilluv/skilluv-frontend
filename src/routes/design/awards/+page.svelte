<script lang="ts">
	/**
	 * C-02 / C-04 — the annual awards: the running edition and the ones before.
	 *
	 * The fifth page SKI-237 asked for, and the only consumer of the `awards`
	 * module. An edition is a year, and the year is the one the **work happened
	 * in**, not the one the ceremony is held — getting that backwards is off by
	 * one on every link on the page.
	 *
	 * Three things the surface is careful about:
	 *
	 * 1. **The weights are always shown.** The standing is weighted, not a
	 *    popular vote, so a nominee with fewer votes can sit higher. Printing
	 *    the ranking without `community_weight` / `jury_weight` would be
	 *    printing a number nobody can reproduce.
	 * 2. **One action per phase.** `draft` → `nominations` → `voting` →
	 *    `concluded`, and each verb is refused outside its phase. The page
	 *    offers the action that can currently land rather than buttons that
	 *    answer 400.
	 * 3. **The categories are the design ones.** `award_categories` gained a
	 *    `skill_domain` in the backend fix batch, so `?domain=design` returns
	 *    this family's awards plus the platform-wide ones. Before that the page
	 *    had to list every category and say why — filtering on a name heuristic
	 *    would have silently hidden one, which is worse than showing a few that
	 *    belong elsewhere.
	 */
	import { onMount } from 'svelte';
	import { Trophy, Vote } from '@lucide/svelte';
	import { awardsApi, currentAction, groupByCategory, FIRST_AWARD_YEAR } from '$api/awards';
	import { SkilluError } from '$api/client';
	import { auth } from '$stores/auth.svelte';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import FeaturedDesigner from '$components/design/FeaturedDesigner.svelte';
	import type { AwardCategory, AwardEdition, AwardNominee } from '$types';

	/**
	 * An edition covers a finished year, so the newest one that can exist is
	 * last year. Computed rather than hardcoded: a constant here would quietly
	 * stop offering the current edition every January.
	 */
	const LATEST_YEAR = new Date().getFullYear() - 1;

	/** The family this page shows. Cross-cutting categories come back too. */
	const DOMAIN = 'design';

	let year = $state(LATEST_YEAR);
	let edition = $state<AwardEdition | null>(null);
	let nominees = $state<AwardNominee[]>([]);
	let categories = $state<AwardCategory[]>([]);
	let loading = $state(true);
	let missing = $state(false);
	let loadError = $state('');
	let voting = $state<string | null>(null);

	let nominateCategory = $state('');
	let nominateSubject = $state('');
	let nominateCitation = $state('');
	let nominating = $state(false);

	let byCategory = $derived(groupByCategory(nominees));
	let action = $derived(edition ? currentAction(edition) : null);

	let years = $derived(
		Array.from({ length: Math.max(1, LATEST_YEAR - FIRST_AWARD_YEAR + 1) }, (_, i) => {
			const y = LATEST_YEAR - i;
			return { value: y, label: String(y) };
		})
	);

	let categoryOptions = $derived(categories.map((c) => ({ value: c.slug, label: c.name })));

	let canNominate = $derived(
		action === 'nominate' &&
			auth.isAuthenticated &&
			nominateCategory !== '' &&
			nominateSubject.trim() !== '' &&
			nominateCitation.trim() !== ''
	);

	function statusLabel(status: string): string {
		const key = `designAwards.statuses.${status}`;
		const translated = i18n.t(key);
		return translated === key ? status : translated;
	}

	function statusVariant(status: string): 'accent' | 'success' | 'warning' | 'default' {
		if (status === 'voting') return 'accent';
		if (status === 'concluded') return 'success';
		if (status === 'nominations') return 'warning';
		return 'default';
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	/** NUMERIC over JSON: a weighted score arrives as a string. */
	function fmtScore(value: string): string {
		const n = Number(value);
		return Number.isFinite(n) ? n.toFixed(1) : value;
	}

	async function load() {
		loading = true;
		missing = false;
		loadError = '';
		try {
			// Settled rather than all: an edition that does not exist answers 404,
			// and the category list is still worth showing next to that.
			const [ed, cats] = await Promise.allSettled([
				awardsApi.edition(year),
				awardsApi.categories(DOMAIN)
			]);

			if (ed.status === 'fulfilled') {
				edition = ed.value.data?.edition ?? null;
				nominees = ed.value.data?.nominees ?? [];
			} else {
				edition = null;
				nominees = [];
				if (ed.reason instanceof SkilluError && ed.reason.status === 404) missing = true;
				else loadError = ed.reason instanceof SkilluError ? ed.reason.message : i18n.t('errors.generic');
			}

			categories = cats.status === 'fulfilled' ? (cats.value.data?.categories ?? []) : [];
			if (!nominateCategory && categories.length > 0) nominateCategory = categories[0].slug;
		} finally {
			loading = false;
		}
	}

	async function castVote(nomineeId: string, jury: boolean) {
		voting = nomineeId;
		try {
			await awardsApi.vote(nomineeId, jury);
			toast.success(i18n.t('designAwards.votedToast'));
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			voting = null;
		}
	}

	async function nominate() {
		if (!canNominate) return;
		nominating = true;
		try {
			await awardsApi.nominate(year, {
				category_slug: nominateCategory,
				subject_id: nominateSubject.trim(),
				citation: nominateCitation.trim()
			});
			toast.success(i18n.t('designAwards.nominatedToast'));
			nominateSubject = '';
			nominateCitation = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			nominating = false;
		}
	}

	function pickYear(next: number) {
		year = next;
		void load();
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('designAwards.title')} · Skilluv</title>
	<meta name="description" content={i18n.t('designAwards.subtitle')} />
	<meta property="og:title" content={i18n.t('designAwards.title')} />
	<meta property="og:description" content={i18n.t('designAwards.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 px-4 py-8" data-testid="design-awards-page">
	<header class="space-y-2">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-text">
			<Trophy size={22} />
			{i18n.t('designAwards.title')}
		</h1>
		<p class="text-sm text-text-muted">{i18n.t('designAwards.subtitle')}</p>
	</header>

	<!-- P-03 sits here rather than on a page of its own: a weekly featuring
	     and an annual award are the same act at two cadences, and the awards
	     page is otherwise empty for most of the year. -->
	<FeaturedDesigner />

	{#if years.length > 1}
		<section class="space-y-2">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
				{i18n.t('designAwards.previousEditions')}
			</h2>
			<SegmentedControl items={years} value={year} onchange={pickYear} />
		</section>
	{/if}

	{#if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if missing}
		<p
			class="rounded-xl border border-border bg-surface-elevated px-4 py-6 text-sm text-text-muted"
			data-testid="design-awards-missing"
		>
			{i18n.t('designAwards.noEdition', { year })}
			<span class="ml-1">{i18n.t('designAwards.noEditionHint')}</span>
		</p>
	{:else if loadError}
		<p class="rounded-lg border border-error/40 bg-error/5 px-4 py-3 text-sm text-error">
			{loadError}
		</p>
	{:else if edition}
		<section class="rounded-xl border border-border bg-surface-elevated p-5 space-y-3">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="text-lg font-bold text-text">
					{i18n.t('designAwards.editionOf', { year: edition.year })}
				</h2>
				<Badge variant={statusVariant(edition.status)}>{statusLabel(edition.status)}</Badge>
			</div>

			<!-- The weights, always: the standing below is weighted, not a
			     popular vote, so a nominee with fewer votes can sit higher. -->
			<p class="text-sm text-text-muted" data-testid="design-awards-weights">
				{i18n.t('designAwards.weights', {
					community: edition.community_weight,
					jury: edition.jury_weight
				})}
			</p>

			<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
				{#if edition.prize_amount_eur}
					<span>
						{i18n.t('designAwards.prizePerCategory', { amount: edition.prize_amount_eur })}
					</span>
				{/if}
				{#if edition.nominations_close_at}
					<span>
						{i18n.t('designAwards.nominationsClose', {
							date: fmtDate(edition.nominations_close_at)
						})}
					</span>
				{/if}
				{#if edition.voting_closes_at}
					<span>
						{i18n.t('designAwards.votingCloses', { date: fmtDate(edition.voting_closes_at) })}
					</span>
				{/if}
			</div>

			{#if edition.status === 'concluded'}
				<p class="text-xs text-text-muted">{i18n.t('designAwards.closedNote')}</p>
			{/if}
		</section>

		{#if action === 'nominate' && auth.isAuthenticated}
			<section
				class="rounded-xl border border-border bg-surface-elevated p-5 space-y-3"
				data-testid="design-awards-nominate"
			>
				<h2 class="text-sm font-bold text-text">{i18n.t('designAwards.nominateTitle')}</h2>
				<label class="flex flex-col gap-1 text-xs text-text-muted">
					{i18n.t('designAwards.nominateCategory')}
					<Select
						items={categoryOptions}
						bind:value={nominateCategory}
						shape="rounded"
						size="sm"
						searchable
					/>
				</label>
				<Input
					label={i18n.t('designAwards.nominateSubject')}
					hint={i18n.t('designAwards.nominateSubjectHint')}
					bind:value={nominateSubject}
					data-testid="design-awards-subject"
				/>
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-text">
						{i18n.t('designAwards.nominateCitation')}
					</span>
					<textarea
						bind:value={nominateCitation}
						rows="4"
						class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
						data-testid="design-awards-citation"
					></textarea>
					<span class="text-xs text-text-muted">
						{i18n.t('designAwards.nominateCitationHint')}
					</span>
				</label>
				<Button size="sm" loading={nominating} disabled={!canNominate} onclick={nominate}>
					{i18n.t('designAwards.nominateCta')}
				</Button>
			</section>
		{/if}

		<section class="space-y-4">
			<div>
				<h2 class="text-sm font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('designAwards.categoriesTitle')}
				</h2>

			</div>

			{#each categories as category (category.slug)}
				{@const entries = byCategory.get(category.slug) ?? []}
				<article
					class="rounded-xl border border-border bg-surface-elevated p-5"
					data-testid="design-awards-category"
				>
					<h3 class="text-sm font-bold text-text">{category.name}</h3>
					{#if category.description}
						<p class="mt-1 text-sm text-text-muted">{category.description}</p>
					{/if}

					{#if entries.length === 0}
						<p class="mt-3 text-sm text-text-muted">{i18n.t('designAwards.categoryEmpty')}</p>
					{:else}
						<ul class="mt-3 space-y-3">
							{#each entries as nominee (nominee.id)}
								<li class="rounded-lg border border-border bg-surface p-4">
									<div class="flex flex-wrap items-start justify-between gap-2">
										<span class="text-sm font-medium text-text">
											{nominee.subject_label ?? nominee.subject_id}
										</span>
										<Badge variant={nominee.shortlisted ? 'accent' : 'default'}>
											{nominee.shortlisted
												? i18n.t('designAwards.shortlisted')
												: i18n.t('designAwards.notShortlisted')}
										</Badge>
									</div>

									<p class="mt-2 whitespace-pre-line text-sm text-text-muted">
										{nominee.citation}
									</p>

									<div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
										<span>{i18n.t('designAwards.communityVotes', { n: nominee.community_votes })}</span>
										<span>{i18n.t('designAwards.juryVotes', { n: nominee.jury_votes })}</span>
										<span class="font-medium text-text">
											{i18n.t('designAwards.weightedScore', {
												n: fmtScore(nominee.weighted_score)
											})}
										</span>
									</div>

									{#if action === 'vote' && nominee.shortlisted && auth.isAuthenticated}
										<div class="mt-3 flex flex-wrap gap-2">
											<Button
												size="sm"
												variant="ghost"
												loading={voting === nominee.id}
												onclick={() => castVote(nominee.id, false)}
											>
												<Vote size={14} />
												{i18n.t('designAwards.voteCta')}
											</Button>
											<!-- Offered separately rather than as a toggle: a juror
											     holds both ballots, and casting one does not spend
											     the other. A 403 here simply means not a juror. -->
											<Button
												size="sm"
												variant="ghost"
												loading={voting === nominee.id}
												onclick={() => castVote(nominee.id, true)}
											>
												{i18n.t('designAwards.voteJuryCta')}
											</Button>
										</div>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</article>
			{/each}
		</section>
	{/if}
</div>
