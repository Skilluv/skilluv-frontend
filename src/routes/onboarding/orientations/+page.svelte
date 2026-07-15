<script lang="ts">
	import { goto } from '$app/navigation';
	import { orientationsApi } from '$lib/api/orientations';
	import { auth } from '$lib/stores/auth.svelte';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import { OrientationSelector } from '$lib/components/orientations';
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

	onMount(async () => {
		try {
			const res = await orientationsApi.list();
			catalog = res.data;
		} catch (err) {
			error = err instanceof SkilluError ? err.message : i18n.t('orientations.catalog.loadError');
		} finally {
			loading = false;
		}
	});

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
	<title>{i18n.t('orientations.catalog.title')} — Skilluv</title>
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
			<div class="mt-6">
				<Button variant="primary" onclick={() => goto('/challenges/onboarding')}>
					{i18n.t('orientations.catalog.continueCta')}
				</Button>
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
		<OrientationSelector {catalog} onSubmit={handleSubmit} {submitting} />
	{/if}
</div>
