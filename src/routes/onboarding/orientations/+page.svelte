<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { orientationsApi } from '$lib/api/orientations';
	import { auth } from '$lib/stores/auth.svelte';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { PUBLIC_DOMAINS } from '$lib/utils/domains';
	import { OrientationSelector } from '$lib/components/orientations';
	import DiscordLinkCard from '$components/onboarding/DiscordLinkCard.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Orientation } from '$lib/types';
	import type { RegisterOrientationRequest } from '$lib/api/orientations';
	import { onMount } from 'svelte';

	let catalog = $state<Orientation[]>([]);
	let loading = $state(true);
	let error = $state('');
	let submitting = $state(false);
	let done = $state(false);

	/**
	 * Which discipline's trades are on screen.
	 *
	 * Starts on the caller's own — the reason they are here is almost always
	 * the trade they already practise — and every change reloads from the API
	 * rather than filtering what is in hand. The catalogue is around 255 trades
	 * against a page cap of 200, so "load everything and filter" quietly
	 * returned the backend's default 50 and called it the catalogue.
	 */
	let domain = $state<string>(auth.user?.skill_domain ?? PUBLIC_DOMAINS[0]);

	onMount(() => {
		void load();
	});

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await orientationsApi.list({ domain, limit: 200 });
			catalog = res.data.orientations;
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('orientations.catalog.loadError');
		} finally {
			loading = false;
		}
	}

	function changeDomain(next: string) {
		domain = next;
		void load();
	}

	async function handleSubmit(picks: RegisterOrientationRequest[]) {
		submitting = true;
		error = '';
		try {
			// Register selections sequentially — the backend enforces uniqueness
			// per (user, slug) pair, so replay is a no-op. Sequential keeps the
			// primary flag deterministic if the backend derives it from insertion order.
			for (const pick of picks) {
				await orientationsApi.register(pick);
			}
			// Refresh /auth/me + capabilities so the store carries the new
			// orientations and the banner/soft-block disappears.
			await auth.init();
			done = true;
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('errors.generic');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{i18n.t('orientations.catalog.title')} | Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10">
	<header class="mb-8">
		<p class="text-xs font-mono uppercase tracking-widest text-text-muted">
			{i18n.locale === 'fr' ? 'Ton parcours' : 'Your path'}
		</p>
		<h1 class="mt-2 text-3xl font-bold text-text-primary">
			{i18n.t('orientations.catalog.title')}
		</h1>
		<p class="mt-2 text-text-muted">
			{i18n.t('orientations.catalog.subtitle')}
		</p>
	</header>

	{#if done}
		<section
			class="rounded-2xl border-2 border-accent/40 bg-surface-elevated p-10 text-center"
			role="status"
			aria-live="polite"
		>
			<h2 class="text-2xl font-bold text-text-primary">
				{i18n.t('orientations.catalog.savedTitle')}
			</h2>
			<p class="mt-2 text-text-muted">
				{i18n.t('orientations.catalog.savedSubtitle')}
			</p>
			<!-- Here rather than at signup: the trades are registered, so the
			     domain roles now exist and the matching channels open within
			     seconds of linking. The same click at signup would have granted
			     only the two roles every member already has. -->
			<div class="mx-auto mt-8 max-w-xl">
				<DiscordLinkCard>
					<Button
						variant="ghost"
						size="sm"
						onclick={() => goto(resolve('/challenges/onboarding'))}
					>
						{i18n.t('orientations.catalog.continueCta')}
					</Button>
				</DiscordLinkCard>
			</div>
		</section>
	{:else if loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<Skeleton class="h-52 w-full" rounded="xl" />
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{error}</p>
		</div>
	{:else}
		<OrientationSelector
			{catalog}
			onSubmit={handleSubmit}
			{submitting}
			{domain}
			onDomainChange={changeDomain}
		/>
	{/if}
</div>
