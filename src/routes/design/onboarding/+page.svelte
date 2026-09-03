<script lang="ts">
	/**
	 * SKI-265 — the designer onboarding wizard.
	 *
	 * Seven questions, three of which the backend stores today. The other
	 * three ride in `designWizard`, which tries the full body first and keeps
	 * what the server refuses on the device — so the day the vocabulary grows,
	 * the next save pushes everything with no frontend release.
	 *
	 * The portfolio question is the exception: it has a real home already, as
	 * an external signal (SKI-42). That is what shipped for P-01/P-02 — the
	 * import the ticket imagined does not exist, because Behance closed its
	 * API in 2020 and Dribbble's needs a partnership.
	 *
	 * Skippable throughout: an onboarding nobody can leave is a wall.
	 */
	import { onMount } from 'svelte';
	import { ArrowLeft, ArrowRight, Check } from '@lucide/svelte';
	import { domainProfileApi } from '$lib/api/domain_profile';
	import { orientationsApi } from '$lib/api/orientations';
	import { externalSignalsApi } from '$lib/api/external_signals';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import {
		designWizard,
		type DesignChallengePreference,
		type DesignTool
	} from '$stores/design_wizard.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Select from '$components/ui/Select.svelte';
	import { MentorMatches, NextChallenges } from '$components/domain';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import {
		DOMAIN_GOALS,
		DOMAIN_LEVELS,
		DOMAIN_WEEKLY_HOURS,
		EXTERNAL_SIGNAL_PROVIDERS,
		type DomainGoal,
		type DomainLevel,
		type DomainWeeklyHours,
		type ExternalSignalProvider,
		type Orientation
	} from '$types';

	const TOTAL_STEPS = 7;

	/** Portfolio providers that make sense for a designer, from what the backend accepts. */
	const PORTFOLIO_PROVIDERS: ExternalSignalProvider[] = [
		'behance',
		'dribbble',
		'artstation',
		'vimeo',
		'foundry',
		'github'
	];

	const TOOLS: DesignTool[] = ['figma', 'adobe', 'sketch', 'blender', 'after_effects', 'other'];

	const PREFERENCES: DesignChallengePreference[] = ['individual', 'contest', 'both', 'undecided'];

	let step = $state(1);
	let done = $state(false);
	let skipping = $state(false);
	let loading = $state(true);
	let orientations = $state<Orientation[]>([]);

	let portfolioProvider = $state<ExternalSignalProvider>('behance');
	let portfolioUrl = $state('');
	let portfolioSaved = $state(false);

	/** Design orientations only — the catalogue holds every domain. */
	let designOrientations = $derived(
		orientations.filter((o) => o.primary_domain === 'design' && !o.is_archived)
	);

	let providerItems = $derived(
		PORTFOLIO_PROVIDERS.map((p) => ({
			value: p,
			label: i18n.t(`externalSignals.providers.${p}`)
		}))
	);

	let progressPct = $derived(Math.round((step / TOTAL_STEPS) * 100));

	function toggleFamily(slug: string) {
		const current = designWizard.pending.preferred_families;
		if (current.includes(slug)) {
			designWizard.setFamilies(current.filter((s) => s !== slug));
		} else if (current.length < 3) {
			designWizard.setFamilies([...current, slug]);
		} else {
			toast.info(i18n.t('designWizard.q2Max'));
		}
	}

	/** The portfolio answer goes straight to external signals, where it belongs. */
	async function declarePortfolio() {
		const url = portfolioUrl.trim();
		if (!url) return;
		try {
			await externalSignalsApi.create({
				provider: portfolioProvider,
				url,
				title: i18n.t(`externalSignals.providers.${portfolioProvider}`)
			});
			portfolioSaved = true;
			toast.success(i18n.t('designWizard.q5Declared'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	async function finish() {
		try {
			const result = await designWizard.save();
			toast.success(i18n.t('designWizard.savedToast'));
			if (!result.fullySaved) toast.info(i18n.t('designWizard.partialSaveNotice'));
			done = true;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	}

	/**
	 * Stop asking, which is not the same thing as saving nothing.
	 *
	 * `POST /users/me/domain-profile/design/skip` sets `skipped_at`, and the
	 * backend keeps that column precisely so the wizard does not reappear for
	 * ever for the people who least wanted it. Calling `finish()` here — which
	 * is what this button used to do — saved the partial answers and left
	 * `skipped_at` null, so the dismissal was never recorded.
	 *
	 * Whatever was already answered is still saved first: somebody who filled
	 * in four questions and then gave up should not lose the four.
	 */
	async function skip() {
		skipping = true;
		try {
			if (designWizard.hasAnswers) await designWizard.save();
			await domainProfileApi.skip('design');
			toast.success(i18n.t('designWizard.skippedToast'));
			done = true;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			skipping = false;
		}
	}

	function next() {
		if (step < TOTAL_STEPS) step += 1;
	}

	function back() {
		if (step > 1) step -= 1;
	}

	onMount(async () => {
		const [orientationsRes] = await Promise.allSettled([
			orientationsApi.list(),
			designWizard.hydrate()
		]);
		if (orientationsRes.status === 'fulfilled')
			orientations = orientationsRes.value.data?.orientations ?? [];
		loading = false;
	});
</script>

<svelte:head>
	<title>{i18n.t('designWizard.title')} | Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10" data-testid="design-onboarding">
	{#if loading}
		<Skeleton class="h-80 w-full" rounded="xl" />
	{:else if done}
		<div class="rounded-2xl border border-border bg-surface-elevated p-8 text-center">
			<span
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success"
				aria-hidden="true"
			>
				<Check size={22} strokeWidth={2.5} />
			</span>
			<h1 class="mt-4 text-2xl font-bold text-text-primary">{i18n.t('designWizard.doneTitle')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('designWizard.doneBody')}</p>

			{#if designWizard.heldLocally}
				<p class="mt-4 rounded-xl bg-surface-overlay p-3 text-xs text-text-muted" role="status">
					{i18n.t('designWizard.partialSaveNotice')}
				</p>
			{/if}

			<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
				<Button variant="accent" href="/challenges">
					{i18n.t('designWizard.browseChallenges')}
				</Button>
				<Button variant="ghost" href="/design/contests">
					{i18n.t('designWizard.browseContests')}
				</Button>
			</div>
		</div>
	{:else}
		<header class="mb-6">
			<h1 class="text-3xl font-bold text-text-primary">{i18n.t('designWizard.title')}</h1>
			<p class="mt-2 text-text-muted">{i18n.t('designWizard.subtitle')}</p>
			<div class="mt-5">
				<div
					class="h-1.5 w-full overflow-hidden rounded-full bg-surface-overlay"
					role="progressbar"
					aria-valuenow={progressPct}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label={i18n.t('designWizard.title')}
				>
					<div
						class="h-full rounded-full bg-accent transition-all duration-300"
						style="width: {progressPct}%"
					></div>
				</div>
				<p class="mt-2 text-xs text-text-muted">
					{i18n.t('designWizard.stepOf', { n: step, total: TOTAL_STEPS })}
				</p>
			</div>
		</header>

		<div class="rounded-2xl border border-border bg-surface-elevated p-6">
			{#if step === 1}
				<h2 class="text-lg font-bold text-text-primary">{i18n.t('designWizard.q1Title')}</h2>
				<p class="mt-1 text-sm text-text-muted">{i18n.t('designWizard.q1Hint')}</p>
				<div class="mt-4 space-y-2">
					{#each DOMAIN_LEVELS as level (level)}
						<button
							type="button"
							onclick={() => (designWizard.level = level as DomainLevel)}
							aria-pressed={designWizard.level === level}
							class="w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors duration-200 {designWizard.level ===
							level
								? 'border-accent bg-accent/5 text-text-primary'
								: 'border-border text-text-muted hover:border-text-muted hover:text-text-primary'}"
						>
							{i18n.t(`designWizard.levels.${level}`)}
						</button>
					{/each}
				</div>
			{:else if step === 2}
				<h2 class="text-lg font-bold text-text-primary">{i18n.t('designWizard.q2Title')}</h2>
				<p class="mt-1 text-sm text-text-muted">{i18n.t('designWizard.q2Hint')}</p>
				<div class="mt-4 flex flex-wrap gap-2">
					{#each designOrientations as orientation (orientation.id)}
						{@const picked = designWizard.pending.preferred_families.includes(orientation.slug)}
						<button
							type="button"
							onclick={() => toggleFamily(orientation.slug)}
							aria-pressed={picked}
							class="rounded-full border px-3 py-1.5 text-sm transition-colors duration-200 {picked
								? 'border-accent bg-accent/10 text-accent'
								: 'border-border text-text-muted hover:border-text-muted hover:text-text-primary'}"
						>
							{orientation.name}
						</button>
					{/each}
				</div>
			{:else if step === 3}
				<h2 class="text-lg font-bold text-text-primary">{i18n.t('designWizard.q3Title')}</h2>
				<p class="mt-1 text-sm text-text-muted">{i18n.t('designWizard.q3Hint')}</p>
				<div class="mt-4 space-y-2">
					{#each DOMAIN_WEEKLY_HOURS as hours (hours)}
						<button
							type="button"
							onclick={() => (designWizard.weeklyHours = hours as DomainWeeklyHours)}
							aria-pressed={designWizard.weeklyHours === hours}
							class="w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors duration-200 {designWizard.weeklyHours ===
							hours
								? 'border-accent bg-accent/5 text-text-primary'
								: 'border-border text-text-muted hover:border-text-muted hover:text-text-primary'}"
						>
							{i18n.t(`designWizard.weeklyHours.${hours}`)}
						</button>
					{/each}
				</div>
			{:else if step === 4}
				<h2 class="text-lg font-bold text-text-primary">{i18n.t('designWizard.q4Title')}</h2>
				<p class="mt-1 text-sm text-text-muted">{i18n.t('designWizard.q4Hint')}</p>
				<div class="mt-4 space-y-2">
					{#each DOMAIN_GOALS as goal (goal)}
						<button
							type="button"
							onclick={() => (designWizard.goal = goal as DomainGoal)}
							aria-pressed={designWizard.goal === goal}
							class="w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors duration-200 {designWizard.goal ===
							goal
								? 'border-accent bg-accent/5 text-text-primary'
								: 'border-border text-text-muted hover:border-text-muted hover:text-text-primary'}"
						>
							{i18n.t(`designWizard.goals.${goal}`)}
						</button>
					{/each}
				</div>
			{:else if step === 5}
				<h2 class="text-lg font-bold text-text-primary">{i18n.t('designWizard.q5Title')}</h2>
				<p class="mt-1 text-sm text-text-muted">{i18n.t('designWizard.q5Hint')}</p>
				{#if portfolioSaved}
					<p class="mt-4 rounded-xl bg-success/10 p-3 text-sm text-success" role="status">
						{i18n.t('designWizard.q5Declared')}
					</p>
				{:else}
					<div class="mt-4 space-y-4">
						<div>
							<span
								class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
							>
								{i18n.t('designWizard.q5Provider')}
							</span>
							<Select
								items={providerItems}
								value={portfolioProvider}
								onchange={(v) => (portfolioProvider = v)}
								shape="rounded"
							/>
						</div>
						<Input
							label={i18n.t('designWizard.q5Url')}
							type="url"
							bind:value={portfolioUrl}
							placeholder="https://"
						/>
						<Button
							variant="secondary"
							size="sm"
							disabled={portfolioUrl.trim() === ''}
							onclick={declarePortfolio}
						>
							{i18n.t('externalSignals.formSubmit')}
						</Button>
					</div>
				{/if}
			{:else if step === 6}
				<h2 class="text-lg font-bold text-text-primary">{i18n.t('designWizard.q6Title')}</h2>
				<p class="mt-1 text-sm text-text-muted">{i18n.t('designWizard.q6Hint')}</p>
				<div class="mt-4 space-y-2">
					{#each PREFERENCES as preference (preference)}
						<button
							type="button"
							onclick={() => designWizard.setChallengePreference(preference)}
							aria-pressed={designWizard.pending.challenge_preference === preference}
							class="w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors duration-200 {designWizard
								.pending.challenge_preference === preference
								? 'border-accent bg-accent/5 text-text-primary'
								: 'border-border text-text-muted hover:border-text-muted hover:text-text-primary'}"
						>
							{i18n.t(`designWizard.challengePreference.${preference}`)}
						</button>
					{/each}
				</div>
			{:else}
				<h2 class="text-lg font-bold text-text-primary">{i18n.t('designWizard.q7Title')}</h2>
				<p class="mt-1 text-sm text-text-muted">{i18n.t('designWizard.q7Hint')}</p>
				<div class="mt-4 flex flex-wrap gap-2">
					{#each TOOLS as tool (tool)}
						<button
							type="button"
							onclick={() => designWizard.setMainTool(tool)}
							aria-pressed={designWizard.pending.main_tool === tool}
							class="rounded-full border px-4 py-2 text-sm transition-colors duration-200 {designWizard
								.pending.main_tool === tool
								? 'border-accent bg-accent/10 text-accent'
								: 'border-border text-text-muted hover:border-text-muted hover:text-text-primary'}"
						>
							{i18n.t(`designWizard.tools.${tool}`)}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="mt-6 flex flex-wrap items-center justify-between gap-3">
			<Button variant="ghost" disabled={step === 1} onclick={back}>
				<span class="inline-flex items-center gap-1.5">
					<ArrowLeft size={14} strokeWidth={2} />
					{i18n.t('designWizard.back')}
				</span>
			</Button>

			<div class="flex items-center gap-3">
				<Button variant="ghost" loading={skipping} onclick={skip}>
					{i18n.t('designWizard.skip')}
				</Button>
				{#if step < TOTAL_STEPS}
					<Button variant="accent" onclick={next}>
						<span class="inline-flex items-center gap-1.5">
							{i18n.t('designWizard.next')}
							<ArrowRight size={14} strokeWidth={2} />
						</span>
					</Button>
				{:else}
					<Button variant="accent" loading={designWizard.saving} onclick={finish}>
						{i18n.t('designWizard.finish')}
					</Button>
				{/if}
			</div>
		</div>

		<!-- O-02 and O-03, at the end of the wizard rather than on a page of
		     their own: the moment somebody has just said what they want is the
		     moment a suggestion and a mentor mean something. Both render their
		     own empty state, so an account that skipped the questions sees no
		     hole. -->
		<div class="mt-10 space-y-10">
			<NextChallenges domain="design" />
			<MentorMatches domain="design" />
		</div>
	{/if}
</div>
