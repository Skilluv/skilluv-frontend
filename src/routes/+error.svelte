<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$components/ui/Button.svelte';
	import { i18n } from '$lib/i18n';
</script>

<svelte:head>
	<title>Erreur {$page.status} — Skilluv</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
	<p class="mb-4 text-6xl font-bold text-accent">{$page.status}</p>

	{#if $page.status === 404}
		<h1 class="mb-2 text-2xl font-bold">{i18n.t('errors.notFound')}</h1>
		<p class="mb-8 text-text-muted">{i18n.t('errors.notFoundMessage')}</p>
	{:else if $page.status === 403}
		<h1 class="mb-2 text-2xl font-bold">{i18n.t('errors.forbidden')}</h1>
		<p class="mb-8 text-text-muted">{i18n.t('errors.forbiddenMessage')}</p>
	{:else}
		<h1 class="mb-2 text-2xl font-bold">{i18n.t('errors.genericTitle')}</h1>
		<p class="mb-8 text-text-muted">{$page.error?.message ?? i18n.t('errors.genericMessage')}</p>
	{/if}

	<div class="flex gap-3">
		<Button variant="accent" href="/">{i18n.t('errors.backHome')}</Button>
		<Button variant="secondary" onclick={() => window.location.reload()}>{i18n.t('errors.retryBtn')}</Button>
	</div>
</div>
