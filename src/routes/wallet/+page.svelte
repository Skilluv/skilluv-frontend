<script lang="ts">
	import { onMount } from 'svelte';
	import { walletApi } from '$lib/api/wallet';
	import { SkilluError } from '$lib/api/client';
	import { i18n } from '$lib/i18n';
	import type { WalletBalance, WalletTransaction, PayoutRequest } from '$lib/types';
	import {
		WalletBalanceCard,
		TransactionRow,
		PayoutRow,
		PayoutRequestModal
	} from '$lib/components/wallet';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let balance = $state<WalletBalance | null>(null);
	let history = $state<WalletTransaction[]>([]);
	let payouts = $state<PayoutRequest[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let modalOpen = $state(false);

	onMount(async () => {
		await load();
	});

	async function load() {
		loading = true;
		loadError = '';
		try {
			const [bRes, hRes, pRes] = await Promise.allSettled([
				walletApi.balance(),
				walletApi.history({ page: 1, per_page: 25 }),
				walletApi.payouts({ page: 1, per_page: 25 })
			]);
			if (bRes.status === 'fulfilled') balance = bRes.value.data;
			if (hRes.status === 'fulfilled') history = hRes.value.data;
			if (pRes.status === 'fulfilled') payouts = pRes.value.data;
			if (bRes.status === 'rejected') {
				loadError =
					bRes.reason instanceof SkilluError ? bRes.reason.message : i18n.t('wallet.loadError');
			}
		} finally {
			loading = false;
		}
	}

	function openModal() {
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
	}

	async function handleSubmitted() {
		modalOpen = false;
		await load();
	}
</script>

<svelte:head>
	<title>{i18n.t('wallet.title')} — Skilluv</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-text-primary">{i18n.t('wallet.title')}</h1>
		<p class="mt-2 max-w-3xl text-text-muted">{i18n.t('wallet.subtitle')}</p>
	</header>

	{#if loading}
		<Skeleton class="mb-6 h-40 w-full" rounded="xl" />
		<Skeleton class="mb-6 h-40 w-full" rounded="xl" />
		<Skeleton class="h-40 w-full" rounded="xl" />
	{:else if loadError}
		<div class="rounded-2xl border border-error/40 bg-error/5 p-6 text-center" role="alert">
			<p class="text-sm text-error">{loadError}</p>
		</div>
	{:else}
		<div class="mb-8">
			<WalletBalanceCard {balance} onRequestPayout={openModal} disabled={!balance || balance.fragments < 100} />
		</div>

		<section
			class="mb-8 rounded-2xl border border-border bg-surface-elevated overflow-hidden"
			aria-labelledby="wallet-history-title"
		>
			<header class="border-b border-border px-4 py-3">
				<h2 id="wallet-history-title" class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('wallet.historyTitle')}
				</h2>
			</header>
			{#if history.length === 0}
				<div class="p-8 text-center text-sm text-text-muted">{i18n.t('wallet.historyEmpty')}</div>
			{:else}
				<ul role="list">
					{#each history as tx (tx.id)}
						<TransactionRow {tx} />
					{/each}
				</ul>
			{/if}
		</section>

		<section
			class="rounded-2xl border border-border bg-surface-elevated overflow-hidden"
			aria-labelledby="wallet-payouts-title"
		>
			<header class="border-b border-border px-4 py-3">
				<h2 id="wallet-payouts-title" class="text-xs font-bold uppercase tracking-wider text-text-muted">
					{i18n.t('wallet.payoutsTitle')}
				</h2>
			</header>
			{#if payouts.length === 0}
				<div class="p-8 text-center text-sm text-text-muted">{i18n.t('wallet.payoutsEmpty')}</div>
			{:else}
				<ul role="list">
					{#each payouts as p (p.id)}
						<PayoutRow payout={p} />
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</div>

<PayoutRequestModal open={modalOpen} {balance} onClose={closeModal} onSubmitted={handleSubmitted} />
