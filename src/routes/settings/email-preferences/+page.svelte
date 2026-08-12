<script lang="ts">
	import { onMount } from 'svelte';
	import {
		emailPreferencesApi,
		EMAIL_PREFERENCE_DEFAULTS,
		type UpdateEmailPreferencesBody
	} from '$lib/api/emailPreferences';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$lib/stores/toast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';

	let prefs = $state<UpdateEmailPreferencesBody>({ ...EMAIL_PREFERENCE_DEFAULTS });
	let loading = $state(true);
	let saving = $state(false);

	// Keys are the wire contract; the testids in email-preferences.spec.ts
	// derive from them, so they must stay in sync with the backend field names.
	const rows: { key: keyof UpdateEmailPreferencesBody; label: string; desc: string }[] = $derived([
		{
			key: 'digest_weekly',
			label: i18n.t('settings.emailPrefs.digestWeekly'),
			desc: i18n.t('settings.emailPrefs.digestWeeklyDesc')
		},
		{
			key: 'streak_reminder',
			label: i18n.t('settings.emailPrefs.streakReminder'),
			desc: i18n.t('settings.emailPrefs.streakReminderDesc')
		},
		{
			key: 'marketing',
			label: i18n.t('settings.emailPrefs.marketing'),
			desc: i18n.t('settings.emailPrefs.marketingDesc')
		}
	]);

	onMount(async () => {
		try {
			const res = await emailPreferencesApi.get();
			prefs = {
				digest_weekly: res.data.digest_weekly,
				streak_reminder: res.data.streak_reminder,
				marketing: res.data.marketing
			};
		} catch (err) {
			// Falling back to the documented defaults keeps the screen usable and
			// lets the user save a deliberate choice rather than facing a dead end.
			toast.error(
				err instanceof SkilluError ? err.message : i18n.t('settings.emailPrefs.loadError')
			);
		} finally {
			loading = false;
		}
	});

	async function save() {
		saving = true;
		try {
			await emailPreferencesApi.update(prefs);
			toast.success(i18n.t('settings.emailPrefs.saved'));
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('settings.emailPrefs.title')} · Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8" data-testid="email-preferences-page">
	<h1 class="text-2xl font-bold">{i18n.t('settings.emailPrefs.title')}</h1>
	<p class="mt-1 text-sm text-text-muted">{i18n.t('settings.emailPrefs.subtitle')}</p>

	{#if loading}
		<div class="mt-6 flex flex-col gap-3">
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
		</div>
	{:else}
		<div class="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-6">
			{#each rows as row (row.key)}
				<label class="flex items-start justify-between gap-4">
					<span>
						<span class="block text-sm font-medium">{row.label}</span>
						<span class="block text-xs text-text-muted">{row.desc}</span>
					</span>
					<input
						type="checkbox"
						data-testid="email-pref-{row.key}"
						bind:checked={prefs[row.key]}
						class="mt-1 h-5 w-5 shrink-0 rounded accent-accent"
					/>
				</label>
			{/each}

			<p class="mt-2 text-xs text-text-muted">{i18n.t('settings.emailPrefs.transactional')}</p>

			<Button variant="primary" size="sm" loading={saving} onclick={save} class="mt-2">
				{i18n.t('common.actions.save')}
			</Button>
		</div>
	{/if}
</div>
