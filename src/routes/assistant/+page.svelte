<script lang="ts">
	/**
	 * SKI-44 — the disclosed learning companion.
	 *
	 * The disclosure is not fine print: every call is recorded, and anything
	 * from the last seven days is attached to the next deliverable submitted.
	 * The banner says that before the first question, not after, and the
	 * history page shows exactly what has already been attached.
	 *
	 * Markdown comes back from the model; it renders as pre-wrapped text like
	 * every other markdown surface here, which keeps a model-authored string
	 * from becoming markup.
	 */
	import { onMount } from 'svelte';
	import { Info, Sparkles } from '@lucide/svelte';
	import {
		aiCompanionApi,
		AI_MAX_CODE_CHARS,
		AI_MAX_PROMPT_CHARS
	} from '$lib/api/ai_companion';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import SegmentedControl from '$components/ui/SegmentedControl.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { JobPanel } from '$components/assistant';
	import {
		AI_INTERACTION_TYPES,
		type AiCompanionAnswer,
		type AiCompanionQuota,
		type AiInteraction,
		type AiInteractionType
	} from '$types';

	let interactionType = $state<AiInteractionType>('explain');
	let prompt = $state('');
	let code = $state('');
	let language = $state('');
	let skillSlug = $state('');

	let answer = $state<AiCompanionAnswer | null>(null);
	let quota = $state<AiCompanionQuota | null>(null);
	let interactions = $state<AiInteraction[]>([]);
	let undisclosedOnly = $state(false);

	let asking = $state(false);
	let loadingHistory = $state(true);

	/** These two kinds are about a piece of code, so the editor opens for them. */
	let wantsCode = $derived(interactionType === 'pre_review' || interactionType === 'debug_help');

	let typeItems = $derived(
		AI_INTERACTION_TYPES.map((t) => ({ value: t, label: i18n.t(`assistant.types.${t}`) }))
	);

	let promptTooLong = $derived(prompt.length > AI_MAX_PROMPT_CHARS);
	let codeTooLong = $derived(code.length > AI_MAX_CODE_CHARS);
	let exhausted = $derived(quota !== null && quota.remaining <= 0);
	let canAsk = $derived(prompt.trim().length > 0 && !promptTooLong && !codeTooLong && !exhausted);

	async function loadQuota() {
		try {
			quota = (await aiCompanionApi.quota()).data;
		} catch {
			// Without the quota the counter is hidden; the backend still enforces it.
		}
	}

	async function loadHistory() {
		loadingHistory = true;
		try {
			const res = await aiCompanionApi.interactions({
				limit: 25,
				undisclosed_only: undisclosedOnly
			});
			interactions = res.data?.interactions ?? [];
		} catch {
			interactions = [];
		} finally {
			loadingHistory = false;
		}
	}

	async function ask() {
		asking = true;
		try {
			const res = await aiCompanionApi.ask({
				interaction_type: interactionType,
				prompt: prompt.trim(),
				code: wantsCode && code.trim() ? code : undefined,
				language: language.trim() || undefined,
				skill_slug: skillSlug.trim() || undefined,
				locale: i18n.locale
			});
			answer = res.data;
			if (quota) quota = { ...quota, remaining: res.data.quota_remaining };
			await loadHistory();
		} catch (err) {
			if (err instanceof SkilluError && err.code === 'RATE_LIMITED') {
				toast.error(i18n.t('assistant.rateLimited'));
			} else {
				toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
			}
		} finally {
			asking = false;
		}
	}

	function fmtDate(iso: string): string {
		return new Date(iso).toLocaleDateString(i18n.locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	onMount(() => {
		void loadQuota();
		void loadHistory();
	});
</script>

<svelte:head>
	<title>{i18n.t('assistant.title')} — Skilluv</title>
	<meta name="description" content={i18n.t('assistant.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="assistant-page">
	<header class="mb-6">
		<h1 class="flex items-center gap-2 text-3xl font-bold text-text-primary">
			<Sparkles size={24} strokeWidth={2} class="text-accent" />
			{i18n.t('assistant.title')}
		</h1>
		<p class="mt-2 text-text-muted">{i18n.t('assistant.subtitle')}</p>
	</header>

	<!-- Disclosure, before the first question rather than after. -->
	<section
		class="mb-6 rounded-xl border border-border bg-surface-overlay p-4"
		aria-label={i18n.t('assistant.disclosureBanner')}
	>
		<p class="flex items-start gap-2 text-sm text-text-primary">
			<Info size={15} strokeWidth={2} class="mt-0.5 shrink-0 text-accent" />
			<span>
				<span class="font-semibold">{i18n.t('assistant.disclosureBanner')}</span>
				<span class="mt-1 block text-xs text-text-muted">
					{i18n.t('assistant.disclosureDetail', { n: quota?.disclosure_window_days ?? 7 })}
				</span>
			</span>
		</p>
		{#if quota}
			<p class="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
				<span class="font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('assistant.quotaLabel')}
				</span>
				<Badge variant={quota.remaining > 0 ? 'success' : 'warning'} size="sm">
					{i18n.t('assistant.quotaRemaining', { n: quota.remaining, total: quota.daily_quota })}
				</Badge>
				<span class="text-text-muted">{i18n.t('assistant.quotaResets')}</span>
			</p>
		{/if}
	</section>

	<form
		class="space-y-4 rounded-2xl border border-border bg-surface-elevated p-5"
		onsubmit={(e) => {
			e.preventDefault();
			void ask();
		}}
	>
		<div>
			<SegmentedControl
				items={typeItems}
				value={interactionType}
				onchange={(v) => (interactionType = v)}
				size="sm"
			/>
			<p class="mt-2 text-xs text-text-muted">{i18n.t(`assistant.typeHints.${interactionType}`)}</p>
		</div>

		<div>
			<label
				for="assistant-prompt"
				class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
			>
				{i18n.t('assistant.promptLabel')}
			</label>
			<textarea
				id="assistant-prompt"
				bind:value={prompt}
				rows="3"
				placeholder={i18n.t('assistant.promptPlaceholder')}
				class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
			></textarea>
			{#if promptTooLong}
				<p class="mt-1 text-xs text-error" role="alert">
					{i18n.t('assistant.promptTooLong', { max: AI_MAX_PROMPT_CHARS })}
				</p>
			{/if}
		</div>

		{#if wantsCode}
			<div>
				<label
					for="assistant-code"
					class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
				>
					{i18n.t('assistant.codeLabel')}
				</label>
				<textarea
					id="assistant-code"
					bind:value={code}
					rows="8"
					spellcheck="false"
					placeholder={i18n.t('assistant.codePlaceholder')}
					class="w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
				></textarea>
				{#if codeTooLong}
					<p class="mt-1 text-xs text-error" role="alert">
						{i18n.t('assistant.codeTooLong', { max: AI_MAX_CODE_CHARS })}
					</p>
				{/if}
			</div>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2">
			<Input label={i18n.t('assistant.languageLabel')} bind:value={language} maxlength={40} />
			<Input label={i18n.t('assistant.skillLabel')} bind:value={skillSlug} maxlength={80} />
		</div>

		{#if exhausted}
			<p class="text-sm text-warning" role="status">{i18n.t('assistant.quotaExhausted')}</p>
		{/if}

		<div class="flex justify-end border-t border-border pt-4">
			<Button variant="accent" type="submit" loading={asking} disabled={!canAsk}>
				{asking ? i18n.t('assistant.thinking') : i18n.t('assistant.submit')}
			</Button>
		</div>
	</form>

	{#if answer}
		<section class="mt-6 rounded-2xl border border-border bg-surface-elevated p-5">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="text-sm font-bold text-text-primary">{i18n.t('assistant.answerTitle')}</h2>
				<div class="flex flex-wrap items-center gap-2 text-xs text-text-muted">
					{#if answer.cached}
						<Badge size="sm">{i18n.t('assistant.answerCached')}</Badge>
					{/if}
					{#if answer.model_version}
						<span>{i18n.t('assistant.answerModel', { model: answer.model_version })}</span>
					{/if}
				</div>
			</div>

			<p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
				{answer.answer_markdown}
			</p>

			{#if answer.items.length > 0}
				<div class="mt-5 border-t border-border pt-4">
					<h3 class="text-xs font-bold uppercase tracking-wider text-text-muted">
						{i18n.t('assistant.itemsTitle')}
					</h3>
					<ul class="mt-3 space-y-4" role="list">
						{#each [...answer.items].sort((a, b) => a.priority - b.priority) as item (item.title)}
							<li>
								<p class="text-sm font-semibold text-text-primary">{item.title}</p>
								<p class="mt-1 whitespace-pre-wrap text-sm text-text-muted">{item.body_markdown}</p>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<p class="mt-5 border-t border-border pt-4 text-xs text-text-muted">
				{i18n.t('assistant.answerDisclosure', { label: answer.disclosure_label })}
			</p>
		</section>
	{/if}

	<section class="mt-8">
		<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-sm font-bold text-text-primary">{i18n.t('assistant.historyTitle')}</h2>
			<button
				type="button"
				onclick={() => {
					undisclosedOnly = !undisclosedOnly;
					void loadHistory();
				}}
				aria-pressed={undisclosedOnly}
				class="rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 {undisclosedOnly
					? 'border-accent/40 bg-accent/10 text-accent'
					: 'border-border bg-surface-elevated text-text-muted hover:text-text-primary'}"
			>
				{i18n.t('assistant.historyUndisclosedOnly')}
			</button>
		</div>

		{#if loadingHistory}
			<Skeleton class="h-24 w-full" rounded="xl" />
		{:else if interactions.length === 0}
			<p class="text-sm text-text-muted">{i18n.t('assistant.historyEmpty')}</p>
		{:else}
			<ul class="space-y-2" role="list">
				{#each interactions as row (row.id)}
					<li class="rounded-xl border border-border bg-surface-elevated px-4 py-3">
						<p class="flex flex-wrap items-center gap-2 text-xs text-text-muted">
							<Badge size="sm">{i18n.t(`assistant.types.${row.interaction_type}`)}</Badge>
							<span>{fmtDate(row.created_at)}</span>
							<span>
								{row.disclosed_at
									? i18n.t('assistant.historyDisclosedOn', { date: fmtDate(row.disclosed_at) })
									: i18n.t('assistant.historyNotDisclosed')}
							</span>
						</p>
						<p class="mt-1.5 line-clamp-2 text-sm text-text-primary">{row.prompt}</p>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- The long-running half: a code review or a set of recommendations, both
	     of which return a job rather than an answer. -->
	<div class="mx-auto mt-8 max-w-4xl px-4">
		<JobPanel />
	</div>
</div>
