<script lang="ts">
	/**
	 * What became of a cohort, and the acts that record it.
	 *
	 * ## Why departures are recorded at all
	 *
	 * A cohort that only records graduations reports a completion rate of one
	 * hundred per cent, forever. `recordDeparture` requires a reason for that
	 * reason: the number is only worth reading if leaving is representable.
	 *
	 * So this panel offers both gestures side by side and never treats a
	 * departure as a failure state — somebody who left for a job is not a
	 * dropout, which is what the reason vocabulary exists to distinguish.
	 *
	 * ## Only the organiser sees the acts
	 *
	 * Graduating, recording a departure and concluding are the lead's acts. The
	 * outcomes themselves are readable by anybody who can read the cohort,
	 * because a cohort's record is what somebody joining it wants to see before
	 * joining.
	 */
	import { onMount } from 'svelte';
	import { GraduationCap } from '@lucide/svelte';
	import { leadershipApi } from '$api/leadership';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Select from '$components/ui/Select.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';

	interface Props {
		cohortId: string;
		/** The lead's acts are the lead's. */
		isOrganizer?: boolean;
		/** Roster, so a departure names somebody rather than takes a UUID. */
		members?: { user_id: string; display_name: string }[];
	}

	let { cohortId, isOrganizer = false, members = [] }: Props = $props();

	let outcomes = $state<Record<string, unknown> | null>(null);
	let reasons = $state<string[]>([]);
	let loading = $state(true);
	let busy = $state(false);

	let memberId = $state('');
	let reason = $state('');

	let memberItems = $derived([
		{ value: '', label: i18n.t('cohortOutcomes.pickMember') },
		...members.map((m) => ({ value: m.user_id, label: m.display_name }))
	]);
	/**
	 * A reason's own word, or its slug.
	 *
	 * The vocabulary is served and grows, so a translation may not exist yet.
	 * Falling back to the slug shows something readable; rendering the missing
	 * key would put `cohortOutcomes.reasons.left_for_job` in a dropdown.
	 */
	function reasonLabel(slug: string): string {
		const key = `cohortOutcomes.reasons.${slug}`;
		const translated = i18n.t(key);
		return translated === key ? slug.replaceAll('_', ' ') : translated;
	}

	let reasonItems = $derived([
		{ value: '', label: i18n.t('cohortOutcomes.pickReason') },
		...reasons.map((r) => ({ value: r, label: reasonLabel(r) }))
	]);

	async function load() {
		loading = true;
		const [o, ref] = await Promise.allSettled([
			leadershipApi.cohortOutcomes(cohortId),
			leadershipApi.reference()
		]);
		if (o.status === 'fulfilled') {
			outcomes = (o.value.data?.outcomes as Record<string, unknown>) ?? null;
		}
		// The leave vocabulary is served rather than shipped, so a reason the
		// validator has stopped accepting never reaches the form.
		if (ref.status === 'fulfilled') reasons = ref.value.data?.cohort_leave_reasons ?? [];
		loading = false;
	}

	async function run(fn: () => Promise<unknown>, done: string) {
		if (busy) return;
		busy = true;
		try {
			await fn();
			toast.success(done);
			memberId = '';
			reason = '';
			await load();
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}

	onMount(load);
</script>

{#if loading}
	<Skeleton class="h-24 w-full" rounded="xl" />
{:else}
	<section class="space-y-3" data-testid="cohort-outcomes">
		<h3 class="flex items-center gap-2 text-sm font-bold text-text">
			<GraduationCap size={16} />
			{i18n.t('cohortOutcomes.title')}
		</h3>

		{#if outcomes}
			<dl class="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
				{#each Object.entries(outcomes) as [key, value] (key)}
					<div class="bg-surface-elevated p-3 text-center">
						<dt class="text-xs text-text-muted">{key}</dt>
						<dd class="mt-1 text-lg font-bold text-text">{String(value)}</dd>
					</div>
				{/each}
			</dl>
		{:else}
			<!-- Nothing recorded is not the same as nobody finishing. -->
			<p class="text-sm text-text-muted">{i18n.t('cohortOutcomes.nothingRecorded')}</p>
		{/if}

		{#if isOrganizer}
			<div class="space-y-3 rounded-xl border border-border p-4">
				<Select items={memberItems} bind:value={memberId} shape="rounded" />

				<div class="flex flex-wrap gap-2">
					<Button
						size="sm"
						loading={busy}
						disabled={!memberId}
						onclick={() =>
							run(
								() => leadershipApi.graduateMember(cohortId, memberId),
								i18n.t('cohortOutcomes.graduated')
							)}
						data-testid="graduate-member"
					>
						{i18n.t('cohortOutcomes.graduateCta')}
					</Button>
				</div>

				<!-- Beside graduating, not hidden behind it. A cohort that can only
				     record graduations reports a hundred per cent forever, and a
				     reason is what makes leaving representable. -->
				<div class="space-y-2 border-t border-border pt-3">
					<Select items={reasonItems} bind:value={reason} shape="rounded" />
					<Button
						size="sm"
						variant="ghost"
						loading={busy}
						disabled={!memberId || !reason}
						onclick={() =>
							run(
								() => leadershipApi.recordDeparture(cohortId, memberId, reason),
								i18n.t('cohortOutcomes.departureRecorded')
							)}
						data-testid="record-departure"
					>
						{i18n.t('cohortOutcomes.departureCta')}
					</Button>
					<p class="text-xs text-text-muted">{i18n.t('cohortOutcomes.departureNote')}</p>
				</div>

				<div class="flex flex-wrap gap-2 border-t border-border pt-3">
					<Button
						size="sm"
						variant="ghost"
						loading={busy}
						onclick={() =>
							run(() => leadershipApi.leadCohort(cohortId), i18n.t('cohortOutcomes.ledToast'))}
					>
						{i18n.t('cohortOutcomes.leadCta')}
					</Button>
					<Button
						size="sm"
						variant="ghost"
						loading={busy}
						onclick={() =>
							run(
								() => leadershipApi.concludeCohort(cohortId),
								i18n.t('cohortOutcomes.concludedToast')
							)}
						data-testid="conclude-cohort"
					>
						{i18n.t('cohortOutcomes.concludeCta')}
					</Button>
				</div>
			</div>
		{/if}
	</section>
{/if}
