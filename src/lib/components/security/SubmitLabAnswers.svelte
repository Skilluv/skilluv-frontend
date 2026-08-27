<script lang="ts">
	/**
	 * B-02 — answering a graded defensive lab.
	 *
	 * `wrong_question_ids` comes back **without the right answers**, which is
	 * the whole point of an exercise somebody may retry: it says which ones
	 * missed and leaves the work of finding out why. This component renders
	 * exactly that and nothing more — no scoring per question, no reveal, no
	 * "close enough".
	 *
	 * The questions themselves come from whoever mounts this: the lab's
	 * artefact and its question list are the parent's to fetch, and a component
	 * that invented question ids would submit answers to a lab that never asked
	 * them.
	 */
	import { ClipboardCheck } from '@lucide/svelte';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import type { LabOutcome } from '$types';

	interface Props {
		challengeId: string;
		/** The lab's questions, in the order it asks them. */
		questions: { id: string; question: string; hint?: string | null }[];
		onsubmitted?: (outcome: LabOutcome) => void;
	}

	let { challengeId, questions, onsubmitted }: Props = $props();

	let answers = $state<Record<string, string>>({});
	let sending = $state(false);
	let outcome = $state<LabOutcome | null>(null);
	let errorText = $state('');

	let wrong = $derived(new Set(outcome?.wrong_question_ids ?? []));
	let answered = $derived(questions.filter((q) => (answers[q.id] ?? '').trim() !== '').length);

	async function submit() {
		if (sending || answered === 0) return;
		sending = true;
		errorText = '';
		try {
			const trimmed: Record<string, string> = {};
			for (const [id, value] of Object.entries(answers)) {
				if (value.trim()) trimmed[id] = value.trim();
			}
			const res = await securityApi.submitAnswers(challengeId, trimmed);
			outcome = res.data?.outcome ?? null;
			if (outcome) onsubmitted?.(outcome);
		} catch (err) {
			errorText = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			sending = false;
		}
	}
</script>

<section
	class="rounded-xl border border-border bg-surface-elevated p-5 space-y-4"
	data-testid="security-submit-lab"
>
	<h3 class="flex items-center gap-2 text-sm font-bold text-text">
		<ClipboardCheck size={16} />
		{i18n.t('securityPractice.labTitle')}
	</h3>

	<ol class="space-y-3">
		{#each questions as question (question.id)}
			<li>
				<label class="flex flex-col gap-1">
					<span class="text-sm text-text">{question.question}</span>
					<Input bind:value={answers[question.id]} data-testid="lab-answer-{question.id}" />
					{#if question.hint}
						<span class="text-xs text-text-muted">{question.hint}</span>
					{/if}
				</label>
				{#if wrong.has(question.id)}
					<!-- Marked wrong, and nothing more: the right answer stays
					     withheld or the retry teaches nothing. -->
					<p class="mt-1 text-xs text-warning">{i18n.t('securityPractice.labFailed')}</p>
				{/if}
			</li>
		{/each}
	</ol>

	{#if errorText}
		<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
			{errorText}
		</p>
	{/if}

	{#if outcome}
		<div
			class="rounded-lg border px-3 py-2 text-sm {outcome.passed
				? 'border-success/40 bg-success/5'
				: 'border-border bg-surface'}"
			data-testid="lab-outcome"
		>
			<p class="font-medium {outcome.passed ? 'text-success' : 'text-text'}">
				{outcome.passed
					? i18n.t('securityPractice.labPassed')
					: i18n.t('securityPractice.labFailed')}
			</p>
			<p class="mt-1 text-xs text-text-muted">
				{i18n.t('securityPractice.labScore', {
					correct: outcome.correct_count,
					total: outcome.total_count,
					percent: outcome.score_percent
				})}
				· {i18n.t('securityPractice.labAttemptsLeft', { n: outcome.attempts_left })}
			</p>
			{#each outcome.hints as hint (hint)}
				<p class="mt-1 text-sm text-text-muted">{hint}</p>
			{/each}
			{#if outcome.attestation_code}
				<a
					href="/attestations/verify/{outcome.attestation_code}"
					class="mt-1 inline-block text-xs text-accent hover:underline"
				>
					{i18n.t('securityPractice.attestationIssued')}
				</a>
			{/if}
			{#if outcome.fragments_awarded > 0}
				<p class="mt-1 text-xs text-text-muted">
					{i18n.t('securityPractice.fragmentsAwarded', { n: outcome.fragments_awarded })}
				</p>
			{/if}
		</div>
	{/if}

	<Button size="sm" loading={sending} disabled={answered === 0} onclick={submit}>
		{i18n.t('securityPractice.labSubmitCta')}
	</Button>
</section>
