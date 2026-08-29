<script lang="ts">
	/**
	 * C-03 — submitting a captured flag.
	 *
	 * A wrong answer comes back as **200 with `correct: false`**, not as an
	 * error, and treating it as one would throw away the two things that make a
	 * retry possible: `attempts_left_this_hour` and, sometimes, a hint. So the
	 * failure path here renders as information, not as a red banner.
	 *
	 * The comparison is case-sensitive after trimming surrounding whitespace,
	 * and this component trims exactly the same way and no further. Normalising
	 * case client-side would make a correct flag read as wrong on a challenge
	 * whose planted flag differs only in case — which is a bug nobody would
	 * find, because the person hitting it would assume they were wrong.
	 */
	import { resolve } from '$app/paths';
	import { Flag } from '@lucide/svelte';
	import { securityApi } from '$api/security';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import type { FlagOutcome } from '$types';

	interface Props {
		challengeId: string;
		/** Called on a correct flag, so a parent can refresh what it shows. */
		onsolved?: (outcome: FlagOutcome) => void;
	}

	let { challengeId, onsolved }: Props = $props();

	let flag = $state('');
	let sending = $state(false);
	let outcome = $state<FlagOutcome | null>(null);
	let errorText = $state('');

	async function submit() {
		const value = flag.trim();
		if (!value || sending) return;
		sending = true;
		errorText = '';
		try {
			// Trimmed only. Lower-casing here would make a correct flag read as
			// wrong, and the person hitting it would assume the mistake was theirs.
			const res = await securityApi.submitFlag(challengeId, value);
			outcome = res.data?.outcome ?? null;
			if (outcome?.correct) {
				flag = '';
				toast.success(i18n.t('securityPractice.flagCorrect'));
				onsolved?.(outcome);
			}
		} catch (err) {
			errorText = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			sending = false;
		}
	}
</script>

<section
	class="rounded-xl border border-border bg-surface-elevated p-5 space-y-3"
	data-testid="security-submit-flag"
>
	<h3 class="flex items-center gap-2 text-sm font-bold text-text">
		<Flag size={16} />
		{i18n.t('securityPractice.flagTitle')}
	</h3>

	<div class="flex flex-wrap items-end gap-2">
		<div class="min-w-0 flex-1">
			<Input
				bind:value={flag}
				placeholder={i18n.t('securityPractice.flagPlaceholder')}
				data-testid="flag-input"
			/>
		</div>
		<Button size="sm" loading={sending} disabled={!flag.trim()} onclick={submit}>
			{i18n.t('securityPractice.flagCta')}
		</Button>
	</div>

	{#if errorText}
		<p class="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
			{errorText}
		</p>
	{/if}

	{#if outcome}
		<!-- A wrong flag is information, not a failure: it carries what is left
		     to try and sometimes a hint, and a red banner throws both away. -->
		<div
			class="rounded-lg border px-3 py-2 text-sm {outcome.correct
				? 'border-success/40 bg-success/5'
				: 'border-border bg-surface'}"
			data-testid="flag-outcome"
		>
			<p class="font-medium {outcome.correct ? 'text-success' : 'text-text'}">
				{outcome.correct
					? i18n.t('securityPractice.flagCorrect')
					: i18n.t('securityPractice.flagWrong')}
			</p>

			{#if outcome.correct}
				<div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
					{#if outcome.first_solve}
						<Badge variant="accent" size="sm">{i18n.t('securityPractice.flagFirstBlood')}</Badge>
					{/if}
					{#if outcome.fragments_awarded > 0}
						<span class="text-text-muted">
							{i18n.t('securityPractice.fragmentsAwarded', { n: outcome.fragments_awarded })}
						</span>
					{/if}
					{#if outcome.attestation_code}
						<a
							href={resolve(`/attestations/verify/${outcome.attestation_code}`)}
							class="text-accent hover:underline"
						>
							{i18n.t('securityPractice.attestationIssued')}
						</a>
					{/if}
				</div>
			{:else}
				<p class="mt-1 text-xs text-text-muted">
					{i18n.t('securityPractice.attemptsLeft', { n: outcome.attempts_left_this_hour })}
				</p>
				{#if outcome.hint}
					<p class="mt-1 text-sm text-text-muted">{outcome.hint}</p>
				{/if}
			{/if}
		</div>
	{/if}
</section>
