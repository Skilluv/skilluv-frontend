<script lang="ts">
	import { onMount } from 'svelte';
	import { walletApi } from '$lib/api/wallet';
	import { i18n } from '$lib/i18n';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { SkilluError } from '$lib/api/client';

	let redirecting = $state(true);

	onMount(async () => {
		try {
			// Stripe hit us on the refresh URL — it means the previous onboarding
			// link expired. Fetch the current wallet to know the residency country
			// (required by the onboard endpoint), then request a fresh URL.
			const walletRes = await walletApi.get();
			const country = walletRes.data.wallet.residency_country ?? 'FR';
			const res = await walletApi.stripeOnboard(country);
			window.location.href = res.data.onboarding_url;
		} catch (err) {
			redirecting = false;
			toast.error(err instanceof SkilluError ? err.message : i18n.t('errors.generic'));
		}
	});
</script>

<svelte:head>
	<title>{i18n.t('wallet.payoutModal.stripe.connectingLabel')} — Skilluv</title>
</svelte:head>

<div class="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
	{#if redirecting}
		<Skeleton class="mb-4 h-24 w-24" rounded="full" />
		<p class="text-sm text-text-muted">{i18n.t('wallet.payoutModal.stripe.connectingLabel')}</p>
	{:else}
		<p class="mb-4 text-sm text-error">{i18n.t('errors.generic')}</p>
		<Button variant="secondary" href="/wallet">{i18n.t('wallet.title')}</Button>
	{/if}
</div>
