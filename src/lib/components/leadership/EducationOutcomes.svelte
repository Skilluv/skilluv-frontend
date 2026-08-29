<script lang="ts">
	/**
	 * A cohort's teaching record: who finished, and who ran the curriculum
	 * afterwards.
	 *
	 * Distinct from the leadership cohort panel next to it, and the distinction
	 * is the question. Leadership asks whether somebody led the group;
	 * education asks what the learners got. The two share a cohort id and
	 * nothing else.
	 *
	 * ## Outcomes are per learner, and that is the honest shape
	 *
	 * `PUT /education/cohorts/{id}/outcomes` writes one result at a time. A
	 * trainer who could only report a headline number would report a good one,
	 * and a cohort's record is only worth reading if the people who did not
	 * finish are in it.
	 *
	 * ## Adoptions are what a curriculum is for
	 *
	 * A curriculum nobody else ran is a document. The count of other trainers
	 * who ran it is what separates the two, so it is shown even at zero — zero
	 * is a fact about a curriculum, not a missing figure.
	 *
	 * ## The one that is a duty
	 *
	 * `learner-data-cleared` declares that the personal data a course collected
	 * has been deleted. Teaching produces records about people who never joined
	 * this platform, and the platform hosting the curriculum does not get to
	 * keep those forever. It is offered as a statement on the record, not as a
	 * tidy-up action.
	 */
	import { onMount } from 'svelte';
	import { BookOpen } from '@lucide/svelte';
	import { educationApi } from '$api/education';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	interface Props {
		cohortId: string;
		/** The trainer's acts are the trainer's. */
		isOrganizer?: boolean;
		/** Set when the cohort ran a curriculum, so adoptions can be read. */
		curriculumSliceId?: string | null;
	}

	let { cohortId, isOrganizer = false, curriculumSliceId = null }: Props = $props();

	let outcomes = $state<unknown[]>([]);
	let adoptions = $state<unknown[]>([]);
	let loading = $state(true);
	let busy = $state(false);
	let confirmCleared = $state(false);

	async function load() {
		loading = true;
		const calls: Promise<unknown>[] = [educationApi.outcomes(cohortId)];
		if (curriculumSliceId) calls.push(educationApi.adoptions(curriculumSliceId));
		const [o, a] = await Promise.allSettled(calls);
		if (o.status === 'fulfilled') {
			outcomes = ((o.value as { data?: { outcomes?: unknown[] } }).data?.outcomes) ?? [];
		}
		if (a?.status === 'fulfilled') {
			adoptions = ((a.value as { data?: { adoptions?: unknown[] } }).data?.adoptions) ?? [];
		}
		loading = false;
	}

	async function declareCleared() {
		if (busy || !curriculumSliceId) return;
		busy = true;
		try {
			await educationApi.declareLearnerDataCleared(curriculumSliceId);
			toast.success(i18n.t('educationOutcomes.clearedDeclared'));
			confirmCleared = false;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-20 w-full" rounded="xl" />
{:else}
	<section class="space-y-3" data-testid="education-outcomes">
		<h3 class="flex items-center gap-2 text-sm font-bold text-text">
			<BookOpen size={16} />
			{i18n.t('educationOutcomes.title')}
		</h3>

		<p class="text-sm text-text-muted">
			{#if outcomes.length > 0}
				{i18n.t('educationOutcomes.recorded', { n: outcomes.length })}
			{:else}
				<!-- Nothing recorded is not the same as nobody finishing. -->
				{i18n.t('educationOutcomes.noneRecorded')}
			{/if}
		</p>

		{#if curriculumSliceId}
			<!-- Shown at zero too: no other trainer having run it is a fact about
			     the curriculum, not a missing number. -->
			<p class="text-sm text-text-muted">
				{i18n.t('educationOutcomes.adoptions', { n: adoptions.length })}
			</p>
		{/if}

		{#if isOrganizer && curriculumSliceId}
			<div class="space-y-2 border-t border-border pt-3">
				<!-- A statement on the record about an obligation discharged, and it
				     reads that way rather than as housekeeping. -->
				<p class="text-xs text-text-muted">{i18n.t('educationOutcomes.clearedNote')}</p>
				{#if confirmCleared}
					<div class="flex flex-wrap gap-2">
						<Button
							size="sm"
							loading={busy}
							onclick={declareCleared}
							data-testid="declare-cleared"
						>
							{i18n.t('educationOutcomes.clearedConfirmCta')}
						</Button>
						<Button size="sm" variant="ghost" onclick={() => (confirmCleared = false)}>
							{i18n.t('educationOutcomes.cancelCta')}
						</Button>
					</div>
				{:else}
					<Button size="sm" variant="ghost" onclick={() => (confirmCleared = true)}>
						{i18n.t('educationOutcomes.clearedCta')}
					</Button>
				{/if}
			</div>
		{/if}
	</section>
{/if}
