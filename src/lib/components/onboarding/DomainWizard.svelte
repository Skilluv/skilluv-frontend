<script lang="ts">
	/**
	 * The per-domain onboarding wizard, rendered from what the backend serves.
	 *
	 * `GET /users/me/domain-profile/{domain}/questions` says which questions a
	 * domain asks and what each accepts, because the vocabulary changes as the
	 * wizard is reworded and a CHECK would make each rewording a migration. So
	 * this component ships no list of its own: a value added server-side shows
	 * up without a frontend release, and one removed stops being offered the
	 * same day.
	 *
	 * That is also why an unknown value still renders. The labels below are a
	 * translation layer, not a gate — a vocabulary entry with no translation
	 * yet appears as its own slug rather than as a blank option nobody can
	 * pick.
	 *
	 * None of this is a claim about anybody. A declared level and a declared
	 * framework sort what gets recommended; rank, badges and craft score read
	 * proofs, and nothing here is one.
	 *
	 * Skippable throughout: an onboarding nobody can leave is a wall.
	 *
	 * Every domain goes through here, `design` included. It used to have a
	 * hand-rolled wizard of its own, written when the backend stored three of
	 * its seven answers and refused the rest; the registry now accepts all of
	 * them, so the second implementation had nothing left to justify it —
	 * including its family list, which it built from `GET /orientations` and
	 * therefore from a different query than the one validating the answer.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft, ArrowRight, Check } from '@lucide/svelte';
	import { domainProfileApi } from '$lib/api/domain_profile';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import TagInput from '$components/ui/TagInput.svelte';
	import RecommendationPanel from './RecommendationPanel.svelte';
	import type {
		DomainAnswerValue,
		DomainQuestionSpec,
		DomainRecommendation,
		ProfileDomain
	} from '$types';

	interface Props {
		domain: ProfileDomain;
		title: string;
		subtitle: string;
		/** Where to land once the wizard is done or skipped. */
		doneHref: string;
		testId?: string;
	}

	let { domain, title, subtitle, doneHref, testId }: Props = $props();

	let questions = $state<DomainQuestionSpec[]>([]);
	let answers = $state<Record<string, DomainAnswerValue>>({});
	let step = $state(0);
	let loading = $state(true);
	let loadError = $state('');
	let saving = $state(false);
	let skipping = $state(false);

	/**
	 * What the save came back with, and the reason finishing no longer
	 * navigates straight away.
	 *
	 * The backend answers the wizard with a plan — a headline, the reasoning
	 * behind it, guides and a first month. It was being discarded: the page
	 * toasted "Saved." and left. Somebody who has just answered six questions
	 * and is shown a toast concludes the questions were paperwork, which is
	 * the one impression the wizard exists to avoid.
	 */
	let recommendation = $state<DomainRecommendation | null>(null);

	let current = $derived(questions[step] ?? null);
	let total = $derived(questions.length);
	let isLast = $derived(total > 0 && step === total - 1);
	let progress = $derived(total > 0 ? Math.round(((step + 1) / total) * 100) : 0);

	/**
	 * A question with nothing chosen is skipped, not blocked. The backend
	 * stores a partial object happily, and forcing an answer to "what compute
	 * do you have" out of somebody who does not know yet buys a wrong answer.
	 */
	let currentAnswered = $derived.by(() => {
		if (!current) return false;
		const value = answers[current.key];
		return Array.isArray(value) ? value.length > 0 : Boolean(value);
	});

	async function load() {
		loading = true;
		loadError = '';
		try {
			const [specs, existing] = await Promise.allSettled([
				domainProfileApi.questions(domain),
				domainProfileApi.get(domain)
			]);
			if (specs.status === 'rejected') throw specs.reason;
			questions = specs.value.data ?? [];
			// Re-entering the wizard shows what was answered last time rather
			// than an empty form somebody has to fill in again.
			//
			// Every stored value is kept, including one for a question this
			// domain has stopped asking: it is not rendered, and it is not
			// sent back either, because `filledAnswers` walks the questions
			// the registry served rather than whatever is in this object.
			if (existing.status === 'fulfilled') {
				for (const [key, value] of Object.entries(existing.value.data?.answers ?? {})) {
					if (value !== undefined) answers[key] = value;
				}
			}
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function setSingle(key: string, value: string) {
		// Picking the same answer again clears it: that is the only way out of
		// a closed question somebody answered by mistake.
		answers = { ...answers, [key]: answers[key] === value ? '' : value };
	}

	function toggleMulti(spec: DomainQuestionSpec, value: string) {
		const chosen = Array.isArray(answers[spec.key]) ? (answers[spec.key] as string[]) : [];
		if (chosen.includes(value)) {
			answers = { ...answers, [spec.key]: chosen.filter((v) => v !== value) };
			return;
		}
		const ceiling = spec.max_selections ?? Infinity;
		if (chosen.length >= ceiling) {
			toast.error(i18n.t('domainWizard.maxSelections', { n: ceiling }));
			return;
		}
		answers = { ...answers, [spec.key]: [...chosen, value] };
	}

	function isChosen(spec: DomainQuestionSpec, value: string): boolean {
		const chosen = answers[spec.key];
		return Array.isArray(chosen) ? chosen.includes(value) : chosen === value;
	}

	/**
	 * A vocabulary entry's label, falling back to the value itself.
	 *
	 * `preferred_families` is the case that makes the fallback necessary: its
	 * vocabulary comes from the orientations table, so it cannot be translated
	 * ahead of time and a slug is a better answer than an empty chip.
	 */
	function optionLabel(key: string, value: string): string {
		const path = `domainWizard.options.${key}.${value}`;
		const label = i18n.t(path);
		if (label !== path) return label;
		// Several questions answer with a discipline slug — quality and
		// leadership both ask which domains you want to work *on*, and
		// communication asks what you write about. Those names are already
		// translated once, under `common.domains`, and copying the twelve into
		// three more maps is three more places for them to disagree.
		const shared = `common.domains.${value}`;
		const sharedLabel = i18n.t(shared);
		return sharedLabel === shared ? value : sharedLabel;
	}

	function questionLabel(key: string): string {
		const path = `domainWizard.questions.${key}`;
		const label = i18n.t(path);
		return label === path ? key : label;
	}

	function questionHint(key: string): string {
		const path = `domainWizard.hints.${key}`;
		const hint = i18n.t(path);
		return hint === path ? '' : hint;
	}

	/**
	 * Only what was actually answered, to a question this domain still asks.
	 *
	 * An empty string is not an answer, and neither is a value stored against
	 * a question that has since been dropped. The second matters: the prior
	 * answers are loaded back so nobody refills a form they have filled, and
	 * a key the registry no longer serves would ride along on the next save
	 * and be refused — taking the whole body with it, because an unknown key
	 * rejects the request rather than being ignored. So the questions that
	 * were served are the list, and `answers` is only the lookup.
	 */
	function filledAnswers(): Record<string, unknown> {
		const body: Record<string, unknown> = {};
		for (const question of questions) {
			const value = answers[question.key];
			if (Array.isArray(value)) {
				if (value.length > 0) body[question.key] = value;
			} else if (value) {
				body[question.key] = value;
			}
		}
		return body;
	}

	/**
	 * Save, and show what the answers bought.
	 *
	 * The plan replaces the wizard in place rather than arriving on a page of
	 * its own: it is the reply to *these* answers, and a navigation between
	 * the two would let somebody arrive at it from a link with nothing behind
	 * it. `doneHref` becomes the button under the plan instead.
	 *
	 * A save that stores the answers but returns no plan is still a success —
	 * the recommendation is `skip_serializing_if = "Option::is_none"` on the
	 * wire, so its absence is a shape, not a failure. The toast covers it.
	 */
	async function save() {
		saving = true;
		try {
			const res = await domainProfileApi.put(domain, filledAnswers());
			recommendation = res.data?.recommendation ?? null;
			toast.success(i18n.t('domainWizard.savedToast'));
			if (!recommendation) await goto(doneHref);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}

	async function skip() {
		skipping = true;
		try {
			await domainProfileApi.skip(domain);
			await goto(doneHref);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			skipping = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{title} | Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10" data-testid={testId}>
	{#if !recommendation}
		<header class="mb-8">
			<h1 class="text-3xl font-bold text-text-primary">{title}</h1>
			<p class="mt-2 text-text-muted">{subtitle}</p>
			<p class="mt-3 text-xs text-text-muted">{i18n.t('domainWizard.notAClaim')}</p>
		</header>
	{/if}

	{#if recommendation}
		<RecommendationPanel plan={recommendation} {doneHref} />
	{:else if loading}
		<Skeleton class="h-64 w-full" rounded="xl" />
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else if total === 0}
		<p class="text-sm text-text-muted">{i18n.t('domainWizard.noQuestions')}</p>
	{:else if current}
		<div
			class="h-1.5 w-full overflow-hidden rounded-full bg-surface-overlay"
			role="progressbar"
			aria-valuenow={progress}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label={i18n.t('domainWizard.progressLabel')}
		>
			<div class="h-full rounded-full bg-accent transition-all" style="width: {progress}%"></div>
		</div>
		<p class="mt-2 text-xs text-text-muted">
			{i18n.t('domainWizard.stepOf', { n: step + 1, total })}
		</p>

		<section class="mt-6 rounded-2xl border border-border bg-surface-elevated p-6">
			<h2 class="text-lg font-semibold text-text-primary">{questionLabel(current.key)}</h2>
			{#if questionHint(current.key)}
				<p class="mt-1 text-sm text-text-muted">{questionHint(current.key)}</p>
			{/if}

			{#if current.answer === 'text'}
				<div class="mt-4">
					<Input
						name={current.key}
						label={questionLabel(current.key)}
						maxlength={current.max_len ?? undefined}
						value={typeof answers[current.key] === 'string'
							? (answers[current.key] as string)
							: ''}
						oninput={(e) =>
							(answers = {
								...answers,
								[current.key]: (e.currentTarget as HTMLInputElement).value
							})}
					/>
				</div>
			{:else if current.answer === 'multi' && current.allowed.length === 0}
				<!-- Several answers, from a vocabulary the platform does not
				     own: a tester's tools run from Playwright to a screen
				     reader to a spreadsheet. This branch used to fall through
				     to the chip row below, which iterates `allowed` and so
				     rendered nothing at all — the question was visible and
				     unanswerable. -->
				<div class="mt-4">
					<TagInput
						id="wizard-{current.key}"
						label={questionLabel(current.key)}
						max={current.max_selections ?? undefined}
						maxLength={current.max_len ?? undefined}
						placeholder={i18n.t('domainWizard.tagPlaceholder')}
						value={Array.isArray(answers[current.key]) ? (answers[current.key] as string[]) : []}
						onchange={(v) => (answers = { ...answers, [current.key]: v })}
					/>
				</div>
			{:else}
				{#if current.answer === 'multi' && current.max_selections}
					<p class="mt-1 text-xs text-text-muted">
						{i18n.t('domainWizard.pickUpTo', { n: current.max_selections })}
					</p>
				{/if}
				<div class="mt-4 flex flex-wrap gap-2" data-testid="wizard-options">
					{#each current.allowed as value (value)}
						<button
							type="button"
							onclick={() =>
								current.answer === 'multi'
									? toggleMulti(current, value)
									: setSingle(current.key, value)}
							aria-pressed={isChosen(current, value)}
							class="rounded-xl border px-4 py-2 text-sm transition-colors {isChosen(
								current,
								value
							)
								? 'border-accent bg-accent/10 text-accent'
								: 'border-border bg-surface text-text-primary hover:border-accent/40'}"
						>
							{optionLabel(current.key, value)}
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<div class="mt-6 flex flex-wrap items-center gap-3">
			<Button variant="ghost" disabled={step === 0} onclick={() => (step = Math.max(0, step - 1))}>
				<span class="inline-flex items-center gap-1.5">
					<ArrowLeft size={14} strokeWidth={2} />
					{i18n.t('domainWizard.back')}
				</span>
			</Button>

			{#if isLast}
				<Button variant="accent" loading={saving} onclick={save}>
					<span class="inline-flex items-center gap-1.5">
						<Check size={14} strokeWidth={2} />
						{i18n.t('domainWizard.finish')}
					</span>
				</Button>
			{:else}
				<Button variant="accent" onclick={() => (step = Math.min(total - 1, step + 1))}>
					<span class="inline-flex items-center gap-1.5">
						{currentAnswered ? i18n.t('domainWizard.next') : i18n.t('domainWizard.skipQuestion')}
						<ArrowRight size={14} strokeWidth={2} />
					</span>
				</Button>
			{/if}

			<Button variant="ghost" class="ml-auto" loading={skipping} onclick={skip}>
				{i18n.t('domainWizard.skipAll')}
			</Button>
		</div>
	{/if}
</div>
