<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n } from '$lib/i18n';
	import { SkilluError } from '$lib/api/client';
	import { toast } from '$lib/stores/toast.svelte';
	import {
		notificationPreferencesApi,
		CHANNELS,
		type Channel,
		type KindPreference,
		type QuietHours
	} from '$lib/api/notificationPreferences';
	import PushToggle from '$components/pwa/PushToggle.svelte';
	import QuietHoursCard from '$components/settings/QuietHoursCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { ArrowLeft, Lock } from '@lucide/svelte';

	let prefs = $state<KindPreference[]>([]);
	let quiet = $state<QuietHours | null>(null);
	let loading = $state(true);
	let saving = $state(false);

	/**
	 * Display order. Money first, social noise next, moderation last.
	 * Someone opening this screen is almost always trying to silence
	 * something social, but they should first see what cannot be silenced.
	 */
	const CATEGORY_ORDER = [
		'payments',
		'account',
		'mentorship',
		'guild',
		'enterprise',
		'social',
		'learning',
		'digest',
		'lifecycle',
		'admin'
	];

	let grouped = $derived.by(() => {
		const buckets = new Map<string, KindPreference[]>();
		for (const pref of prefs) {
			const list = buckets.get(pref.category) ?? [];
			list.push(pref);
			buckets.set(pref.category, list);
		}
		// A category missing from the list above sorts last rather than
		// disappearing: a kind added backend-side must show up here without
		// a frontend release.
		return [...buckets.entries()].sort(
			([a], [b]) =>
				(CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99)
		);
	});

	function categoryLabel(category: string): string {
		const key = `settings.notifications.categories.${category}`;
		const label = i18n.t(key);
		// `t` returns the key when it is missing. The raw category name is
		// less ugly than a translation path shown to the user.
		return label === key ? category : label;
	}

	function channelLabel(channel: Channel): string {
		return i18n.t(
			`settings.notifications.channels.${channel === 'in_app' ? 'inApp' : channel}`
		);
	}

	onMount(async () => {
		try {
			const res = await notificationPreferencesApi.list();
			prefs = res.data.preferences;
			quiet = res.data.quiet_hours;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			loading = false;
		}
	});

	/**
	 * Save one toggle, immediately.
	 *
	 * No "Save" button: across forty-eight kinds, a person changes one or
	 * two then closes the tab. A screen that loses that choice because they
	 * never saw the button at the bottom is worth nothing.
	 */
	async function toggle(pref: KindPreference, channel: Channel) {
		if (pref.transactional) return;

		const before = pref[channel];
		const next = !before;
		pref[channel] = next;
		saving = true;

		try {
			const res = await notificationPreferencesApi.update([
				{ kind: pref.kind, [channel]: next }
			]);
			if (res.data.rejected.length > 0) {
				// The server refused. Put the toggle back where it was:
				// letting it move when nothing changed is worse than an
				// error, because the person believes they chose.
				pref[channel] = before;
				toast.error(res.data.rejected[0]);
			}
		} catch (err) {
			pref[channel] = before;
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}

	async function resetAll() {
		saving = true;
		try {
			const res = await notificationPreferencesApi.reset();
			toast.success(
				i18n
					.t('settings.notifications.resetDone')
					.replace('{count}', String(res.data.cleared))
			);
			const refreshed = await notificationPreferencesApi.list();
			prefs = refreshed.data.preferences;
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('settings.notifications.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8" data-testid="notification-preferences-page">
	<a
		href="/settings"
		class="mb-6 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
	>
		<ArrowLeft size={14} strokeWidth={2} />
		{i18n.t('settings.title')}
	</a>

	<h1 class="mb-2 text-2xl font-bold">{i18n.t('settings.notifications.title')}</h1>
	<p class="mb-6 text-text-muted">{i18n.t('settings.notifications.subtitle')}</p>

	<PushToggle />

	{#if !loading}
		<div class="mt-4">
			<!-- Mounted after loading: the card takes the current state as
			     its initial value, and showing it before we know that would
			     show defaults to someone who already chose. -->
			<QuietHoursCard
				start={quiet?.start ?? null}
				end={quiet?.end ?? null}
				timezone={quiet?.timezone ?? null}
			/>
		</div>
	{/if}

	{#if loading}
		<div class="mt-6 flex flex-col gap-3">
			<Skeleton class="h-32 w-full" />
			<Skeleton class="h-32 w-full" />
		</div>
	{:else}
		<p class="mt-8 text-xs text-text-muted">{i18n.t('settings.notifications.channelsHint')}</p>

		{#each grouped as [category, items] (category)}
			<section class="mt-4 rounded-2xl border border-border bg-surface-elevated p-6">
				<h2 class="mb-4 text-sm font-semibold tracking-wide text-text-muted uppercase">
					{categoryLabel(category)}
				</h2>

				<div class="flex flex-col gap-4">
					{#each items as pref (pref.kind)}
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="min-w-48 flex-1">
								<span class="block text-sm font-medium">{pref.label}</span>
								{#if pref.transactional}
									<span class="mt-1 inline-flex items-center gap-1">
										<Badge variant="default" size="sm">
											<Lock size={11} strokeWidth={2} />
											{i18n.t('settings.notifications.fixed')}
										</Badge>
									</span>
								{/if}
							</div>

							<div class="flex shrink-0 gap-4">
								{#each CHANNELS as channel (channel)}
									{#if pref.available_channels.includes(channel)}
										<label
											class="flex flex-col items-center gap-1 text-xs"
											class:opacity-50={pref.transactional}
										>
											<span class="text-text-muted">{channelLabel(channel)}</span>
											<input
												type="checkbox"
												data-testid="pref-{pref.kind}-{channel}"
												checked={pref[channel]}
												disabled={pref.transactional || saving}
												onchange={() => toggle(pref, channel)}
												class="h-5 w-5 rounded accent-accent disabled:cursor-not-allowed"
											/>
										</label>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/each}

		<p class="mt-4 text-xs text-text-muted">{i18n.t('settings.notifications.fixedHint')}</p>

		<Button variant="ghost" size="sm" loading={saving} onclick={resetAll} class="mt-4">
			{i18n.t('settings.notifications.resetAll')}
		</Button>
	{/if}
</div>
