<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { walletApi } from '$lib/api/wallet';
	import { i18n } from '$lib/i18n';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { CheckCircle, AlertTriangle } from '@lucide/svelte';

	let loading = $state(true);
	let connected = $state(false);

	onMount(async () => {
		try {
			const res = await walletApi.stripeStatus();
			connected = res.data.connected;
		} catch {
			connected = false;
		} finally {
			loading = false;
		}
		if (connected) {
			setTimeout(() => goto('/wallet'), 2000);
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('wallet.payoutModal.stripe.readyLabel')} — Skilluv</title>
</svelte:head>

<div class="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
	{#if loading}
		<Skeleton class="h-32 w-full" rounded="xl" />
	{:else if connected}
		<CheckCircle size={48} strokeWidth={1.5} class="mb-4 text-success" aria-hidden="true" />
		<h1 class="mb-2 text-2xl font-bold text-text-primary">
			{i18n.t('wallet.payoutModal.stripe.readyLabel')}
		</h1>
		<p class="mb-6 text-sm text-text-muted">
			{i18n.t('wallet.payoutModal.stripe.connectingLabel')}
		</p>
		<Button variant="primary" href="/wallet">{i18n.t('wallet.title')}</Button>
	{:else}
		<AlertTriangle size={48} strokeWidth={1.5} class="mb-4 text-warning" aria-hidden="true" />
		<h1 class="mb-2 text-2xl font-bold text-text-primary">
			{i18n.t('wallet.payoutModal.stripe.notConnected')}
		</h1>
		<Button variant="secondary" href="/wallet">{i18n.t('wallet.title')}</Button>
	{/if}
</div>
