<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { SkilluError } from '$lib/api/client';
	import { toast } from '$lib/stores/toast.svelte';
	import { notificationPreferencesApi } from '$lib/api/notificationPreferences';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { MoonStar } from '@lucide/svelte';

	interface Props {
		/** État initial, quand l'appelant l'a déjà chargé. */
		start?: number | null;
		end?: number | null;
		timezone?: string | null;
	}

	let { start = null, end = null, timezone = null }: Props = $props();

	let enabled = $state(start !== null && end !== null);
	let startHour = $state(start ?? 22);
	let endHour = $state(end ?? 7);
	let saving = $state(false);

	/**
	 * Le fuseau du navigateur, quand le compte n'en a pas encore.
	 *
	 * Le backend refuse une fenêtre sans fuseau, et il a raison : une heure
	 * qu'on ne sait pas situer ne peut pas être appliquée. Le demander à la
	 * personne alors que son navigateur le connaît serait une question pour
	 * rien.
	 */
	let resolvedTimezone = $derived(
		timezone ??
			(typeof Intl !== 'undefined'
				? (Intl.DateTimeFormat().resolvedOptions().timeZone ?? null)
				: null)
	);

	const HOURS = Array.from({ length: 24 }, (_, h) => ({
		value: h,
		label: `${String(h).padStart(2, '0')}:00`
	}));

	async function save() {
		if (startHour === endHour) {
			// Le backend refuse aussi, mais le dire ici évite un aller-retour
			// pour une erreur que l'écran peut voir.
			toast.error(i18n.t('errors.generic'));
			return;
		}

		saving = true;
		try {
			const res = await notificationPreferencesApi.setQuietHours({
				start: startHour,
				end: endHour,
				timezone: resolvedTimezone
			});
			timezone = res.data.timezone;
			enabled = true;
			toast.success(i18n.t('settings.notifications.quiet.saved'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}

	async function clear() {
		saving = true;
		try {
			// Les deux bornes à null effacent la fenêtre. Le fuseau reste :
			// il appartient à la personne, pas à la fenêtre, et le
			// redemander à la réactivation serait une question de plus.
			await notificationPreferencesApi.setQuietHours({
				start: null,
				end: null,
				timezone: null
			});
			enabled = false;
			toast.success(i18n.t('settings.notifications.quiet.cleared'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}
</script>

<section
	class="rounded-2xl border border-border bg-surface-elevated p-6"
	data-testid="quiet-hours-card"
>
	<div class="flex items-start gap-3">
		<MoonStar size={18} strokeWidth={2} class="mt-0.5 shrink-0 text-text-muted" />
		<div class="flex-1">
			<h2 class="text-sm font-semibold">{i18n.t('settings.notifications.quiet.title')}</h2>
			<p class="mt-1 text-xs text-text-muted">
				{i18n.t('settings.notifications.quiet.subtitle')}
			</p>
		</div>
	</div>

	<div class="mt-4 flex flex-wrap items-end gap-3">
		<div class="flex flex-col gap-1 text-xs" data-testid="quiet-start">
			<span class="text-text-muted">{i18n.t('settings.notifications.quiet.start')}</span>
			<Select items={HOURS} bind:value={startHour} size="sm" shape="rounded" />
		</div>

		<div class="flex flex-col gap-1 text-xs" data-testid="quiet-end">
			<span class="text-text-muted">{i18n.t('settings.notifications.quiet.end')}</span>
			<Select items={HOURS} bind:value={endHour} size="sm" shape="rounded" />
		</div>

		<Button variant="primary" size="sm" loading={saving} onclick={save}>
			{enabled ? i18n.t('common.actions.save') : i18n.t('settings.notifications.quiet.enable')}
		</Button>

		{#if enabled}
			<Button variant="ghost" size="sm" loading={saving} onclick={clear}>
				{i18n.t('settings.notifications.quiet.clear')}
			</Button>
		{/if}
	</div>

	{#if resolvedTimezone}
		<p class="mt-3 text-xs text-text-muted">
			{i18n.t('settings.notifications.quiet.timezone')} : {resolvedTimezone}
			{#if !timezone}
				— {i18n.t('settings.notifications.quiet.timezoneDetected')}
			{/if}
		</p>
	{/if}

	<p class="mt-2 text-xs text-text-muted">
		{i18n.t('settings.notifications.quiet.transactional')}
	</p>
</section>
