<script lang="ts">
	/**
	 * Applying to a mission, for any domain.
	 *
	 * Same shape everywhere because the application is: `/missions/{slug}/apply`
	 * takes the same body whatever the trade.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { missionsApi } from '$lib/api/missions';
	import { externalSignalsApi } from '$lib/api/external_signals';
	import { SkilluError } from '$api/client';
	import { i18n } from '$lib/i18n';
	import { toast } from '$stores/toast.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import { IpTermsBadge } from '$components/design';
	import type { ExternalSignal, Mission } from '$types';

	interface Props {
		/** Where this domain's board lives, e.g. `/ai/missions`. */
		basePath: string;
		/** Where this domain's "my missions" lives. */
		minePath: string;
	}

	let { basePath, minePath }: Props = $props();

	let slug = $derived($page.params.slug ?? '');

	let mission = $state<Mission | null>(null);
	let signals = $state<ExternalSignal[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let coverLetter = $state('');
	let pickedSignals = $state<string[]>([]);
	let extraUrls = $state('');
	let pastMissions = $state('');
	let availabilityHours = $state('10');
	let submitting = $state(false);

	let canSubmit = $derived(coverLetter.trim().length >= 40);

	/** Picked declarations plus anything typed by hand, deduplicated. */
	let portfolioUrls = $derived.by(() => {
		const typed = extraUrls
			.split('\n')
			.map((u) => u.trim())
			.filter((u) => u.length > 0);
		return [...new Set([...pickedSignals, ...typed])];
	});

	async function load() {
		loading = true;
		loadError = '';
		try {
			const res = await missionsApi.get(slug);
			mission = res.data.mission;
			try {
				const signalRes = await externalSignalsApi.listMine();
				signals = [...(signalRes.data?.verified ?? []), ...(signalRes.data?.declared ?? [])];
			} catch {
				// No declared signals is a normal state; the free field remains.
			}
		} catch (err) {
			loadError = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			loading = false;
		}
	}

	function toggleSignal(url: string) {
		pickedSignals = pickedSignals.includes(url)
			? pickedSignals.filter((u) => u !== url)
			: [...pickedSignals, url];
	}

	async function submit() {
		submitting = true;
		try {
			await missionsApi.apply(slug, {
				cover_letter: coverLetter.trim(),
				portfolio_urls: portfolioUrls,
				past_similar_missions: pastMissions.trim() || undefined,
				availability_hours_per_week: Number(availabilityHours) || undefined
			});
			toast.success(i18n.t('missions.appliedToast'));
			await goto(minePath);
		} catch (err) {
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		} finally {
			submitting = false;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>{i18n.t('missions.applyTitle')} — Skilluv</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8" data-testid="design-mission-apply">
	{#if loading}
		<Skeleton class="h-96 w-full" rounded="xl" />
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
			<Button variant="ghost" size="sm" class="mt-3" href={basePath}>
				{i18n.t('missions.backToList')}
			</Button>
		</div>
	{:else if mission}
		<header class="mb-6">
			<a
				href="{basePath}/{mission.slug}"
				class="text-sm text-text-muted underline-offset-4 hover:text-text-primary hover:underline"
			>
				{mission.title}
			</a>
			<h1 class="mt-2 text-3xl font-bold text-text-primary">
				{i18n.t('missions.applyTitle')}
			</h1>
			<div class="mt-3">
				<IpTermsBadge terms={mission.ip_terms} withHint />
			</div>
		</header>

		<form
			class="space-y-5 rounded-2xl border border-border bg-surface-elevated p-6"
			onsubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
		>
			<div>
				<label
					for="cover-letter"
					class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
				>
					{i18n.t('missions.coverLetter')}
				</label>
				<textarea
					id="cover-letter"
					bind:value={coverLetter}
					rows="8"
					maxlength={5000}
					placeholder={i18n.t('missions.coverLetterPlaceholder')}
					class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
					required
				></textarea>
			</div>

			<div>
				<span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
					{i18n.t('missions.portfolioUrls')}
				</span>
				{#if signals.length > 0}
					<ul class="mb-3 space-y-1.5" role="list">
						{#each signals as signal (signal.id)}
							<li>
								<label class="flex items-start gap-2 text-sm">
									<input
										type="checkbox"
										checked={pickedSignals.includes(signal.url)}
										onchange={() => toggleSignal(signal.url)}
										class="mt-0.5 h-4 w-4 rounded border-border accent-accent"
									/>
									<span class="min-w-0">
										<span class="block truncate text-text-primary">{signal.title}</span>
										<span class="block truncate text-xs text-text-muted">{signal.url}</span>
									</span>
								</label>
							</li>
						{/each}
					</ul>
				{/if}
				<textarea
					bind:value={extraUrls}
					rows="3"
					placeholder="https://"
					aria-label={i18n.t('missions.portfolioUrls')}
					class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
				></textarea>
				<p class="mt-1 text-xs text-text-muted">{i18n.t('missions.portfolioUrlsHint')}</p>
			</div>

			<div>
				<label
					for="past-missions"
					class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted"
				>
					{i18n.t('missions.pastMissions')}
				</label>
				<textarea
					id="past-missions"
					bind:value={pastMissions}
					rows="4"
					maxlength={2000}
					placeholder={i18n.t('missions.pastMissionsPlaceholder')}
					class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
				></textarea>
			</div>

			<Input
				label={i18n.t('missions.availabilityHours')}
				type="number"
				min="1"
				max="60"
				bind:value={availabilityHours}
			/>

			<div class="flex items-center justify-end gap-3 border-t border-border pt-5">
				<Button variant="ghost" href="{basePath}/{mission.slug}">
					{i18n.t('common.actions.cancel')}
				</Button>
				<Button variant="accent" type="submit" loading={submitting} disabled={!canSubmit}>
					{i18n.t('missions.applySubmit')}
				</Button>
			</div>
		</form>
	{/if}
</div>
