<script lang="ts">
	/**
	 * The one-off slots a mentor opens.
	 *
	 * This lived at the bottom of `/mentors`, inside the component that also
	 * lists somebody's own subscriptions and the public programme catalogue.
	 * Three audiences in one block: a visitor browsing mentors was shown a form
	 * for publishing their own availability, which only makes sense once you
	 * are the mentor. It now sits with the rest of mentor management.
	 *
	 * A recurring weekly availability is a different endpoint
	 * (`/mentors/me/availability`) and a different promise: this one commits to
	 * a single date, which is what somebody with an irregular week can honestly
	 * offer.
	 */
	import { CalendarClock } from '@lucide/svelte';
	import { mentoringProductsApi } from '$api/mentoring_products';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';

	let date = $state('');
	let start = $state('');
	let end = $state('');
	let busy = $state(false);

	/** Today, so the picker cannot offer a day the server will refuse. */
	function minDate(): string {
		return new Date().toISOString().slice(0, 10);
	}

	let backwards = $derived(Boolean(start && end && end <= start));

	async function open() {
		if (!date || !start || !end || backwards || busy) return;
		busy = true;
		try {
			await mentoringProductsApi.openSlot({
				date,
				start_time: start,
				end_time: end,
				// The mentor's own zone, so a mentee in another one is not
				// guessing what "14:00" meant.
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
			});
			toast.success(i18n.t('mentoringProducts.slotOpened'));
			date = '';
			start = '';
			end = '';
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			busy = false;
		}
	}
</script>

<section class="space-y-3" data-testid="mentor-slots">
	<h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
		<CalendarClock size={14} />
		{i18n.t('mentoringProducts.slotsTitle')}
	</h2>
	<p class="text-sm text-text-muted">{i18n.t('mentoringProducts.slotsHint')}</p>
	<div class="flex flex-wrap items-end gap-2">
		<Input type="date" min={minDate()} bind:value={date} />
		<Input type="time" bind:value={start} />
		<Input type="time" bind:value={end} />
		<Button
			size="sm"
			loading={busy}
			disabled={!date || !start || !end || backwards}
			onclick={open}
			data-testid="open-slot"
		>
			{i18n.t('mentoringProducts.openSlotCta')}
		</Button>
	</div>
	{#if backwards}
		<!-- Said before the request rather than after: the server refuses a
		     backwards slot, and hearing it from a toast is hearing it late. -->
		<p class="text-xs text-error">{i18n.t('mentoringProducts.slotBackwards')}</p>
	{/if}
</section>
